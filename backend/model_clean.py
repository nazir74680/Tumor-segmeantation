import tensorflow as tf
from tensorflow.keras import layers, Model
import numpy as np
import cv2

class ResUNet:
    def __init__(self):
        self.model = self.build_model()
        
    def build_model(self):
        inputs = tf.keras.layers.Input(shape=(256, 256, 1))
        
        # Encoder
        conv1 = tf.keras.layers.Conv2D(64, 3, activation='relu', padding='same')(inputs)
        conv1 = tf.keras.layers.Conv2D(64, 3, activation='relu', padding='same')(conv1)
        pool1 = tf.keras.layers.MaxPooling2D(pool_size=(2, 2))(conv1)
        
        conv2 = tf.keras.layers.Conv2D(128, 3, activation='relu', padding='same')(pool1)
        conv2 = tf.keras.layers.Conv2D(128, 3, activation='relu', padding='same')(conv2)
        pool2 = tf.keras.layers.MaxPooling2D(pool_size=(2, 2))(conv2)
        
        conv3 = tf.keras.layers.Conv2D(256, 3, activation='relu', padding='same')(pool2)
        conv3 = tf.keras.layers.Conv2D(256, 3, activation='relu', padding='same')(conv3)
        pool3 = tf.keras.layers.MaxPooling2D(pool_size=(2, 2))(conv3)
        
        # Bridge
        conv4 = tf.keras.layers.Conv2D(512, 3, activation='relu', padding='same')(pool3)
        conv4 = tf.keras.layers.Conv2D(512, 3, activation='relu', padding='same')(conv4)
        
        # Decoder
        up5 = tf.keras.layers.UpSampling2D(size=(2, 2))(conv4)
        up5 = tf.keras.layers.Conv2D(256, 2, activation='relu', padding='same')(up5)
        merge5 = tf.keras.layers.concatenate([conv3, up5], axis=3)
        conv5 = tf.keras.layers.Conv2D(256, 3, activation='relu', padding='same')(merge5)
        conv5 = tf.keras.layers.Conv2D(256, 3, activation='relu', padding='same')(conv5)
        
        up6 = tf.keras.layers.UpSampling2D(size=(2, 2))(conv5)
        up6 = tf.keras.layers.Conv2D(128, 2, activation='relu', padding='same')(up6)
        merge6 = tf.keras.layers.concatenate([conv2, up6], axis=3)
        conv6 = tf.keras.layers.Conv2D(128, 3, activation='relu', padding='same')(merge6)
        conv6 = tf.keras.layers.Conv2D(128, 3, activation='relu', padding='same')(conv6)
        
        up7 = tf.keras.layers.UpSampling2D(size=(2, 2))(conv6)
        up7 = tf.keras.layers.Conv2D(64, 2, activation='relu', padding='same')(up7)
        merge7 = tf.keras.layers.concatenate([conv1, up7], axis=3)
        conv7 = tf.keras.layers.Conv2D(64, 3, activation='relu', padding='same')(merge7)
        conv7 = tf.keras.layers.Conv2D(64, 3, activation='relu', padding='same')(conv7)
        
        # Output
        outputs = tf.keras.layers.Conv2D(1, 1, activation='sigmoid')(conv7)
        
        model = tf.keras.Model(inputs=inputs, outputs=outputs)
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model
    
    def predict(self, x):
        return self.model.predict(x)

def preprocess_image(image):
    """Preprocess the image for model input"""
    # Convert to grayscale if needed
    if len(image.shape) == 3:
        if image.shape[2] == 3:  # RGB image
            image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        elif image.shape[2] == 1:  # Single channel image
            image = image[:, :, 0]
    
    # Ensure image is 2D
    if len(image.shape) > 2:
        image = image[:, :, 0]
    
    # Resize to 256x256
    image = cv2.resize(image, (256, 256))
    
    # Enhance contrast using CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    image = clahe.apply(image.astype(np.uint8))
    
    # Normalize to [0, 1]
    image = image.astype(np.float32) / 255.0
    
    # Add channel dimension
    image = np.expand_dims(image, axis=-1)
    
    # Add batch dimension
    image = np.expand_dims(image, axis=0)
    
    return image

def postprocess_mask(mask):
    """Postprocess the model output mask"""
    # Remove batch dimension
    mask = mask[0]
    
    # Remove channel dimension if present
    if len(mask.shape) == 3:
        mask = mask[:, :, 0]
    
    # Normalize prediction to 0-1 range
    mask = (mask - mask.min()) / (mask.max() - mask.min() + 1e-8)
    
    # Convert to uint8 and scale to 0-255
    mask = (mask * 255).astype(np.uint8)
    
    # Apply Otsu's thresholding
    _, binary_mask = cv2.threshold(mask, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Apply morphological operations to clean up the mask
    kernel = np.ones((3,3), np.uint8)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel, iterations=1)
    
    # Filter out small components and keep the largest one
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary_mask, connectivity=8)
    sizes = stats[1:, -1]
    max_label = 1 + np.argmax(sizes)  # Find the largest component
    binary_mask = np.zeros((labels.shape), np.uint8)
    binary_mask[labels == max_label] = 255
    
    # Keep original values where binary mask is true
    mask = cv2.bitwise_and(mask, binary_mask)
    
    return mask 