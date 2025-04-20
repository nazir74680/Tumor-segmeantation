import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Brain, ToggleLeft as Google } from 'lucide-react';

export const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleGoogleSignUp = async () => {
        // Implement Google SSO logic here
        try {
            setIsLoading(true);
            // Simulated Google auth
            await new Promise(resolve => setTimeout(resolve, 1500));
            navigate('/dashboard');
        } catch (error) {
            setError('Google authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (!otpSent) {
                // Simulate sending OTP
                await new Promise(resolve => setTimeout(resolve, 1000));
                setOtpSent(true);
            } else {
                // Verify OTP and complete registration
                if (otp === '123456') { // Demo OTP
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    navigate('/dashboard');
                } else {
                    throw new Error('Invalid OTP');
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-lg w-full space-y-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                            <Brain className="h-8 w-8 text-white animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-bold text-white text-center">
                            Join Medical Imaging Platform
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {!otpSent ? (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-blue-200 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                            <User className="h-5 w-5 text-blue-300" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 bg-white/10 border border-white/20 placeholder-blue-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your full name"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                            <Mail className="h-5 w-5 text-blue-300" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 bg-white/10 border border-white/20 placeholder-blue-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                            <Lock className="h-5 w-5 text-blue-300" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 bg-white/10 border border-white/20 placeholder-blue-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                            <Lock className="h-5 w-5 text-blue-300" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 bg-white/10 border border-white/20 placeholder-blue-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-blue-200 mb-2">
                                    Enter OTP
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    maxLength="6"
                                    required
                                    className="appearance-none rounded-lg block w-full px-3 py-3 bg-white/10 border border-white/20 placeholder-blue-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                                    placeholder="******"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                                <p className="mt-2 text-sm text-blue-200 text-center">
                                    OTP sent to {formData.email}
                                </p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                        {otpSent ? 'Verifying...' : 'Sending OTP...'}
                                    </div>
                                ) : (
                                    otpSent ? 'Verify OTP' : 'Sign Up'
                                )}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/20"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-transparent text-blue-200">Or continue with</span>
                            </div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleGoogleSignUp}
                                className="w-full flex items-center justify-center px-4 py-3 border border-white/20 rounded-lg text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <Google className="h-5 w-5 mr-2" />
                                Sign up with Google
                            </button>
                        </div>

                        <p className="text-center text-sm text-blue-200">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

