import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Brain, AlertCircle, ToggleLeft as Google } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();

    useEffect(() => {
        localStorage.removeItem('medical_auth_token');
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setError('');
            // Simulated Google auth
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockGoogleUser = {
                email: 'google@example.com',
                name: 'Google User',
                role: 'user'
            };
            const { success, role } = await auth.login(mockGoogleUser.email, 'google-auth');

            if (success) {
                const redirectPath = role === 'admin' ? '/admin' : '/dashboard';
                navigate(redirectPath, { replace: true });
            }
        } catch (err) {
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
            const { success, error, role } = await auth.login(email, password);

            if (success) {
                const redirectPath = role === 'admin' ? '/admin' : '/dashboard';
                navigate(redirectPath, { replace: true });
            } else {
                setError(error || 'Invalid credentials');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
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
                        <h1 className="text-2xl font-bold text-white text-center mb-2">
                            Medical Imaging Platform
                        </h1>
                        <p className="text-blue-200 text-sm">Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center animate-shake">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
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
                                        autoComplete="email"
                                        required
                                        className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 bg-white/10 border border-white/20 placeholder-blue-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
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
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 bg-white/10 border border-white/20 placeholder-blue-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

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
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign in'
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
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center px-4 py-3 border border-white/20 rounded-lg text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <Google className="h-5 w-5 mr-2" />
                                Sign in with Google
                            </button>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-blue-200">
                                Don't have an account?{' '}
                                <Link to="/signup" className="font-medium text-blue-400 hover:text-blue-300">
                                    Sign up
                                </Link>
                            </p>
                            <div className="space-x-4 text-xs text-blue-200">
                                <span>Demo Accounts:</span>
                                <span>admin@example.com / admin123</span>
                                <span>user@example.com / user123</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
