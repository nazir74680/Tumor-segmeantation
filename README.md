# Tumor Segmentation Project

This project implements a deep learning-based solution for tumor segmentation in medical images. It uses a ResUNet architecture to automatically detect and segment tumor regions in various medical image formats.

## Features

- Support for multiple medical image formats (DICOM, NIfTI, JPG, PNG)
- Advanced image preprocessing and enhancement
- Deep learning-based tumor segmentation
- RESTful API for easy integration
- Cross-origin resource sharing (CORS) support
- Comprehensive error handling and logging

## Prerequisites

- Python 3.7+
- TensorFlow 2.x
- Flask
- OpenCV
- NumPy
- Pydicom
- Nibabel
- Flask-CORS

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nazir74680/Tumor-segmeantation.git
cd Tumor-segmeantation
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Project Structure

```
tumor-segmentation/
├── backend/
│   ├── api.py              # Flask API implementation
│   ├── model_clean.py      # ResUNet model implementation
│   ├── model.py            # Additional model utilities
│   ├── train_model.py      # Model training script
│   ├── weights_seg.h5      # Pre-trained model weights
│   └── uploads/            # Temporary storage for uploaded images
├── frontend/               # Frontend application
└── README.md               # Project documentation
```

## Usage

### Starting the Backend Server

1. Navigate to the backend directory:
```bash
cd backend
```

2. Start the Flask server:
```bash
python api.py
```

The server will start on `http://localhost:5000`

### Starting the Frontend

1. Navigate to the frontend directory:
```bash
cd v1
```

2. Install frontend dependencies:
```bash
npm run dev
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

Note: Make sure the backend server is running before starting the frontend application.

### API Endpoints

1. **Tumor Segmentation**
   - Endpoint: `/api/predict`
   - Method: POST
   - Input: Medical image file (DICOM, NIfTI, JPG, PNG)
   - Output: JSON response with segmentation results

2. **Save Annotation**
   - Endpoint: `/api/save_annotation`
   - Method: POST
   - Input: Image and mask files
   - Output: Success/error message

### Example API Usage

```python
import requests

# Tumor segmentation
url = 'http://localhost:5000/api/predict'
files = {'file': open('path/to/image.dcm', 'rb')}
response = requests.post(url, files=files)
result = response.json()

# Save annotation
url = 'http://localhost:5000/api/save_annotation'
files = {
    'image': open('path/to/image.jpg', 'rb'),
    'mask': open('path/to/mask.png', 'rb')
}
response = requests.post(url, files=files)
result = response.json()
```

## Model Architecture

The project uses a ResUNet architecture, which combines the benefits of U-Net with residual connections:

- Input: 256x256 grayscale medical images
- Encoder: Multiple convolutional layers with ReLU activation
- Decoder: Up-sampling layers with skip connections
- Output: Binary segmentation mask

## Image Processing Pipeline

1. **Preprocessing**:
   - Image resizing to 256x256
   - Contrast enhancement using CLAHE
   - Normalization to [0, 1] range
   - Grayscale conversion

2. **Postprocessing**:
   - Thresholding using Otsu's method
   - Morphological operations
   - Connected component analysis
   - Overlay creation for visualization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Medical imaging community
- Open-source deep learning frameworks
- Research papers and publications in medical image segmentation # Tumor-segmeantation
