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

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />; // Redirect unauthorized
    }

    return children;
};

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
                path="/register"
                element={user ? <Navigate to={(user.restaurant_type === 'SMART' || user.restaurant_type === 'SELF_SERVICE') ? '/dashboard/self-service' : '/dashboard/dining'} /> : <RegisterRestaurant />}
            />
            <Route
                path="/login"
                element={user ? <Navigate to={(user.restaurant_type === 'SMART' || user.restaurant_type === 'SELF_SERVICE') ? '/dashboard/self-service' : '/dashboard/dining'} /> : <Login />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Self Service Dashboard Nested Routes */}
            <Route
                path="/dashboard/self-service/*"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'BILLING']}>
                        <Routes>
                            <Route path="home" element={<SelfServiceDashboard />} />
                            <Route path="products" element={<ProductMaster />} />
                            <Route path="categories" element={<CategoryMaster />} />
                            <Route path="counters" element={<CounterMaster />} />
                            <Route path="billing" element={<BillingPage />} />
                            <Route path="bills-sales" element={<BillsAndSalesPage />} />
                            <Route path="stock" element={<StockPage />} />
                            <Route path="reports" element={<ReportsPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="*" element={<Navigate to="home" replace />} />
                        </Routes>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard/dining/*"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'BILLING', 'OWNER']}>
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

