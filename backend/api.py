from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import cv2
import numpy as np
import tensorflow as tf
from model import CustomModel, focal_tversky, tversky
import io
from PIL import Image
import base64
from flask_cors import CORS
import pydicom
import nibabel as nib
import gzip
import shutil
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.layers import Input
import logging
from model_clean import ResUNet, preprocess_image, postprocess_mask

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Allowed file extensions
ALLOWED_EXTENSIONS = {'dcm', 'nii', 'nii.gz', 'dicom', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def read_image(file_path):
    """Read image based on file extension"""
    extension = file_path.split('.')[-1].lower()
    
    if extension in ['dcm', 'dicom']:
        # Read DICOM
        ds = pydicom.dcmread(file_path)
        image = ds.pixel_array
        # Normalize DICOM image
        image = ((image - image.min()) / (image.max() - image.min()) * 255).astype(np.uint8)
    elif extension in ['nii', 'nii.gz']:
        # Read NIfTI
        if extension == 'nii.gz':
            with gzip.open(file_path, 'rb') as f_in:
                with open(file_path[:-3], 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            nii_path = file_path[:-3]
        else:
            nii_path = file_path
        
        img = nib.load(nii_path)
        image = img.get_fdata()
        if len(image.shape) == 3:
            image = image[:, :, image.shape[2]//2]
        # Normalize NIfTI image
        image = ((image - image.min()) / (image.max() - image.min()) * 255).astype(np.uint8)
    else:
        # Read regular image formats
        image = cv2.imread(file_path)
        if image is None:
            raise ValueError(f"Could not read image file: {file_path}")
    
    # Convert to RGB if needed
    if len(image.shape) == 3 and image.shape[2] == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Maintain aspect ratio while resizing
    if len(image.shape) == 2:
        h, w = image.shape
    else:
        h, w = image.shape[:2]
    
    # Calculate new dimensions maintaining aspect ratio
    max_dimension = 256
    scale = max_dimension / max(h, w)
    new_h = int(h * scale)
    new_w = int(w * scale)
    
    # Ensure minimum size
    if new_w < 32: new_w = 32
    if new_h < 32: new_h = 32
    
    # Apply image enhancements
    if len(image.shape) == 2:
        # For grayscale images
        # Apply CLAHE for better contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        image = clahe.apply(image)
    else:
        # For color images
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        # Merge channels
        lab = cv2.merge((l, a, b))
        # Convert back to RGB
        image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    
    # Resize with better quality
    image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    
    # Ensure proper data type and range
    image = np.clip(image, 0, 255).astype(np.uint8)
    
    return image

# Load the model
logger.info("Loading model...")
model = ResUNet()
logger.info("Model loaded successfully")

def predict_mask(image_path):
    # Preprocess the image
    img = preprocess_image(image_path)
    
    # Get prediction
    pred_mask = model.predict(img)
    pred_mask = pred_mask[0].squeeze().round()
    
    return pred_mask

def create_overlay_image(original_img, mask):
    # Create overlay image with mask
    overlay = original_img.copy()
    
    # Create a colored mask with better visibility
    colored_mask = np.zeros_like(original_img)
    colored_mask[mask > 0] = [0, 255, 0]  # Green color for tumor regions
    
    # Add edge highlighting
    edges = cv2.Canny(mask, 100, 200)
    colored_mask[edges > 0] = [255, 255, 0]  # Yellow edges
    
    # Create overlay with better alpha blending
    overlay = cv2.addWeighted(overlay, 0.7, colored_mask, 0.3, 0)
    
    # Add contour highlighting
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(overlay, contours, -1, (0, 255, 0), 1)
    
    return overlay

@app.route('/api/save_annotation', methods=['POST'])
def save_annotation():
    """Save an annotated image and its mask"""
    try:
        if 'image' not in request.files or 'mask' not in request.files:
            return jsonify({'error': 'No image or mask provided'}), 400
        
        image = request.files['image']
        mask = request.files['mask']
        
        if image.filename == '' or mask.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Save the image
        image_filename = secure_filename(image.filename)
        image_path = os.path.join('dataset', 'images', image_filename)
        image.save(image_path)
        
        # Save the mask
        mask_filename = secure_filename(mask.filename)
        mask_path = os.path.join('dataset', 'masks', mask_filename)
        mask.save(mask_path)
        
        return jsonify({'message': 'Annotation saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save the file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Read and preprocess the image
            logger.info("Reading and preprocessing image...")
            image = read_image(file_path)
            
            # Store original image for display
            if len(image.shape) == 2:
                display_image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            else:
                display_image = image.copy()
            
            # Preprocess for model
            preprocessed_image = preprocess_image(image)
            logger.info("Image preprocessing completed")

            # Make prediction
            logger.info("Making prediction...")
            mask = model.predict(preprocessed_image)
            logger.info("Prediction completed")

            # Postprocess the mask
            logger.info("Postprocessing mask...")
            processed_mask = postprocess_mask(mask)
            
            # Resize mask to match display image size
            processed_mask = cv2.resize(processed_mask, (display_image.shape[1], display_image.shape[0]), 
                                     interpolation=cv2.INTER_NEAREST)
            
            # Ensure mask is 2D
            if len(processed_mask.shape) == 3:
                processed_mask = processed_mask[:, :, 0]
            
            # Normalize mask for visualization
            if processed_mask.max() > 0:  # Only normalize if mask is not all zeros
                processed_mask = ((processed_mask - processed_mask.min()) / 
                                (processed_mask.max() - processed_mask.min()) * 255).astype(np.uint8)
            
            # Create colored mask for better visibility
            colored_mask = np.zeros_like(display_image)
            colored_mask[processed_mask > 0] = [0, 255, 0]  # Green color for tumor
            
            logger.info("Mask postprocessing completed")

            # Create overlay with better visibility
            logger.info("Creating overlay...")
            # Use addWeighted with better alpha values for visibility
            overlay = cv2.addWeighted(display_image, 0.7, colored_mask, 0.3, 0)
            
            # Add contours for better edge visibility
            contours, _ = cv2.findContours(processed_mask.astype(np.uint8), 
                                         cv2.RETR_EXTERNAL, 
                                         cv2.CHAIN_APPROX_SIMPLE)
            if contours:  # Only draw contours if we found any
                cv2.drawContours(overlay, contours, -1, (0, 255, 0), 1)
            
            logger.info("Overlay created")

            # Calculate tumor area percentage
            logger.info("Calculating tumor area percentage...")
            tumor_pixels = np.sum(processed_mask > 0)
            total_pixels = processed_mask.shape[0] * processed_mask.shape[1]
            tumor_percentage = (tumor_pixels / total_pixels) * 100
            logger.info(f"Tumor area percentage: {tumor_percentage:.2f}%")

            # Ensure the mask is visible by scaling to full range
            processed_mask_display = cv2.cvtColor(processed_mask, cv2.COLOR_GRAY2BGR)
            
            # Compress images for transfer while maintaining quality
            encode_params = [cv2.IMWRITE_PNG_COMPRESSION, 9]
            
            # Convert to BGR for imencode
            display_image_bgr = cv2.cvtColor(display_image, cv2.COLOR_RGB2BGR)
            colored_mask_bgr = cv2.cvtColor(colored_mask, cv2.COLOR_RGB2BGR)
            overlay_bgr = cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)
            
            _, original_encoded = cv2.imencode('.png', display_image_bgr, encode_params)
            _, mask_encoded = cv2.imencode('.png', processed_mask_display, encode_params)
            _, overlay_encoded = cv2.imencode('.png', overlay_bgr, encode_params)

            original_base64 = base64.b64encode(original_encoded).decode('utf-8')
            mask_base64 = base64.b64encode(mask_encoded).decode('utf-8')
            overlay_base64 = base64.b64encode(overlay_encoded).decode('utf-8')
            logger.info("Image conversion completed")

            return jsonify({
                'original': original_base64,
                'mask': mask_base64,
                'overlay': overlay_base64,
                'tumor_percentage': float(tumor_percentage),
                'image_size': {
                    'width': display_image.shape[1],
                    'height': display_image.shape[0]
                }
            })

        finally:
            # Clean up the temporary file
            if os.path.exists(file_path):
                os.remove(file_path)

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server...")
    app.run(debug=True) 