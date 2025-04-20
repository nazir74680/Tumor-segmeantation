import os
import numpy as np
import cv2
from model import CustomModel
import tensorflow as tf
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.model_selection import train_test_split
from io import BytesIO
import base64

def setup_data_generators(train_df, test_df, batch_size=16):
    """Setup data generators for training and testing"""
    # Create image generators
    datagen = ImageDataGenerator(
        rescale=1./255.,
        validation_split=0.15
    )
    
    train_generator = datagen.flow_from_dataframe(
        dataframe=train_df,
        directory='./',
        x_col='image_path',
        y_col='mask',
        subset="training",
        batch_size=batch_size,
        shuffle=True,
        class_mode="categorical",
        target_size=(256, 256)
    )
    
    valid_generator = datagen.flow_from_dataframe(
        dataframe=train_df,
        directory='./',
        x_col='image_path',
        y_col='mask',
        subset="validation",
        batch_size=batch_size,
        shuffle=True,
        class_mode="categorical",
        target_size=(256, 256)
    )
    
    test_datagen = ImageDataGenerator(rescale=1./255.)
    test_generator = test_datagen.flow_from_dataframe(
        dataframe=test_df,
        directory='./',
        x_col='image_path',
        y_col='mask',
        batch_size=batch_size,
        shuffle=False,
        class_mode='categorical',
        target_size=(256, 256)
    )
    
    return train_generator, valid_generator, test_generator

def train_model(train_df, test_df, epochs=50, batch_size=16):
    """Train the model using data generators"""
    try:
        # Create model
        model = CustomModel(input_shape=(256, 256, 3))
        
        # Setup data generators
        train_generator, valid_generator, test_generator = setup_data_generators(train_df, test_df, batch_size)
        
        # Define callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                mode='min',
                verbose=1,
                patience=20
            ),
            ModelCheckpoint(
                filepath="classifier-resnet-weights.h5",
                verbose=1,
                save_best_only=True
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6
            )
        ]
        
        # Train the model
        history = model.fit(
            train_generator,
            steps_per_epoch=train_generator.n // batch_size,
            epochs=epochs,
            validation_data=valid_generator,
            validation_steps=valid_generator.n // batch_size,
            callbacks=callbacks
        )
        
        return model, history, test_generator
        
    except Exception as e:
        print(f"Error in training: {str(e)}")
        return None, None, None

def process_image_for_prediction(image_path):
    """Process image exactly as in the working implementation"""
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read the image")
            
        # Convert to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to model input size
        img = cv2.resize(img, (256, 256))
        
        # Normalize to [0,1]
        img = img.astype(np.float32) / 255.0
        
        return img
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None

def create_overlay(original_img, mask, alpha=0.5):
    """Create overlay of mask on original image"""
    # Ensure mask is binary
    mask = (mask > 0.5).astype(np.uint8)
    
    # Create colored mask (green for tumor)
    colored_mask = np.zeros_like(original_img)
    colored_mask[mask == 1] = [0, 255, 0]  # Green color
    
    # Create overlay
    overlay = cv2.addWeighted(original_img, 1, colored_mask, alpha, 0)
    return overlay

def figure_to_base64(fig):
    """Convert matplotlib figure to base64 string"""
    buf = BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    buf.seek(0)
    image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    buf.close()
    plt.close(fig)
    return image_base64

def predict_and_visualize(model, image_path):
    """Predict and create visualization for tumor segmentation"""
    try:
        # Process image
        img = process_image_for_prediction(image_path)
        if img is None:
            return None
        
        # Add batch dimension
        img_batch = np.expand_dims(img, axis=0)
        
        # Get prediction
        prediction = model.predict(img_batch)
        mask = prediction[0].squeeze()
        
        # Create visualization
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        
        # Original
        axes[0].imshow(img)
        axes[0].axis('off')
        axes[0].set_title('Original MRI')
        
        # Mask
        axes[1].imshow(mask, cmap='gray')
        axes[1].axis('off')
        axes[1].set_title('Segmentation Mask')
        
        # Overlay
        overlay = create_overlay(img, mask)
        axes[2].imshow(overlay)
        axes[2].axis('off')
        axes[2].set_title('Segmentation Overlay')
        
        plt.tight_layout()
        
        # Convert images to base64
        # Original
        original_img = (img * 255).astype(np.uint8)
        _, original_encoded = cv2.imencode('.png', cv2.cvtColor(original_img, cv2.COLOR_RGB2BGR))
        original_base64 = base64.b64encode(original_encoded).decode('utf-8')
        
        # Mask
        mask_img = (mask * 255).astype(np.uint8)
        _, mask_encoded = cv2.imencode('.png', mask_img)
        mask_base64 = base64.b64encode(mask_encoded).decode('utf-8')
        
        # Overlay
        _, overlay_encoded = cv2.imencode('.png', cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        overlay_base64 = base64.b64encode(overlay_encoded).decode('utf-8')
        
        # Calculate tumor percentage
        tumor_percentage = float(np.mean(mask) * 100)
        
        return {
            'original': original_base64,
            'mask': mask_base64,
            'overlay': overlay_base64,
            'tumor_percentage': tumor_percentage,
            'success': True
        }
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def load_trained_model():
    """Load the pre-trained model"""
    try:
        # Create model instance
        model = CustomModel(input_shape=(256, 256, 3))
        
        # Load weights if they exist
        weights_path = os.path.join(os.path.dirname(__file__), 'weights_seg.h5')
        if os.path.exists(weights_path):
            try:
                model.load_weights(weights_path)
                print("Model loaded successfully!")
            except Exception as e:
                print(f"Warning: Could not load weights: {str(e)}")
                print("Using untrained model instead.")
        else:
            print("No pre-trained weights found. Using untrained model.")
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return None

if __name__ == '__main__':
    try:
        # Load the model
        model = load_trained_model()
        if model is None:
            raise ValueError("Failed to load model")
        
        print("Model loaded successfully. Ready to process images.")
        print("\nAvailable functions:")
        print("1. predict_and_visualize(model, image_path)")
        print("   - Returns predicted class and confidence")
        print("2. train_model(train_df, test_df, epochs=50, batch_size=16)")
        print("   - Trains the model on provided data")
            
    except Exception as e:
        print(f"Error in main execution: {str(e)}") 