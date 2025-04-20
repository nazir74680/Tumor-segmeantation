import React, { useState, useEffect } from 'react';
import io from 'socket.io-client'; // Import Socket.IO client
import { useAuth } from '../context/AuthContext';
import {
    Brain, LogOut, Upload, Activity, FileText, Clock, X,
    Eye, Download, AlertCircle, CheckCircle, RefreshCw,
    Search, Plus, BarChart2, Settings, Trash2, Image as ImageIcon
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const UserDashboard = () => {
    const { user, logout } = useAuth();
    const [showUpload, setShowUpload] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [showScanDetails, setShowScanDetails] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [processingStatus, setProcessingStatus] = useState('');
    const [error, setError] = useState('');
    const [files, setFiles] = useState([]);
    const [totalScans, setTotalScans] = useState(0); // State for total scans
    const [processingScans, setProcessingScans] = useState(0); // State for processing scans

    // Connect to the Socket.IO server
    useEffect(() => {
        const socket = io('http://localhost:5000'); // Adjust the URL as needed

        socket.on('update_counts', (data) => {
            setTotalScans(data.total_scans);
            setProcessingScans(data.processing_scans);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Define allowed medical image formats
    const MEDICAL_EXTENSIONS = {
        'dcm': 'DICOM Image',
        'dicom': 'DICOM Image',
        'nii': 'NIfTI Image',
        'nii.gz': 'Compressed NIfTI Image',
        'jpg': 'JPEG Image',
        'jpeg': 'JPEG Image',
        'png': 'PNG Image'
    };

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const validateMedicalImage = (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const fullExtension = file.name.endsWith('.nii.gz') ? 'nii.gz' : extension;

        if (!MEDICAL_EXTENSIONS[fullExtension]) {
            throw new Error(`Invalid medical image format. Supported formats: DICOM (.dcm, .dicom), NIfTI (.nii, .nii.gz), and standard formats (.jpg, .jpeg, .png)`);
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size exceeds 50MB limit');
        }

        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
    };

    const handleFiles = (selectedFiles) => {
        setError('');
        setUploadStatus('Validating medical images...');

        try {
            selectedFiles.forEach(validateMedicalImage);
            setFiles(selectedFiles);
            setUploadStatus('Medical images ready for upload');
        } catch (err) {
            setError(err.message);
            setUploadStatus('');
            setFiles([]);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError('Please select medical scan images to upload');
            return;
        }

        setUploadStatus('Uploading medical scans...');
        setError('');

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('filename', file.name);  // Add filename to help backend identify file type
                
                setProcessingStatus(`Processing ${file.name}...`);
                const response = await fetch('http://127.0.0.1:5000/api/predict', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to process medical scan');
                }

                const data = await response.json();
                
                // Ensure we're getting proper base64 images
                if (!data.original || !data.mask || !data.overlay) {
                    throw new Error('Invalid response format from server');
                }

                // Create a new scan entry with proper image data
                const newScan = {
                    id: Date.now(),
                    name: file.name,
                    date: new Date().toISOString().split('T')[0],
            status: 'Completed',
                    tumorType: data.tumor_type || 'Analysis Complete',
                    results: {
                        original: data.original,  // Base64 image
                        mask: data.mask,         // Base64 image
                        overlay: data.overlay,   // Base64 image
                        tumorPercentage: data.tumor_percentage || 0
                    }
                };

                setRecentScans(prev => [newScan, ...prev]);
                setProcessingStatus('Analysis complete!');
                setUploadStatus('Upload successful');
            } catch (err) {
                setError(`Error processing ${file.name}: ${err.message}`);
                setProcessingStatus('Processing failed');
            }
        }

        // Reset states after processing all files
        setTimeout(() => {
            setShowUpload(false);
            setFiles([]);
            setUploadStatus('');
            setProcessingStatus('');
            setError('');
        }, 2000);
    };

    const handleCloseModal = () => {
        setShowUpload(false);
        setShowScanDetails(false);
        setSelectedScan(null);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    const handleViewScan = (scan) => {
        setSelectedScan(scan);
        setShowScanDetails(true);
    };

    const ScanDetailsModal = () => {
        if (!selectedScan) return null;

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative mx-auto p-5 border-0 w-11/12 max-w-5xl my-10 shadow-2xl rounded-xl bg-[#1a2234]">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-lg font-medium text-gray-200 flex items-center">
                            <Brain className="h-5 w-5 mr-2 text-blue-400" />
                            Brain MRI Analysis Results
                        </h3>
                    <button
                        onClick={handleCloseModal}
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                            <X className="h-5 w-5" />
                    </button>
                </div>
                    
                    {/* Main Content */}
                    <div className="flex flex-col space-y-4">
                        {/* Images Container */}
                        <div className="bg-[#0f1623] rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4">
                                {/* Original MRI */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-400 flex items-center">
                                        <ImageIcon className="h-4 w-4 mr-2 text-blue-400" />
                                        Original MRI
                                    </h4>
                                    <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                                        <img 
                                            src={`data:image/png;base64,${selectedScan.results.original}`}
                                            alt="Original MRI"
                                            className="object-contain w-full h-full"
                                            style={{ imageRendering: 'crisp-edges' }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Segmentation Mask */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-400 flex items-center">
                                        <Activity className="h-4 w-4 mr-2 text-green-400" />
                                        Segmentation Mask
                                    </h4>
                                    <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                                        <img 
                                            src={`data:image/png;base64,${selectedScan.results.mask}`}
                                            alt="Segmentation Mask"
                                            className="object-contain w-full h-full"
                                            style={{ imageRendering: 'crisp-edges' }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Overlay */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-400 flex items-center">
                                        <Eye className="h-4 w-4 mr-2 text-purple-400" />
                                        Segmentation Overlay
                                    </h4>
                                    <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                                        <img 
                                            src={`data:image/png;base64,${selectedScan.results.overlay}`}
                                            alt="Segmentation Overlay"
                                            className="object-contain w-full h-full"
                                            style={{ imageRendering: 'crisp-edges' }}
                                        />
                                    </div>
                        </div>
                            </div>
                        </div>

                        {/* Analysis Results */}
                        <div className="bg-[#0f1623] rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                                <BarChart2 className="h-4 w-4 mr-2 text-blue-400" />
                                Analysis Results
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Tumor Area Coverage:</span>
                                    <span className="text-xl font-semibold text-blue-400">
                                        {selectedScan.results.tumorPercentage.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                    </div>
            </div>
            </div>
        </div>
    );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation */}
            <nav className="bg-white shadow-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Brain className="h-8 w-8 text-indigo-600 animate-pulse" />
                            <span className="ml-2 text-2xl font-extrabold text-gray-900 tracking-tight">
                                Tumor Segmentation
                            </span>
                            <span className="ml-4 text-sm text-gray-500 italic">Precision Imaging</span>
                        </div>
                        <div className="flex items-center space-x-6">
                            <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors" title="Settings">
                                <Settings className="h-6 w-6" />
                            </button>
                            <div className="flex items-center space-x-2">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-inner">
                                    <span className="text-indigo-600 font-bold text-lg">
                                        {user?.name?.charAt(0)}
                                    </span>
                                </div>
                                <span className="text-gray-800 font-semibold">Welcome, {user?.name}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                    <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-xl transform transition-all duration-300 hover:scale-105">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Upload className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="text-base font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Upload New Scan
                                </button>
                                <p className="text-sm text-gray-500">
                                    Support for DICOM images
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:scale-105">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Scans
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                {totalScans} {/* Use state for real-time updates */}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:scale-105">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Activity className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Processing
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                {processingScans} {/* Use state for real-time updates */}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Modal */}
                {showUpload && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                        <div className="relative mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">Upload Medical Scan Images</h3>
                                <button
                                    onClick={() => setShowUpload(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <div className="flex flex-col items-center">
                                    <Brain className="h-16 w-16 text-blue-500 mb-4" />
                                    <div className="mt-4">
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <span className="text-blue-500 hover:text-blue-600">Upload medical scans</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                onChange={handleFileSelect}
                                                accept=".dcm,.dicom,.nii,.nii.gz,.jpg,.jpeg,.png"
                                                multiple
                                            />
                                        </label>
                                        <p className="text-sm text-gray-500">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Supported formats: DICOM (.dcm, .dicom), NIfTI (.nii, .nii.gz), JPEG (.jpg, .jpeg), PNG (.png)
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Maximum file size: 50MB
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    {error}
                                </div>
                            )}

                            {uploadStatus && (
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
                                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                    {uploadStatus}
                                </div>
                            )}

                            {processingStatus && (
                                <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md flex items-center">
                                    <Activity className="h-5 w-5 mr-2 animate-pulse" />
                                    {processingStatus}
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium mb-2">Selected Medical Scans:</h4>
                                    <ul className="text-sm text-gray-600">
                                        {Array.from(files).map((file, index) => (
                                            <li key={index} className="flex items-center">
                                                <ImageIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowUpload(false)}
                                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={files.length === 0 || uploadStatus === 'Uploading...'}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center ${
                                        files.length === 0 || uploadStatus === 'Uploading...'
                                            ? 'bg-blue-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {uploadStatus === 'Uploading...' ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Upload Medical Scans'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Scans */}
                <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                            <Clock className="h-6 w-6 mr-3 text-indigo-600 animate-spin-slow" />
                            Recent Tumor Scans
                        </h3>
                        <div className="flex space-x-4">
                            <div className="relative">
                                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search scans..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                />
                            </div>
                            <button className="flex items-center px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors">
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Tumor Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Volume</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Seg. Score</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-indigo-700 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {recentScans.map((scan) => (
                                <tr key={scan.id} className="hover:bg-indigo-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scan.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{scan.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{scan.tumorType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                                                scan.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800 animate-pulse'
                                            }`}>
                                                {scan.status === 'Completed' ? <CheckCircle className="h-4 w-4 mr-1" /> : <RefreshCw className="h-4 w-4 mr-1 animate-spin" />}
                                                {scan.status}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{scan.volume || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{scan.segmentationScore ? `${scan.segmentationScore}%` : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                                        <button
                                            onClick={() => handleViewScan(scan)}
                                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                        {scan.status === 'Completed' && (
                                            <button className="text-green-600 hover:text-green-800 transition-colors">
                                                <Download className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showScanDetails && <ScanDetailsModal />}

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-6 shadow-inner">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
                    <p>© 2025 TumorSync - Advanced Tumor Segmentation Platform</p>
                    <p className="mt-1">
                        <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">Support</a> |
                        <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium ml-2">Privacy Policy</a>
                    </p>
                </div>
            </footer>

            {/* Custom CSS for Animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes spinSlow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-zoomIn {
                    animation: zoomIn 0.3s ease-out;
                }
                .animate-spin-slow {
                    animation: spinSlow 10s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default UserDashboard;
