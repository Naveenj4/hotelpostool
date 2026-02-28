import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import RegisterRestaurant from './pages/RegisterRestaurant';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SelfServiceDashboard from './pages/dashboard/SelfServiceDashboard';
import ProductMaster from './pages/dashboard/ProductMaster';
import CategoryMaster from './pages/dashboard/CategoryMaster';
import CounterMaster from './pages/dashboard/CounterMaster';
import BillingPage from './pages/dashboard/BillingPage';
import BillsAndSalesPage from './pages/dashboard/BillsAndSalesPage';
import StockPage from './pages/StockPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AccessControlPage from './pages/AccessControlPage';

const ProtectedRoute = ({ children, adminOnly }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    // If admin-only route, check if user is admin
    if (adminOnly && !isAdmin()) {
        return <Navigate to="/dashboard/self-service/home" />;
    }

    return children;
};

// Route guard that checks page-level permission
const PermissionRoute = ({ children, pageKey }) => {
    const { user, loading, hasPageAccess, getLandingPage } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    if (!hasPageAccess(pageKey)) {
        return <Navigate to={getLandingPage()} replace />;
    }

    return children;
};

function AppRoutes() {
    const { user, getLandingPage } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
                path="/register"
                element={user ? <Navigate to={getLandingPage()} /> : <RegisterRestaurant />}
            />
            <Route
                path="/login"
                element={user ? <Navigate to={getLandingPage()} /> : <Login />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Self Service Dashboard Nested Routes */}
            <Route
                path="/dashboard/self-service/*"
                element={
                    <ProtectedRoute>
                        <Routes>
                            <Route path="home" element={
                                <PermissionRoute pageKey="dashboard"><SelfServiceDashboard /></PermissionRoute>
                            } />
                            {/* Rest of routes... */}
                            <Route path="products" element={
                                <PermissionRoute pageKey="products"><ProductMaster /></PermissionRoute>
                            } />
                            <Route path="categories" element={
                                <PermissionRoute pageKey="categories"><CategoryMaster /></PermissionRoute>
                            } />
                            <Route path="counters" element={
                                <PermissionRoute pageKey="counters"><CounterMaster /></PermissionRoute>
                            } />
                            <Route path="billing" element={
                                <PermissionRoute pageKey="billing"><BillingPage /></PermissionRoute>
                            } />
                            <Route path="bills-sales" element={
                                <PermissionRoute pageKey="bills_sales"><BillsAndSalesPage /></PermissionRoute>
                            } />
                            <Route path="stock" element={
                                <PermissionRoute pageKey="stock"><StockPage /></PermissionRoute>
                            } />
                            <Route path="reports" element={
                                <PermissionRoute pageKey="reports"><ReportsPage /></PermissionRoute>
                            } />
                            <Route path="settings" element={
                                <PermissionRoute pageKey="settings"><SettingsPage /></PermissionRoute>
                            } />
                            <Route path="access-control" element={
                                <ProtectedRoute adminOnly><AccessControlPage /></ProtectedRoute>
                            } />
                            <Route path="*" element={<Navigate to={getLandingPage()} replace />} />
                        </Routes>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard/dining/*"
                element={
                    <ProtectedRoute>
                        <div className="p-10">
                            <h1 className="text-3xl font-bold mb-4">Dining Dashboard</h1>
                            <p className="text-galaxy-secondary">Welcome to your POS system! Module implementation coming soon.</p>
                        </div>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
