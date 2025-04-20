import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { ROLES } from './types/auth';
import { Unauthorized } from './pages/Unauthorized';
import { NotificationProvider } from './context/NotificationContext';

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/unauthorized" element={<Unauthorized />} />

                        <Route
                            path="/admin/*"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/dashboard/*"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.USER]}>
                                    <UserDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/"
                            element={
                                <Navigate
                                    to="/dashboard"
                                    replace
                                />
                            }
                        />
                    </Routes>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
