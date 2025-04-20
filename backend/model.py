import tensorflow as tf
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, AveragePooling2D, Flatten, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.applications.resnet50 import ResNet50
import numpy as np
import cv2
import matplotlib.pyplot as plt

@tf.keras.utils.register_keras_serializable()
def focal_tversky(y_true, y_pred):
    """Focal Tversky loss for better handling of class imbalance."""
    alpha = 0.7
    beta = 0.3
    gamma = 4/3
    epsilon = 1e-6
    
    y_true = tf.cast(y_true, tf.float32)
    y_pred = tf.clip_by_value(y_pred, epsilon, 1. - epsilon)
    
    tp = tf.reduce_sum(y_true * y_pred, axis=[1,2,3])
    fp = tf.reduce_sum((1-y_true) * y_pred, axis=[1,2,3])
    fn = tf.reduce_sum(y_true * (1-y_pred), axis=[1,2,3])
    
    tversky = (tp + epsilon)/(tp + alpha*fp + beta*fn + epsilon)
    focal_tversky = tf.pow((1-tversky), gamma)
    
    return tf.reduce_mean(focal_tversky)

@tf.keras.utils.register_keras_serializable()
def tversky(y_true, y_pred):
    """Tversky index for evaluation."""
    alpha = 0.7
    beta = 0.3
    epsilon = 1e-6
    
    y_true = tf.cast(y_true, tf.float32)
    y_pred = tf.clip_by_value(y_pred, epsilon, 1. - epsilon)
    
    tp = tf.reduce_sum(y_true * y_pred, axis=[1,2,3])
    fp = tf.reduce_sum((1-y_true) * y_pred, axis=[1,2,3])
    fn = tf.reduce_sum(y_true * (1-y_pred), axis=[1,2,3])
    
    return tf.reduce_mean((tp + epsilon)/(tp + alpha*fp + beta*fn + epsilon))

@tf.keras.utils.register_keras_serializable()
class CustomModel(Model):
    def __init__(self, input_shape=(256, 256, 3)):
        super(CustomModel, self).__init__()
        
        # Get the ResNet50 base model
        self.basemodel = ResNet50(weights='imagenet', include_top=False, input_tensor=Input(shape=input_shape))
        
        # Freeze the base model layers
        for layer in self.basemodel.layers:
            layer.trainable = False
        
        # Add classification head
        x = self.basemodel.output
        x = AveragePooling2D(pool_size=(4, 4))(x)
        x = Flatten(name='flatten')(x)
        x = Dense(256, activation="relu")(x)
        x = Dropout(0.3)(x)
        x = Dense(256, activation="relu")(x)
        x = Dropout(0.3)(x)
        output = Dense(2, activation='softmax')(x)
        
        # Build the model
        super().__init__(inputs=self.basemodel.input, outputs=output)
    
    def compile(self, **kwargs):
        if 'optimizer' not in kwargs:
            kwargs['optimizer'] = 'adam'
        if 'loss' not in kwargs:
            kwargs['loss'] = 'categorical_crossentropy'
        if 'metrics' not in kwargs:
            kwargs['metrics'] = ["accuracy"]
        
        super().compile(**kwargs)

def predict_tumor(model, image_path):
    """Predict tumor for a given image."""
    # Read and preprocess image
    img = cv2.imread(image_path)
    img = cv2.resize(img, (256, 256))
    img = img / 255.0  # Rescale to [0,1]
    img = np.expand_dims(img, axis=0)
    
    # Predict
    prediction = model.predict(img)
    predicted_class = np.argmax(prediction[0])
    
    return predicted_class, prediction[0]

def visualize_prediction(image_path, true_mask_path=None, model=None):
    """Visualize the tumor detection results."""
    # Read image
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (256, 256))
    
    # Create figure
    if true_mask_path:
        fig, axs = plt.subplots(1, 3, figsize=(15, 5))
    else:
        fig, axs = plt.subplots(1, 2, figsize=(10, 5))
    
    # Original MRI
    axs[0].set_title("Brain MRI")
    axs[0].imshow(img)
    
    if model:
        # Get prediction
        pred_class, pred_probs = predict_tumor(model, image_path)
        pred_label = "Tumor" if pred_class == 1 else "No Tumor"
        confidence = pred_probs[pred_class] * 100
        
        axs[1].set_title(f"Prediction: {pred_label}\nConfidence: {confidence:.2f}%")
        if true_mask_path:
            mask = cv2.imread(true_mask_path, 0)
            mask = cv2.resize(mask, (256, 256))
            axs[1].imshow(mask, cmap='gray')
            
            # Overlay prediction
            img_overlay = img.copy()
            if pred_class == 1:  # If tumor predicted
                img_overlay[mask > 127] = [0, 255, 0]  # Green overlay
            axs[2].set_title("Overlay")
            axs[2].imshow(img_overlay)
    
    plt.tight_layout()
    return fig

def create_model(input_shape=(256, 256, 3)):
    """Create and compile the model."""
    model = CustomModel(input_shape)
    model.compile()
    return model

if __name__ == "__main__":
    # Create model
    model = create_model()
    model.build((None, 256, 256, 3))
    model.summary()