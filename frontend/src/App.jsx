import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Provider } from 'react-redux';
import { store } from './redux/store';

import LandingPage from './pages/LandingPage.jsx';
import RegisterRestaurant from './pages/RegisterRestaurant.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import SelfServiceDashboard from './pages/dashboard/SelfServiceDashboard.jsx';
import ProductMaster from './pages/dashboard/ProductMaster.jsx';
import CategoryMaster from './pages/dashboard/CategoryMaster.jsx';
import BrandMaster from './pages/dashboard/BrandMaster.jsx';
import TableMaster from './pages/dashboard/TableMaster.jsx';
import TableTypeMaster from './pages/dashboard/TableTypeMaster.jsx';
import CaptainMaster from './pages/dashboard/CaptainMaster.jsx';
import WaiterMaster from './pages/dashboard/WaiterMaster.jsx';
import StaffMaster from './pages/dashboard/StaffMaster.jsx';
import SupplierMaster from './pages/dashboard/SupplierMaster.jsx';
import CustomerMaster from './pages/dashboard/CustomerMaster.jsx';
import LedgerMaster from './pages/dashboard/LedgerMaster.jsx';
import GroupMaster from './pages/dashboard/GroupMaster.jsx';
import PurchaseEntry from './pages/dashboard/PurchaseEntry.jsx';
import PurchaseBillManagement from './pages/dashboard/PurchaseBillManagement.jsx';
import PurchaseInvoices from './pages/dashboard/PurchaseInvoices.jsx';
import PurchaseEntryForm from './pages/dashboard/PurchaseEntryForm.jsx';
import AdvancedReports from './pages/dashboard/AdvancedReports.jsx';
import LedgerStatement from './pages/dashboard/LedgerStatement.jsx';
import VoucherManagement from './pages/dashboard/VoucherManagement.jsx';
import ReceiptEntry from './pages/dashboard/ReceiptEntry.jsx';
import PaymentEntry from './pages/dashboard/PaymentEntry.jsx';
import LedgerCreationForm from './pages/dashboard/LedgerCreationForm.jsx';
import CounterMaster from './pages/dashboard/CounterMaster.jsx';
import BillingPage from './pages/dashboard/BillingPage.jsx';
import TableSelectionPage from './pages/dashboard/TableSelectionPage.jsx';
import HoldBillsPage from './pages/dashboard/HoldBillsPage.jsx';
import BillsAndSalesPage from './pages/dashboard/BillsAndSalesPage.jsx';
import StockPage from './pages/StockPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AccessControlPage from './pages/AccessControlPage.jsx';
import GenericModulePlaceholder from './pages/dashboard/GenericModulePlaceholder.jsx';
import DayWiseSales from './pages/dashboard/DayWiseSales.jsx';
import MonthWiseSales from './pages/dashboard/MonthWiseSales.jsx';
import ItemWiseSales from './pages/dashboard/ItemWiseSales.jsx';
import CategoryWiseSales from './pages/dashboard/CategoryWiseSales.jsx';
import TransactionWiseSales from './pages/dashboard/TransactionWiseSales.jsx';
import DayWisePurchase from './pages/dashboard/DayWisePurchase.jsx';
import SupplierWisePurchase from './pages/dashboard/SupplierWisePurchase.jsx';
import CustomerOutstanding from './pages/dashboard/CustomerOutstanding.jsx';
import SupplierOutstanding from './pages/dashboard/SupplierOutstanding.jsx';
import AccountsReceivable from './pages/dashboard/AccountsReceivable.jsx';
import AccountsPayable from './pages/dashboard/AccountsPayable.jsx';
import Daybook from './pages/dashboard/Daybook.jsx';
import CashBalance from './pages/dashboard/CashBalance.jsx';
import BankBalance from './pages/dashboard/BankBalance.jsx';
import CashAndBank from './pages/dashboard/CashAndBank.jsx';
import PrinterManagement from './pages/dashboard/PrinterManagement.jsx';
import KitchenManagement from './pages/dashboard/KitchenManagement.jsx';
import KitchenDisplay, { KitchenDisplayList } from './pages/dashboard/KitchenDisplay.jsx';
import PrinterDisplay, { PrinterDisplayList } from './pages/dashboard/PrinterDisplay.jsx';
import OrderIntegrationSettings from './pages/dashboard/OrderIntegrationSettings.jsx';
import SalesProfit from './pages/dashboard/SalesProfit.jsx';

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
                            <Route path="table-types" element={
                                <PermissionRoute pageKey="master"><TableTypeMaster /></PermissionRoute>
                            } />
                            <Route path="captains" element={
                                <PermissionRoute pageKey="captains"><StaffMaster /></PermissionRoute>
                            } />
                            <Route path="waiters" element={
                                <PermissionRoute pageKey="waiters"><StaffMaster /></PermissionRoute>
                            } />
                            <Route path="staff" element={
                                <PermissionRoute pageKey="master"><StaffMaster /></PermissionRoute>
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
                            <Route path="ledgers/create" element={
                                <PermissionRoute pageKey="ledgers"><LedgerCreationForm /></PermissionRoute>
                            } />
                            <Route path="group-master" element={
                                <PermissionRoute pageKey="ledgers"><GroupMaster /></PermissionRoute>
                            } />
                            <Route path="purchase" element={
                                <PermissionRoute pageKey="purchase"><PurchaseEntryForm /></PermissionRoute>
                            } />
                            <Route path="purchase-history" element={
                                <PermissionRoute pageKey="purchase_history"><PurchaseBillManagement /></PermissionRoute>
                            } />
                            <Route path="purchase-invoices" element={
                                <PermissionRoute pageKey="purchase_history"><PurchaseInvoices /></PermissionRoute>
                            } />
                            <Route path="advanced-reports" element={
                                <PermissionRoute pageKey="advanced_reports"><AdvancedReports /></PermissionRoute>
                            } />
                            <Route path="ledger-statement" element={
                                <PermissionRoute pageKey="ledger_statement"><LedgerStatement /></PermissionRoute>
                            } />
                            <Route path="vouchers" element={
                                <PermissionRoute pageKey="vouchers"><VoucherManagement /></PermissionRoute>
                            } />
                            <Route path="receipts" element={
                                <PermissionRoute pageKey="vouchers"><ReceiptEntry /></PermissionRoute>
                            } />
                            <Route path="payments" element={
                                <PermissionRoute pageKey="vouchers"><PaymentEntry /></PermissionRoute>
                            } />
                            <Route path="counters" element={
                                <PermissionRoute pageKey="counters"><CounterMaster /></PermissionRoute>
                            } />
                            <Route path="table-select" element={
                                <PermissionRoute pageKey="billing"><TableSelectionPage /></PermissionRoute>
                            } />
                            <Route path="billing" element={
                                <PermissionRoute pageKey="billing"><BillingPage /></PermissionRoute>
                            } />
                            <Route path="hold" element={
                                <PermissionRoute pageKey="billing"><HoldBillsPage /></PermissionRoute>
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

                            {/* Enterprise Extended Routes */}
                            {/* Sales Summary */}
                            <Route path="reports/sales/day" element={<PermissionRoute pageKey="sales_summary"><DayWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/month" element={<PermissionRoute pageKey="sales_summary"><MonthWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/item" element={<PermissionRoute pageKey="sales_summary"><ItemWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/category" element={<PermissionRoute pageKey="sales_summary"><CategoryWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/transaction" element={<PermissionRoute pageKey="sales_summary"><TransactionWiseSales /></PermissionRoute>} />
                            <Route path="reports/sales/profit" element={<PermissionRoute pageKey="sales_summary"><SalesProfit /></PermissionRoute>} />

                            {/* Purchase Summary */}
                            <Route path="reports/purchase/day" element={<PermissionRoute pageKey="purchase_summary"><DayWisePurchase /></PermissionRoute>} />
                            <Route path="reports/purchase/supplier" element={<PermissionRoute pageKey="purchase_summary"><SupplierWisePurchase /></PermissionRoute>} />

                            {/* Outstanding */}
                            <Route path="outstanding/customers" element={<PermissionRoute pageKey="outstanding"><CustomerOutstanding /></PermissionRoute>} />
                            <Route path="outstanding/suppliers" element={<PermissionRoute pageKey="outstanding"><SupplierOutstanding /></PermissionRoute>} />
                            <Route path="outstanding/receivable" element={<PermissionRoute pageKey="outstanding"><AccountsReceivable /></PermissionRoute>} />
                            <Route path="outstanding/payable" element={<PermissionRoute pageKey="outstanding"><AccountsPayable /></PermissionRoute>} />

                            {/* Accounts */}
                            <Route path="accounts/daybook" element={<PermissionRoute pageKey="accounts"><Daybook /></PermissionRoute>} />
                             <Route path="accounts/cash" element={<PermissionRoute pageKey="accounts"><CashBalance /></PermissionRoute>} />
                             <Route path="accounts/bank" element={<PermissionRoute pageKey="accounts"><BankBalance /></PermissionRoute>} />
                             <Route path="accounts/cash-bank" element={<PermissionRoute pageKey="accounts"><CashAndBank /></PermissionRoute>} />

                            {/* Settings Extensions */}
                            <Route path="settings/integration" element={<PermissionRoute pageKey="settings"><OrderIntegrationSettings /></PermissionRoute>} />

                            {/* Kitchen Management & Display (KDS) */}
                            <Route path="kitchen-management" element={<PermissionRoute pageKey="settings"><KitchenManagement /></PermissionRoute>} />
                            <Route path="kitchen-display" element={<PermissionRoute pageKey="settings"><KitchenDisplayList /></PermissionRoute>} />
                            <Route path="kitchen-display/:kitchenId" element={<PermissionRoute pageKey="settings"><KitchenDisplay /></PermissionRoute>} />

                            {/* Printer Management & Display */}
                            <Route path="printer-management" element={<PermissionRoute pageKey="settings"><PrinterManagement /></PermissionRoute>} />
                            <Route path="printer-display" element={<PermissionRoute pageKey="settings"><PrinterDisplayList /></PermissionRoute>} />
                            <Route path="printer-display/:id" element={<PermissionRoute pageKey="settings"><PrinterDisplay /></PermissionRoute>} />

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
                            <p className="text-slate-600">Welcome to your POS system! Module implementation coming soon.</p>
                        </div>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Provider store={store}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </Router>
        </Provider>
    );
}

export default App;
