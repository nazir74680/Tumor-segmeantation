import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
    Brain, LogOut, Users, Activity, FileText, Settings,
    PieChart, Bell, Download, Calendar, Search, Filter,
    ChevronDown, BarChart2, TrendingUp, AlertCircle,
    Microscope, Radiation, Clock, X, Plus, Eye,
    Edit, Trash2, Upload, CheckCircle, AlertTriangle
} from 'lucide-react';

export const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const { notifications, addNotification, markAllAsRead, isOpen, toggleNotifications } = useNotifications();

    // State management
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [systemStatus, setSystemStatus] = useState('Operational');

    // Tumor-specific stats
    const [stats, setStats] = useState({
        totalPatients: 234,
        tumorScans: 1568,
        activeAnalyses: 18,
        segmentationAccuracy: 97.8,
        processingTime: 4.2,
        criticalCases: 12,
        treatmentPlans: 89
    });

    // Analytics data
    const analyticsData = {
        tumorDetections: [32, 45, 38, 51, 47, 53, 49],
        segmentationAccuracy: [96.5, 97.1, 97.8, 97.5, 98.2, 97.9, 98.5],
        treatmentPlans: [15, 18, 22, 25, 28, 31, 35],
        tumorVolumes: [25.3, 28.7, 32.1, 30.5, 33.8, 35.2, 34.9]
    };

    // Patient data
    const [patients, setPatients] = useState([
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            tumorType: 'Glioblastoma',
            lastScan: '2025-03-24',
            status: 'In Treatment',
            segmentationScore: 98.2,
            tumorVolume: '32.5 cm³',
            treatmentPlan: 'Chemotherapy + Radiation',
            lastUpdated: '2025-03-25'
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            tumorType: 'Meningioma',
            lastScan: '2025-03-23',
            status: 'Monitoring',
            segmentationScore: 97.9,
            tumorVolume: '15.8 cm³',
            treatmentPlan: 'Observation',
            lastUpdated: '2025-03-24'
        },
        {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike@example.com',
            tumorType: 'Astrocytoma',
            lastScan: '2025-03-22',
            status: 'Pre-treatment',
            segmentationScore: 98.5,
            tumorVolume: '25.3 cm³',
            treatmentPlan: 'Surgery Planned',
            lastUpdated: '2025-03-23'
        },
    ]);

    // Simulated real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                activeAnalyses: Math.floor(Math.random() * 5) + 15,
                tumorScans: prev.tumorScans + Math.floor(Math.random() * 3),
                criticalCases: Math.floor(Math.random() * 5) + 10
            }));

            if (Math.random() > 0.6) {
                addNotification({
                    title: 'Tumor Analysis Complete',
                    message: `Segmentation completed for patient ${patients[Math.floor(Math.random() * patients.length)].name}`,
                    type: 'success'
                });
            }

            if (Math.random() > 0.9) {
                setSystemStatus('Maintenance');
                addNotification({
                    title: 'System Alert',
                    message: 'System maintenance scheduled in 30 minutes',
                    type: 'warning'
                });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [addNotification, patients]);

    // Handlers
    const generateTumorReport = () => {
        setTimeout(() => {
            addNotification({
                title: 'Tumor Report Generated',
                message: 'Detailed tumor analysis report has been created and saved.',
                type: 'success'
            });
        }, 1500);
    };

    const handleViewPatient = (patient) => {
        setSelectedPatient(patient);
        setShowPatientModal(true);
    };

    const handleAddPatient = (newPatient) => {
        setPatients(prev => [...prev, { ...newPatient, id: prev.length + 1 }]);
        setShowAddPatientModal(false);
        addNotification({
            title: 'Patient Added',
            message: `${newPatient.name} has been added to the system.`,
            type: 'success'
        });
    };

    const handleDeletePatient = (id) => {
        setPatients(prev => prev.filter(p => p.id !== id));
        setShowPatientModal(false);
        addNotification({
            title: 'Patient Removed',
            message: 'Patient record has been deleted.',
            type: 'info'
        });
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.tumorType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Components
    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
                <div className={`p-2 rounded-full bg-${color}-100`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                </div>
                <div className="ml-4">
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );

    const PatientModal = () => (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Patient Details</h3>
                    <button onClick={() => setShowPatientModal(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {selectedPatient && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tumor Type</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.tumorType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tumor Volume</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.tumorVolume}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Segmentation Score</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.segmentationScore}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Treatment Plan</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.treatmentPlan}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Last Scan</p>
                                <p className="text-lg font-medium text-gray-900">{selectedPatient.lastScan}</p>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button
                                onClick={() => handleDeletePatient(selectedPatient.id)}
                                className="flex items-center px-4 py-2 text-red-600 hover:text-red-800"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </button>
                            <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const AddPatientModal = () => {
        const [newPatient, setNewPatient] = useState({
            name: '', email: '', tumorType: '', status: 'Monitoring', treatmentPlan: ''
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            handleAddPatient(newPatient);
            setNewPatient({ name: '', email: '', tumorType: '', status: 'Monitoring', treatmentPlan: '' });
        };

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Add New Patient</h3>
                        <button onClick={() => setShowAddPatientModal(false)} className="text-gray-500 hover:text-gray-700">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600">Name</label>
                            <input
                                type="text"
                                value={newPatient.name}
                                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600">Email</label>
                            <input
                                type="email"
                                value={newPatient.email}
                                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600">Tumor Type</label>
                            <input
                                type="text"
                                value={newPatient.tumorType}
                                onChange={(e) => setNewPatient({ ...newPatient, tumorType: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600">Status</label>
                            <select
                                value={newPatient.status}
                                onChange={(e) => setNewPatient({ ...newPatient, status: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="Monitoring">Monitoring</option>
                                <option value="In Treatment">In Treatment</option>
                                <option value="Pre-treatment">Pre-treatment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600">Treatment Plan</label>
                            <input
                                type="text"
                                value={newPatient.treatmentPlan}
                                onChange={(e) => setNewPatient({ ...newPatient, treatmentPlan: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Add Patient
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Navigation */}
            <nav className="bg-white shadow-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Brain className="h-8 w-8 text-indigo-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">
                                TumorSync Admin
                            </span>
                            <span className="ml-4 text-sm text-gray-500">v2.1.3</span>
                        </div>
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={toggleNotifications}
                                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                            >
                                <Bell className="h-6 w-6" />
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </button>
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-indigo-600 font-medium">
                                        {user?.name?.charAt(0)}
                                    </span>
                                </div>
                                <span className="text-gray-700 font-medium">{user?.name}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-8">
                    <StatCard icon={Users} label="Total Patients" value={stats.totalPatients} color="indigo" />
                    <StatCard icon={Microscope} label="Tumor Scans" value={stats.tumorScans} color="blue" />
                    <StatCard icon={Activity} label="Active Analyses" value={stats.activeAnalyses} color="green" />
                    <StatCard icon={PieChart} label="Seg. Accuracy" value={`${stats.segmentationAccuracy}%`} color="purple" />
                    <StatCard icon={Clock} label="Avg. Processing" value={`${stats.processingTime} min`} color="teal" />
                    <StatCard icon={AlertCircle} label="Critical Cases" value={stats.criticalCases} color="red" />
                    <StatCard icon={Radiation} label="Treatment Plans" value={stats.treatmentPlans} color="orange" />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6 pt-4">
                            {['overview', 'analytics', 'patients', 'settings'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-4">Recent Activity</h4>
                                    <ul className="space-y-3">
                                        {notifications.slice(0, 5).map(n => (
                                            <li key={n.id} className="flex items-center text-sm">
                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                <span>{n.title} - {n.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-4">System Status</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Status:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                systemStatus === 'Operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {systemStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Uptime:</span>
                                            <span className="text-gray-900">99.98%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Memory Usage:</span>
                                            <span className="text-gray-900">72%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Tumor Analytics</h3>
                                <div className="flex space-x-4">
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) => setSelectedPeriod(e.target.value)}
                                        className="rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="week">Last Week</option>
                                        <option value="month">Last Month</option>
                                        <option value="year">Last Year</option>
                                    </select>
                                    <button
                                        onClick={generateTumorReport}
                                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-4">Tumor Detections</h4>
                                    <div className="h-64 flex items-end space-x-2">
                                        {analyticsData.tumorDetections.map((value, index) => (
                                            <div
                                                key={index}
                                                className="flex-1 bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-600"
                                                style={{ height: `${(value / Math.max(...analyticsData.tumorDetections)) * 100}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-4">Segmentation Accuracy</h4>
                                    <div className="h-64 flex items-end space-x-2">
                                        {analyticsData.segmentationAccuracy.map((value, index) => (
                                            <div
                                                key={index}
                                                className="flex-1 bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600"
                                                style={{ height: `${value - 95}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-4">Treatment Plans</h4>
                                    <div className="h-64 flex items-end space-x-2">
                                        {analyticsData.treatmentPlans.map((value, index) => (
                                            <div
                                                key={index}
                                                className="flex-1 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                                                style={{ height: `${(value / Math.max(...analyticsData.treatmentPlans)) * 100}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-4">Avg. Tumor Volume</h4>
                                    <div className="h-64 flex items-end space-x-2">
                                        {analyticsData.tumorVolumes.map((value, index) => (
                                            <div
                                                key={index}
                                                className="flex-1 bg-orange-500 rounded-t transition-all duration-300 hover:bg-orange-600"
                                                style={{ height: `${(value / Math.max(...analyticsData.tumorVolumes)) * 100}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Patients Tab */}
                    {activeTab === 'patients' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Patient Management</h3>
                                <div className="flex space-x-4">
                                    <div className="relative">
                                        <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search patients..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filter
                                    </button>
                                    <button
                                        onClick={() => setShowAddPatientModal(true)}
                                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Patient
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tumor Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Scan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seg. Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tumor Volume</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <Users className="h-6 w-6 text-indigo-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                                        <div className="text-sm text-gray-500">{patient.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.tumorType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.lastScan}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        patient.status === 'In Treatment' ? 'bg-blue-100 text-blue-800' :
                                                            patient.status === 'Monitoring' ? 'bg-green-100 text-green-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {patient.status}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.segmentationScore}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.tumorVolume}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.treatmentPlan}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                <button
                                                    onClick={() => handleViewPatient(patient)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-800">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Segmentation Parameters</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600">Threshold</label>
                                            <input type="number" defaultValue="0.85" className="w-full p-2 border border-gray-300 rounded-md" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600">Confidence Level</label>
                                            <input type="number" defaultValue="95" className="w-full p-2 border border-gray-300 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Notification Settings</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" defaultChecked />
                                            Email Alerts
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" defaultChecked />
                                            Critical Case Alerts
                                        </label>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Scans Section */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tumor Scans</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-50 rounded-lg p-4">
                                <div className="h-32 bg-gray-200 rounded-md mb-2"></div>
                                <p className="text-sm font-medium text-gray-900">Scan #{i}</p>
                                <p className="text-xs text-gray-500">Processed: {new Date().toLocaleDateString()}</p>
                                <button className="mt-2 text-indigo-600 hover:text-indigo-900 text-sm">
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Notifications Panel */}
            {isOpen && (
                <div className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-xl z-50 border border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                            Mark all as read
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-sm text-gray-500">No new notifications</p>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                                        !notification.read ? 'bg-indigo-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start">
                                        {notification.type === 'success' ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                            <p className="text-sm text-gray-600">{notification.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date().toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showPatientModal && <PatientModal />}
            {showAddPatientModal && <AddPatientModal />}
        </div>
    );
};
