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
                <Sidebar isCollapsed={isCollapsed} />
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
                            color="#7ea1c4"
                            trend="+12.5%"
                        />
                        <StatCard
                            label="Total Bills"
                            value={dashboardData?.totalBills}
                            icon={<FileText size={24} />}
                            color="#7ea1c4"
                        />
                        <StatCard
                            label="Cash Collected"
                            value={getPaymentAmount('CASH')}
                            icon={<CreditCard size={24} />}
                            color="#10b981"
                        />
                        <StatCard
                            label="UPI / Online"
                            value={getPaymentAmount('UPI')}
                            icon={<CreditCard size={24} />}
                            color="#8b5cf6"
                        />
                    </div>

                    <div className="dashboard-bottom-grid">
                        {/* Top Selling Products */}
                        <div className="data-card">
                            <h3 className="card-title">
                                <ArrowUpRight size={20} color="var(--primary-500)" />
                                Top 5 Selling Products
                            </h3>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Qty</th>
                                        <th>Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData?.topProducts?.map((product, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 500 }}>{product.name}</td>
                                            <td>{product.quantity}</td>
                                            <td style={{ fontWeight: 600 }}>₹{product.sales}</td>
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
                                                <td style={{ fontWeight: 600, color: '#1e293b' }}>{alert.item}</td>
                                                <td style={{ color: '#ef4444', fontWeight: 700, fontFamily: 'monospace' }}>
                                                    {alert.remaining} {alert.unit}
                                                </td>
                                                <td>
                                                    <span className="badge badge-low">Critical</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colspan="3" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                                                No stock alerts
                                            </td>
                                        </tr>
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
