import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    TrendingUp,
    FileText,
    CreditCard,
    AlertTriangle,
    ArrowUpRight,
    ShoppingBag,
    PlusCircle
} from 'lucide-react';
import { Skeleton, TableSkeleton } from '../../components/Skeleton';

const StatCard = ({ label, value, icon, color, trend }) => (
    <div className="stat-card">
        <div className="stat-header">
            <span className="stat-label">{label}</span>
            <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
                {icon}
            </div>
        </div>
        <div className="stat-value">{value}</div>
        {trend && (
            <div className={`stat-trend ${trend.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
                {trend} <span style={{ color: 'var(--galaxy-muted)', fontSize: '0.75rem' }}>vs yesterday</span>
            </div>
        )}
    </div>
);

const SelfServiceDashboard = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real data from our new API
        const fetchDashboardData = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;

                const { token } = JSON.parse(savedUser);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/summary`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.success) {
                    setDashboardData(result.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const toggleSidebar = () => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    // Close mobile sidebar when clicking on main content area
    const handleMainClick = (e) => {
        const isMobile = window.innerWidth <= 768;
        // Only close if clicking directly on the main element, not on child elements
        if (isMobile && isMobileSidebarOpen && e.target === e.currentTarget) {
            setIsMobileSidebarOpen(false);
        }
    };

    // If loading, render the layout with skeletons
    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

                {isMobileSidebarOpen && window.innerWidth <= 768 && (
                    <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
                )}

                <main className="dashboard-main">
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="dashboard-content">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-galaxy">Dashboard Overview</h2>
                                <p className="text-galaxy-muted">Loading your metrics...</p>
                            </div>
                        </div>

                        <div className="widgets-grid">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="stat-card">
                                    <Skeleton height="20px" width="100px" className="mb-4" />
                                    <Skeleton height="32px" width="150px" />
                                </div>
                            ))}
                        </div>

                        <div className="dashboard-bottom-grid">
                            <div className="data-card">
                                <h3 className="card-title">Top Selling Products</h3>
                                <table className="custom-table">
                                    <thead><tr><th>Name</th><th>Qty</th><th>Sales</th></tr></thead>
                                    <tbody><TableSkeleton rows={5} cols={3} /></tbody>
                                </table>
                            </div>
                            <div className="data-card">
                                <h3 className="card-title">Stock Alerts</h3>
                                <table className="custom-table">
                                    <thead><tr><th>Name</th><th>Stock</th><th>Status</th></tr></thead>
                                    <tbody><TableSkeleton rows={5} cols={3} /></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Helper to get payment amount by mode
    const getPaymentAmount = (mode) => {
        const payment = dashboardData?.paymentSummary?.find(p => p.mode === mode);
        return payment ? `₹${payment.amount.toLocaleString()}` : '₹0';
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {/* Mobile overlay */}
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main" onClick={handleMainClick}>
                <Header
                    toggleSidebar={toggleSidebar}
                    restaurantName={dashboardData?.restaurantInfo?.printName}
                />

                <div className="dashboard-content">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-galaxy">Dashboard Overview</h2>
                            <p className="text-galaxy-muted">Welcome back! Here's what's happening today.</p>
                        </div>
                        <button className="btn-primary flex items-center gap-2">
                            <PlusCircle size={18} /> New Bill
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="widgets-grid">
                        <StatCard
                            label="Today's Sales"
                            value={`₹${dashboardData?.todaySales?.toLocaleString()}`}
                            icon={<TrendingUp size={24} />}
                            color="#10b981"
                        />
                        <StatCard
                            label="Today's Purchases"
                            value={`₹${dashboardData?.todayPurchases?.toLocaleString()}`}
                            icon={<ShoppingBag size={24} />}
                            color="#ef4444"
                        />
                        <StatCard
                            label="Supplier O/S"
                            value={`₹${dashboardData?.supplierOutstanding?.toLocaleString()}`}
                            icon={<CreditCard size={24} />}
                            color="#f59e0b"
                        />
                        <StatCard
                            label="Customer O/S"
                            value={`₹${dashboardData?.customerOutstanding?.toLocaleString()}`}
                            icon={<Wallet size={24} />}
                            color="#3b82f6"
                        />
                    </div>

                    <div className="dashboard-bottom-grid">
                        {/* Latest Vouchers */}
                        <div className="data-card">
                            <h3 className="card-title">
                                <FileText size={20} color="var(--primary-500)" />
                                Latest Transactions
                            </h3>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Particulars</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData?.latestVouchers?.map((v, i) => (
                                        <tr key={i}>
                                            <td>{new Date(v.date).toLocaleDateString()}</td>
                                            <td><span className={`badge badge-${v.type.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{v.type}</span></td>
                                            <td style={{ fontWeight: 700 }}>₹{v.amount}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{v.dr} / {v.cr}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Low Stock Alerts */}
                        <div className="data-card">
                            <h3 className="card-title">
                                <AlertTriangle size={20} color="#ef4444" />
                                Low Stock Alerts
                            </h3>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData?.lowStockItems?.length > 0 ? (
                                        dashboardData.lowStockItems.map((alert, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600 }}>{alert.item}</td>
                                                <td style={{ color: '#ef4444', fontWeight: 700 }}>
                                                    {alert.remaining} {alert.unit}
                                                </td>
                                                <td><span className="badge badge-low">Reorder</span></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No stock alerts</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};


export default SelfServiceDashboard;
