import React, { createContext, useContext, useEffect, useState } from 'react';
import {jwtDecode} from 'jwt-decode'; // Correct library for decoding JWTs
import { mockUsers } from '../types/auth'; // Ensure mockUsers is properly defined
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
const AUTH_KEY = 'medical_auth_token';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: true,
    });

    const navigate = useNavigate();

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedToken = localStorage.getItem(AUTH_KEY);

                if (!storedToken) {
                    setAuthState((prev) => ({ ...prev, loading: false }));
                    return;
                }

                const decoded = jwtDecode(storedToken);

                // Check token expiration
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    throw new Error('Token expired');
                }

                setAuthState({
                    user: decoded,
                    token: storedToken,
                    isAuthenticated: true,
                    loading: false,
                });
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem(AUTH_KEY);
                setAuthState({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    loading: false,
                });
                navigate('/login');
            }
        };

        initializeAuth();
    }, [navigate]);

    // Auto logout when token expires
    useEffect(() => {
        if (!authState.token) return;

        try {
            const decoded = jwtDecode(authState.token);
            const timeUntilExpiry = decoded.exp * 1000 - Date.now();

            if (timeUntilExpiry <= 0) {
                logout();
                return;
            }

            const logoutTimer = setTimeout(() => {
                logout();
            }, timeUntilExpiry);

            return () => clearTimeout(logoutTimer);
        } catch (error) {
            console.error('Token monitoring error:', error);
            logout();
        }
    }, [authState.token]);

    const login = async (email, password) => {
        try {
            // Clear any existing auth data
            localStorage.removeItem(AUTH_KEY);

            const user = mockUsers.find((u) => u.email === email && u.password === password);

            if (!user) {
                throw new Error('Invalid credentials');
            }

            const header = {
                alg: 'HS256',
                typ: 'JWT',
            };

            const payload = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours expiration
                iat: Math.floor(Date.now() / 1000),
            };

            // Encode as Base64 strings
            const base64UrlEncode = (obj) =>
                btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

            const token =
                base64UrlEncode(header) + '.' + base64UrlEncode(payload) + '.signature';

            // Store token in localStorage
            localStorage.setItem(AUTH_KEY, token);

            setAuthState({
                user: payload,
                token,
                isAuthenticated: true,
                loading: false,
            });

            navigate('/dashboard');
            return { success: true, role: user.role };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem(AUTH_KEY);

        setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
        });

        navigate('/login');
    };

    if (authState.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ ...authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
