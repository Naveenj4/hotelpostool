import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './BillsAndSalesPage.css';
import {
    TrendingUp,
    FileText,
    CreditCard,
    Wallet,
    DollarSign,
    Smartphone,
    Calendar,
    Trash2
} from 'lucide-react';
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

const BillsAndSalesPage = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [salesData, setSalesData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [allBills, setAllBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7');
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

            const { startDate, endDate } = getDateRange(dateRange);
            const startDateStr = formatLocalDate(startDate);
            const endDateStr = formatLocalDate(endDate);

            const queryParams = `?startDate=${startDateStr}&endDate=${endDateStr}`;

            // Fetch daily report (which has payment summary)
            const dailyRes = await fetch(`${import.meta.env.VITE_API_URL}/reports/daily${queryParams}`, { headers });
            const dailyData = await dailyRes.json();

            // Fetch weekly for trend chart
            const weeklyRes = await fetch(`${import.meta.env.VITE_API_URL}/reports/weekly${queryParams}`, { headers });
            const weeklyData = await weeklyRes.json();

            // Fetch all bills
            const billsRes = await fetch(`${import.meta.env.VITE_API_URL}/bills${queryParams}`, { headers });
            const billsData = await billsRes.json();

            if (dailyData.success) {
                setSalesData(dailyData.data);
            }

            if (weeklyData.success) {
                setChartData(weeklyData.data);
            }

            if (billsData.success) {
                setAllBills(billsData.data);
            }
        } catch (err) {
            console.error("Failed to fetch report data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBill = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this bill? Stock will be reverted.")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bills/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                fetchData();
            } else {
                alert(result.error);
            }
        } catch (err) {
            alert("Failed to delete bill");
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

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

    // Prepare payment mode breakdown data
    const getPaymentAmount = (mode) => {
        if (!salesData?.paymentSummary) return 0;
        return salesData.paymentSummary.find(p => p.mode?.toUpperCase() === mode?.toUpperCase())?.amount || 0;
    };

    // Chart data for payment modes
    const paymentModeData = salesData?.paymentSummary ? {
        labels: salesData.paymentSummary.map(p => p.mode),
        datasets: [
            {
                label: 'Amount (₹)',
                data: salesData.paymentSummary.map(p => p.amount),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(126, 161, 196, 0.7)',
                    '#ef4444',
                    '#f59e0b',
                    '#8b5cf6',
                    '#06b6d4'
                ],
                borderColor: [
                    '#10b981',
                    '#7ea1c4',
                    '#ef4444',
                    '#f59e0b',
                    '#8b5cf6',
                    '#06b6d4'
                ],
                borderWidth: 1
            }
        ]
    } : null;

    // Chart data for daily trend
    const dailySalesChart = chartData?.dailyBreakdown ? {
        labels: chartData.dailyBreakdown.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Daily Sales (₹)',
                data: chartData.dailyBreakdown.map(day => day.totalSales),
                borderColor: '#7ea1c4',
                backgroundColor: 'rgba(126, 161, 196, 0.1)',
                tension: 0.4,
                fill: true
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
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="dashboard-content">
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading bills and sales data...</p>
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
                <Header toggleSidebar={toggleSidebar} />

                <div className="dashboard-content">
                    <div className="page-header bills-page-header">
                        <div className="page-title">
                            <h2>Bills & Sales</h2>
                            <p>Detailed summary of bills and sales by payment mode</p>
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
                                <span className="stat-label">Total Sales</span>
                                <div className="stat-icon" style={{ backgroundColor: '#7ea1c415', color: '#7ea1c4' }}>
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <div className="stat-value">₹{salesData?.totalSales?.toLocaleString() || '0'}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Total Bills</span>
                                <div className="stat-icon" style={{ backgroundColor: '#5e81ac15', color: '#5e81ac' }}>
                                    <FileText size={24} />
                                </div>
                            </div>
                            <div className="stat-value">{salesData?.totalBills || 0}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Cash</span>
                                <div className="stat-icon" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
                                    <Wallet size={24} />
                                </div>
                            </div>
                            <div className="stat-value">
                                ₹{getPaymentAmount('CASH')?.toLocaleString() || '0'}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">UPI</span>
                                <div className="stat-icon" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}>
                                    <Smartphone size={24} />
                                </div>
                            </div>
                            <div className="stat-value">
                                ₹{getPaymentAmount('UPI')?.toLocaleString() || '0'}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Card</span>
                                <div className="stat-icon" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
                                    <CreditCard size={24} />
                                </div>
                            </div>
                            <div className="stat-value">
                                ₹{getPaymentAmount('CARD')?.toLocaleString() || '0'}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Online</span>
                                <div className="stat-icon" style={{ backgroundColor: '#06b6d415', color: '#06b6d4' }}>
                                    <DollarSign size={24} />
                                </div>
                            </div>
                            <div className="stat-value">
                                ₹{getPaymentAmount('ONLINE')?.toLocaleString() || '0'}
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
                                {dailySalesChart && <Line data={dailySalesChart} options={chartOptions} />}
                            </div>
                        </div>

                        <div className="data-card chart-card">
                            <h3 className="card-title">
                                <Wallet size={20} color="var(--primary-500)" />
                                Payment Mode Breakdown
                            </h3>
                            <div className="chart-container pie-container">
                                {paymentModeData && <Pie data={paymentModeData} options={pieOptions} />}
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary Table */}
                    <div className="data-card">
                        <h3 className="card-title">
                            <TrendingUp size={20} color="var(--primary-500)" />
                            Payment Mode Summary
                        </h3>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Payment Mode</th>
                                    <th>Amount</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData?.paymentSummary && salesData.paymentSummary.length > 0 ? (
                                    salesData.paymentSummary.map((payment, index) => {
                                        const percentage = (payment.amount / salesData.totalSales * 100).toFixed(2);
                                        return (
                                            <tr key={index}>
                                                <td style={{ fontWeight: 600 }}>{payment.mode}</td>
                                                <td style={{ fontWeight: 700 }}>₹{payment.amount.toLocaleString()}</td>
                                                <td>
                                                    <span className="quantity-badge">{percentage}%</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="empty-state">
                                            <p>No sales data available for the selected period</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* All Bills Section */}
                    <div className="data-card" style={{ marginTop: '2rem' }}>
                        <h3 className="card-title">
                            <FileText size={20} color="var(--primary-500)" />
                            All Bills ({allBills.length})
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            {allBills.length > 0 ? (
                                <table className="custom-table bills-table">
                                    <thead>
                                        <tr>
                                            <th className="col-sno">S.NO</th>
                                            <th className="col-bill-no">Bill No</th>
                                            <th className="col-date">Date & Time</th>
                                            <th className="text-left">Item Names</th>
                                            <th className="col-qty">Qty</th>
                                            <th className="col-total">Total</th>
                                            <th className="col-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allBills.map((bill, index) => {
                                            const itemNames = bill.items?.map(item => `${item.name}(${item.quantity})`).join(', ') || '-';
                                            const totalQty = bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                                            return (
                                                <tr key={bill._id}>
                                                    <td className="col-sno text-center">{index + 1}</td>
                                                    <td className="col-bill-no">{bill.bill_number}</td>
                                                    <td className="col-date">
                                                        {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                                                            month: 'short',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="col-items" title={itemNames}>
                                                        {itemNames}
                                                    </td>
                                                    <td className="col-qty text-center">{totalQty}</td>
                                                    <td className="col-total">₹{bill.grand_total?.toLocaleString() || '0'}</td>
                                                    <td className="col-actions text-center">
                                                        <button
                                                            onClick={() => handleDeleteBill(bill._id)}
                                                            className="action-btn delete"
                                                            title="Cancel Bill"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="empty-state">
                                    <FileText size={48} className="empty-icon mx-auto" />
                                    <p>No bills found for the selected period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BillsAndSalesPage;
