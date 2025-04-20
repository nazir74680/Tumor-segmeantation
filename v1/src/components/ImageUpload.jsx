import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, Image as ImageIcon, Loader2, ZoomIn, Brain } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['dcm', 'nii', 'nii.gz', 'dicom', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for medical images
const MEDICAL_IMAGE_KEYWORDS = ['mri', 'scan', 'tumor', 'brain', 'ct', 'xray', 'medical'];

export const ImageUpload = ({ onUploadComplete }) => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [annotation, setAnnotation] = useState(null);
    const canvasRef = useRef(null);

    const validateMedicalImage = (file) => {
        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            throw new Error('Please upload only medical imaging formats (DICOM, NIfTI, or medical images)');
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size should be less than 50MB');
        }

        // Check filename for medical keywords
        const filename = file.name.toLowerCase();
        const isMedicalImage = MEDICAL_IMAGE_KEYWORDS.some(keyword => filename.includes(keyword));

        if (!isMedicalImage) {
            throw new Error('Please upload only medical scan images');
        }

        return true;
    };

    const analyzeMedicalImage = (imageData) => {
        // Simulated medical image analysis
        return {
            tumorProbability: Math.random() * 100,
            location: {
                x: Math.floor(Math.random() * 100),
                y: Math.floor(Math.random() * 100),
            },
            size: Math.floor(Math.random() * 50),
            confidence: Math.floor(Math.random() * 100),
        };
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const processFiles = async (newFiles) => {
        setUploading(true);
        setError('');

        try {
            for (const file of newFiles) {
                validateMedicalImage(file);

                if (file.type.startsWith('image/')) {
                    const formData = new FormData();
                    formData.append('file', file);

                    // Call the actual API
                    const response = await fetch('http://127.0.0.1:5000/api/predict', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('Failed to process image');
                    }

                    const data = await response.json();

                    // Update the preview and analysis with real data
                    setPreview(`data:image/png;base64,${data.original}`);
                    setSelectedImage(`data:image/png;base64,${data.original}`);
                    
                    // Create analysis object from API response
                    const analysis = {
                        tumorProbability: data.tumor_percentage,
                        originalImage: data.original,
                        maskImage: data.mask,
                        overlayImage: data.overlay
                    };
                    
                    setAnalysis(analysis);
                }
            }

            setFiles(prev => [...prev, ...newFiles]);

        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = [...e.dataTransfer.files];
        await processFiles(droppedFiles);
    };

    const handleChange = async (e) => {
        e.preventDefault();
        const newFiles = [...e.target.files];
        await processFiles(newFiles);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        if (files.length === 1) {
            setPreview(null);
            setSelectedImage(null);
            setAnalysis(null);
        }
    };

    const handleAnnotation = (e) => {
        if (!isAnnotating || !currentImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Update annotation state
        const newAnnotation = annotation || new ImageData(canvas.width, canvas.height);
        const index = (y * canvas.width + x) * 4;
        newAnnotation.data[index] = 255;     // R
        newAnnotation.data[index + 1] = 255; // G
        newAnnotation.data[index + 2] = 255; // B
        newAnnotation.data[index + 3] = 255; // A
        setAnnotation(newAnnotation);
    };

    const saveAnnotation = async () => {
        if (!currentImage || !annotation) return;

        try {
            // Convert annotation to blob
            const canvas = canvasRef.current;
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            
            // Create FormData
            const formData = new FormData();
            formData.append('image', currentImage);
            formData.append('mask', blob);

            // Send to backend
            const response = await fetch('http://127.0.0.1:5000/api/save_annotation', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to save annotation');
            }

            // Reset states
            setIsAnnotating(false);
            setCurrentImage(null);
            setAnnotation(null);
            setPreview(null);
            setFiles([]);

            alert('Annotation saved successfully!');
        } catch (error) {
            setError('Failed to save annotation: ' + error.message);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div
                className={`relative p-8 border-2 border-dashed rounded-lg transition-all duration-300 ease-in-out ${
                    dragActive
                        ? 'border-blue-500 bg-blue-50 scale-102'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".dcm,.nii,.nii.gz,.dicom,.jpg,.jpeg,.png"
                    multiple
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="text-center">
                    <Brain className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500 animate-bounce' : 'text-gray-400'}`} />
                    <p className="mt-2 text-sm text-gray-600">
                        Drag and drop medical scan images here, or click to select files
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Supported formats: DICOM, NIfTI, JPEG, PNG (Max 50MB)
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 rounded-lg flex items-center text-red-700 animate-shake">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {uploading && (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg animate-pulse">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-500" />
                    <p className="text-sm text-blue-700">Processing medical scan...</p>
                </div>
            )}

            {selectedImage && analysis && (
                <div className="mt-4 bg-gray-50 rounded-lg p-6 animate-fadeIn">
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Medical Scan Analysis</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">Original Image</h4>
                                <img
                                    src={`data:image/png;base64,${analysis.originalImage}`}
                                    alt="Original MRI"
                                    className="w-full rounded-lg object-contain border border-gray-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">Segmentation Mask</h4>
                                <img
                                    src={`data:image/png;base64,${analysis.maskImage}`}
                                    alt="Segmentation Mask"
                                    className="w-full rounded-lg object-contain border border-gray-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">Overlay</h4>
                                <img
                                    src={`data:image/png;base64,${analysis.overlayImage}`}
                                    alt="Overlay"
                                    className="w-full rounded-lg object-contain border border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700">Analysis Results</h4>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Tumor Area:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {analysis.tumorProbability.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 animate-slideIn hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-center">
                                <ImageIcon className="h-5 w-5 text-blue-500 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setSelectedImage(preview)}
                                    className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-500"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="p-1 hover:bg-red-50 rounded-full transition-colors text-red-500"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {preview && (
                <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Preview</h3>
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-w-full h-auto rounded-lg"
                        />
                        {isAnnotating && (
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                                width={256}
                                height={256}
                                onMouseMove={handleAnnotation}
                                onClick={handleAnnotation}
                            />
                        )}
                    </div>
                    
                    {!isAnnotating && (
                        <button
                            onClick={() => {
                                setIsAnnotating(true);
                                setCurrentImage(files[0]);
                            }}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Annotate Tumor Region
                        </button>
                    )}

                    {isAnnotating && (
                        <div className="mt-2 space-x-2">
                            <button
                                onClick={saveAnnotation}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Save Annotation
                            </button>
                            <button
                                onClick={() => {
                                    setIsAnnotating(false);
                                    setAnnotation(null);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
