import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import RegisterRestaurant from './pages/RegisterRestaurant';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SelfServiceDashboard from './pages/dashboard/SelfServiceDashboard';
import ProductMaster from './pages/dashboard/ProductMaster';
import CategoryMaster from './pages/dashboard/CategoryMaster';
import BrandMaster from './pages/dashboard/BrandMaster';
import TableMaster from './pages/dashboard/TableMaster';
import CaptainMaster from './pages/dashboard/CaptainMaster';
import WaiterMaster from './pages/dashboard/WaiterMaster';
import SupplierMaster from './pages/dashboard/SupplierMaster';
import CustomerMaster from './pages/dashboard/CustomerMaster';
import LedgerMaster from './pages/dashboard/LedgerMaster';
import PurchaseEntry from './pages/dashboard/PurchaseEntry';
import PurchaseBillManagement from './pages/dashboard/PurchaseBillManagement';
import AdvancedReports from './pages/dashboard/AdvancedReports';
import VoucherManagement from './pages/dashboard/VoucherManagement';
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
                            <Route path="brands" element={
                                <PermissionRoute pageKey="brands"><BrandMaster /></PermissionRoute>
                            } />
                            <Route path="tables" element={
                                <PermissionRoute pageKey="tables"><TableMaster /></PermissionRoute>
                            } />
                            <Route path="captains" element={
                                <PermissionRoute pageKey="captains"><CaptainMaster /></PermissionRoute>
                            } />
                            <Route path="waiters" element={
                                <PermissionRoute pageKey="waiters"><WaiterMaster /></PermissionRoute>
                            } />
                            <Route path="suppliers" element={
                                <PermissionRoute pageKey="suppliers"><SupplierMaster /></PermissionRoute>
                            } />
                            <Route path="customers" element={
                                <PermissionRoute pageKey="customers"><CustomerMaster /></PermissionRoute>
                            } />
                            <Route path="ledgers" element={
                                <PermissionRoute pageKey="ledgers"><LedgerMaster /></PermissionRoute>
                            } />
                            <Route path="purchase" element={
                                <PermissionRoute pageKey="purchase"><PurchaseEntry /></PermissionRoute>
                            } />
                            <Route path="purchase-history" element={
                                <PermissionRoute pageKey="purchase_history"><PurchaseBillManagement /></PermissionRoute>
                            } />
                            <Route path="advanced-reports" element={
                                <PermissionRoute pageKey="advanced_reports"><AdvancedReports /></PermissionRoute>
                            } />
                            <Route path="vouchers" element={
                                <PermissionRoute pageKey="vouchers"><VoucherManagement /></PermissionRoute>
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
