import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './ReportsPage.css';
import {
    TrendingUp,
    FileText,
    CreditCard,
    XCircle,
    ArrowUpRight,
    Calendar,
    BarChart3,
    PieChart
} from 'lucide-react';
import { Skeleton, TableSkeleton } from '@/components/Skeleton';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const ReportsPage = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [dailyData, setDailyData] = useState(null);
    const [weeklyData, setWeeklyData] = useState(null);
    const [monthlyData, setMonthlyData] = useState(null);
    const [categoryData, setCategoryData] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7'); // 0 (today), 7, 30, 60, 90
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Helper function to format local date to YYYY-MM-DD
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper function to calculate date range
    const getDateRange = (days) => {
        const endDate = new Date();
        const startDate = new Date();

        if (days === '0') {
            // Today only
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate.setDate(startDate.getDate() - parseInt(days));
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        return { startDate, endDate };
    };

    // Fetch all report data
    const fetchData = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            // Calculate date range
            const { startDate, endDate } = getDateRange(dateRange);
            const startDateStr = formatLocalDate(startDate);
            const endDateStr = formatLocalDate(endDate);

            const queryParams = `?startDate=${startDateStr}&endDate=${endDateStr}`;

            const [
                dailyRes,
                weeklyRes,
                monthlyRes,
                categoryRes,
                topProductsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/reports/daily${queryParams}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/weekly${queryParams}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/monthly${queryParams}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/sales-by-category${queryParams}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/top-products${queryParams}`, { headers })
            ]);

            const dailyData = await dailyRes.json();
            const weeklyData = await weeklyRes.json();
            const monthlyData = await monthlyRes.json();
            const categoryData = await categoryRes.json();
            const topProductsData = await topProductsRes.json();

            if (dailyData.success) setDailyData(dailyData.data);
            if (weeklyData.success) setWeeklyData(weeklyData.data);
            if (monthlyData.success) setMonthlyData(monthlyData.data);
            if (categoryData.success) setCategoryData(categoryData.data);
            if (topProductsData.success) setTopProducts(topProductsData.data);
        } catch (err) {
            console.error("Failed to fetch report data", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and setup auto-refresh
    useEffect(() => {
        fetchData();
    }, [dateRange]);

    // Auto-refresh every 30 seconds if enabled
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchData();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [autoRefresh, dateRange]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    // Chart data configurations
    const dailySalesData = weeklyData ? {
        labels: weeklyData.dailyBreakdown.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [
            {
                label: 'Daily Sales (₹)',
                data: weeklyData.dailyBreakdown.map(day => day.totalSales),
                borderColor: '#7ea1c4',
                backgroundColor: 'rgba(126, 161, 196, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    } : null;

    const categorySalesData = categoryData ? {
        labels: categoryData.slice(0, 6).map(cat => cat.category),
        datasets: [
            {
                label: 'Sales (₹)',
                data: categoryData.slice(0, 6).map(cat => cat.totalSales),
                backgroundColor: [
                    'rgba(126, 161, 196, 0.7)',
                    'rgba(126, 161, 196, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(245, 158, 11, 0.7)'
                ],
                borderColor: [
                    '#7ea1c4',
                    '#7ea1c4',
                    '#10b981',
                    '#8b5cf6',
                    '#ef4444',
                    '#f59e0b'
                ],
                borderWidth: 1
            }
        ]
    } : null;

    const paymentModeData = dailyData ? {
        labels: dailyData.paymentSummary.map(p => p.mode),
        datasets: [
            {
                data: dailyData.paymentSummary.map(p => p.amount),
                backgroundColor: [
                    '#10b981',
                    '#7ea1c4',
                    '#8b5cf6'
                ],
                borderColor: [
                    '#059669',
                    '#2563eb',
                    '#7c3aed'
                ],
                borderWidth: 1
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            }
        }
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
                {isMobileSidebarOpen && window.innerWidth <= 768 && (
                    <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
                )}
                <main className="dashboard-main">
                    <Header
                        toggleSidebar={toggleSidebar}
                        title="Sales Reports"
                        actions={
                            <div className="relative">
                                <select
                                    className="input-premium-modern text-xs font-bold appearance-none pr-8 cursor-pointer"
                                    defaultValue=""
                                    onChange={(e) => e.target.value && navigate(e.target.value)}
                                >
                                    <option value="" disabled>Go to Specific Report...</option>
                                    <option value="/dashboard/self-service/stock">Stock Master</option>
                                    <optgroup label="Sales Summary">
                                        <option value="/dashboard/self-service/reports/sales/day">Day Wise</option>
                                        <option value="/dashboard/self-service/reports/sales/month">Month Wise</option>
                                        <option value="/dashboard/self-service/reports/sales/item">Item Wise</option>
                                        <option value="/dashboard/self-service/reports/sales/category">Category Wise</option>
                                        <option value="/dashboard/self-service/reports/sales/transaction">Transaction Wise</option>
                                        <option value="/dashboard/self-service/reports/sales/profit">Sales Profit</option>
                                    </optgroup>
                                    <optgroup label="Purchase Summary">
                                        <option value="/dashboard/self-service/reports/purchase/day">Day Wise</option>
                                        <option value="/dashboard/self-service/reports/purchase/supplier">Supplier Wise</option>
                                    </optgroup>
                                </select>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    ▼
                                </span>
                            </div>
                        }
                    />
                    <div className="dashboard-content">
                        <div className="page-header">
                            <div className="page-title">
                                <Skeleton width="200px" height="32px" className="mb-2" />
                                <Skeleton width="300px" height="20px" />
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

                        <div className="reports-grid">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="data-card chart-card">
                                    <Skeleton height="24px" width="150px" className="mb-6" />
                                    <Skeleton height="250px" width="100%" />
                                </div>
                            ))}
                        </div>

                        <div className="data-card">
                            <h3 className="card-title">Top Selling Products</h3>
                            <table className="custom-table">
                                <thead><tr><th>Name</th><th>Qty</th><th>Revenue</th></tr></thead>
                                <tbody><TableSkeleton rows={5} cols={3} /></tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Sales Reports"
                    actions={
                        <div className="relative">
                            <select
                                className="input-premium-modern text-xs font-bold appearance-none pr-8 cursor-pointer"
                                defaultValue=""
                                onChange={(e) => e.target.value && navigate(e.target.value)}
                            >
                                <option value="" disabled>Go to Specific Report...</option>
                                <option value="/dashboard/self-service/stock">Stock Master</option>
                                <optgroup label="Sales Summary">
                                    <option value="/dashboard/self-service/reports/sales/day">Day Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/month">Month Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/item">Item Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/category">Category Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/transaction">Transaction Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/profit">Sales Profit</option>
                                </optgroup>
                                <optgroup label="Purchase Summary">
                                    <option value="/dashboard/self-service/reports/purchase/day">Day Wise</option>
                                    <option value="/dashboard/self-service/reports/purchase/supplier">Supplier Wise</option>
                                </optgroup>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                ▼
                            </span>
                        </div>
                    }
                />

                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Sales Reports</h2>
                            <p>Comprehensive business analytics and insights</p>
                        </div>
                        <div className="date-filter">
                            <label htmlFor="dateRange">Period:</label>
                            <select
                                id="dateRange"
                                className="input-field"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="0">Today</option>
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="60">Last 60 Days</option>
                                <option value="90">Last 90 Days</option>
                            </select>
                            <button
                                className="refresh-btn"
                                onClick={fetchData}
                                title="Refresh data"
                                style={{
                                    marginLeft: '10px',
                                    padding: '8px 16px',
                                    backgroundColor: '#7ea1c4',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                            >
                                ↻ Refresh
                            </button>
                            <label style={{ marginLeft: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span>Auto-refresh (30s)</span>
                            </label>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="widgets-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Today's Sales</span>
                                <div className="stat-icon" style={{ backgroundColor: '#7ea1c415', color: '#7ea1c4' }}>
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <div className="stat-value">₹{dailyData?.totalSales?.toLocaleString() || '0'}</div>
                            <div className="stat-trend trend-up">+12.5% <span style={{ color: 'var(--galaxy-muted)', fontSize: '0.75rem' }}>vs yesterday</span></div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Total Bills</span>
                                <div className="stat-icon" style={{ backgroundColor: '#7ea1c415', color: '#7ea1c4' }}>
                                    <FileText size={24} />
                                </div>
                            </div>
                            <div className="stat-value">{dailyData?.totalBills || 0}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Cash Collection</span>
                                <div className="stat-icon" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
                                    <CreditCard size={24} />
                                </div>
                            </div>
                            <div className="stat-value">
                                ₹{dailyData?.paymentSummary?.find(p => p.mode === 'CASH')?.amount?.toLocaleString() || '0'}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">UPI/Online</span>
                                <div className="stat-icon" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}>
                                    <CreditCard size={24} />
                                </div>
                            </div>
                            <div className="stat-value">
                                ₹{(
                                    (dailyData?.paymentSummary?.find(p => p.mode?.toUpperCase() === 'UPI')?.amount || 0) +
                                    (dailyData?.paymentSummary?.find(p => p.mode?.toUpperCase() === 'ONLINE')?.amount || 0) +
                                    (dailyData?.paymentSummary?.find(p => p.mode?.toUpperCase() === 'CARD')?.amount || 0) +
                                    (dailyData?.paymentSummary?.find(p => p.mode?.toUpperCase() === 'DIGITAL')?.amount || 0)
                                ).toLocaleString() || '0'}
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="reports-grid">
                        <div className="data-card chart-card">
                            <h3 className="card-title">
                                <Calendar size={20} color="var(--primary-500)" />
                                Daily Sales Trend
                            </h3>
                            <div className="chart-container">
                                {dailySalesData && <Line data={dailySalesData} options={chartOptions} />}
                            </div>
                        </div>

                        <div className="data-card chart-card">
                            <h3 className="card-title">
                                <BarChart3 size={20} color="var(--primary-500)" />
                                Category-wise Sales
                            </h3>
                            <div className="chart-container">
                                {categorySalesData && <Bar data={categorySalesData} options={chartOptions} />}
                            </div>
                        </div>

                        <div className="data-card chart-card">
                            <h3 className="card-title">
                                <PieChart size={20} color="var(--primary-500)" />
                                Payment Modes
                            </h3>
                            <div className="chart-container pie-container">
                                {paymentModeData && <Pie data={paymentModeData} options={pieOptions} />}
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="data-card">
                        <h3 className="card-title">
                            <ArrowUpRight size={20} color="var(--primary-500)" />
                            Top Selling Products
                        </h3>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Quantity Sold</th>
                                    <th>Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="empty-state">
                                            <p>No sales data available for the selected period</p>
                                        </td>
                                    </tr>
                                ) : topProducts.map((product, index) => (
                                    <tr key={product.productId}>
                                        <td style={{ fontWeight: 600 }}>
                                            <span className="rank-badge">#{index + 1}</span>
                                            {product.name}
                                        </td>
                                        <td>
                                            <span className="quantity-badge">{product.quantity}</span>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>₹{product.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;
