import { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    TrendingUp,
    Users,
    Truck,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Calendar,
    Search,
    Download,
    PieChart,
    ChevronRight,
    Loader2
} from 'lucide-react';

const AdvancedReports = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [supplierOutstanding, setSupplierOutstanding] = useState([]);
    const [customerOutstanding, setCustomerOutstanding] = useState([]);
    const [stockValuation, setStockValuation] = useState({ items: [], totalValue: 0 });
    const [profitLoss, setProfitLoss] = useState({ revenue: 0, purchases: 0, expenses: 0, netProfit: 0 });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [supRes, custRes, stockRes, plRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/reports/supplier-outstanding`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/customer-outstanding`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/stock-valuation`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/reports/profit-loss`, { headers })
            ]);

            const supData = await supRes.json();
            const custData = await custRes.json();
            const stockData = await stockRes.json();
            const plData = await plRes.json();

            if (supData.success) setSupplierOutstanding(supData.data);
            if (custData.success) setCustomerOutstanding(custData.data);
            if (stockData.success) setStockValuation(stockData.data);
            if (plData.success) setProfitLoss(plData.data);
        } catch (err) {
            console.error("Report fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, []);

    const plChartData = [
        { name: 'Revenue', value: profitLoss.revenue, color: '#10b981' },
        { name: 'Purchases', value: profitLoss.purchases, color: '#ef4444' },
        { name: 'Expenses', value: profitLoss.expenses, color: '#f59e0b' }
    ];

    if (loading) return <div className="loader-container-full"><Loader2 className="animate-spin" size={48} /></div>;

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Standard Admin & Accounting Reports</h2>
                            <p>Deep dive into outstandings, inventory value, and financial performance.</p>
                        </div>
                        <button onClick={fetchAllReports} className="btn-secondary px-4 py-2 rounded-lg border flex items-center gap-2">
                            ↻ Refresh Data
                        </button>
                    </div>

                    {/* Top Row: Financial Summary */}
                    <div className="summary-grid-pl mb-8">
                        <div className={`pl-card ${profitLoss.netProfit >= 0 ? 'profit' : 'loss'}`}>
                            <div className="pl-card-icon"><TrendingUp size={24} /></div>
                            <div className="pl-card-info">
                                <span>Net Profit / (Loss)</span>
                                <h3>₹{profitLoss.netProfit.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="pl-card revenue">
                            <div className="pl-card-icon"><DollarSign size={24} /></div>
                            <div className="pl-card-info">
                                <span>Total Revenue</span>
                                <h3>₹{profitLoss.revenue.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="pl-card stock-val">
                            <div className="pl-card-icon"><Package size={24} /></div>
                            <div className="pl-card-info">
                                <span>Stock Valuation</span>
                                <h3>₹{stockValuation.totalValue.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="reports-main-grid">
                        {/* Column 1 */}
                        <div className="reports-col">
                            <div className="report-block">
                                <div className="report-block-header">
                                    <div className="header-left">
                                        <Truck size={20} color="#6366f1" />
                                        <h4>Supplier Outstanding</h4>
                                    </div>
                                    <span className="total-badge danger">₹{supplierOutstanding.reduce((s, i) => s + i.balance, 0).toLocaleString()}</span>
                                </div>
                                <div className="list-container">
                                    {supplierOutstanding.map((s, idx) => (
                                        <div key={idx} className="list-item">
                                            <div className="item-main">
                                                <p className="item-name">{s.name}</p>
                                                <p className="item-sub">{s.contact || 'No contact'}</p>
                                            </div>
                                            <p className="item-value danger">₹{s.balance}</p>
                                        </div>
                                    ))}
                                    {supplierOutstanding.length === 0 && <p className="empty-txt">No supplier payables.</p>}
                                </div>
                            </div>

                            <div className="report-block mt-6">
                                <div className="report-block-header">
                                    <div className="header-left">
                                        <Users size={20} color="#10b981" />
                                        <h4>Customer Outstanding</h4>
                                    </div>
                                    <span className="total-badge success">₹{customerOutstanding.reduce((s, i) => s + i.balance, 0).toLocaleString()}</span>
                                </div>
                                <div className="list-container">
                                    {customerOutstanding.map((c, idx) => (
                                        <div key={idx} className="list-item">
                                            <div className="item-main">
                                                <p className="item-name">{c.name}</p>
                                                <p className="item-sub">{c.phone}</p>
                                            </div>
                                            <p className="item-value danger">₹{c.balance}</p>
                                        </div>
                                    ))}
                                    {customerOutstanding.length === 0 && <p className="empty-txt">No customer receivables.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="reports-col">
                            <div className="report-block">
                                <div className="report-block-header">
                                    <div className="header-left">
                                        <PieChart size={20} color="#f59e0b" />
                                        <h4>Profit & Loss Visual</h4>
                                    </div>
                                </div>
                                <div className="chart-wrapper-small" style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={plChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <Tooltip />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {plChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="pl-details-box">
                                    <div className="pl-detail-row"><span>Revenue (A)</span> <span className="text-success">+ ₹{profitLoss.revenue}</span></div>
                                    <div className="pl-detail-row"><span>Purchases (B)</span> <span className="text-danger">- ₹{profitLoss.purchases}</span></div>
                                    <div className="pl-detail-row"><span>Expenses (C)</span> <span className="text-danger">- ₹{profitLoss.expenses}</span></div>
                                    <div className="pl-detail-row net"><span>Net Profit (A - B - C)</span> <span className={profitLoss.netProfit >= 0 ? 'text-success' : 'text-danger'}>₹{profitLoss.netProfit}</span></div>
                                </div>
                            </div>

                            <div className="report-block mt-6">
                                <div className="report-block-header">
                                    <div className="header-left">
                                        <Package size={20} color="#3b82f6" />
                                        <h4>High Value Stock</h4>
                                    </div>
                                </div>
                                <div className="list-container">
                                    {stockValuation.items.slice(0, 10).map((item, idx) => (
                                        <div key={idx} className="list-item">
                                            <div className="item-main">
                                                <p className="item-name">{item.name}</p>
                                                <p className="item-sub">Stock: {item.stock} @ ₹{item.purchase_price}</p>
                                            </div>
                                            <p className="item-value">₹{item.value}</p>
                                        </div>
                                    ))}
                                    {stockValuation.items.length === 0 && <p className="empty-txt">Inventory is empty.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style jsx>{`
                .summary-grid-pl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
                .pl-card { background: white; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; border: 1px solid #e2e8f0; transition: transform 0.2s; }
                .pl-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                .pl-card-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .pl-card.profit .pl-card-icon { background: #d1fae5; color: #10b981; }
                .pl-card.loss .pl-card-icon { background: #fee2e2; color: #ef4444; }
                .pl-card.revenue .pl-card-icon { background: #e0e7ff; color: #6366f1; }
                .pl-card.stock-val .pl-card-icon { background: #fef3c7; color: #f59e0b; }
                .pl-card-info span { font-size: 0.85rem; color: #64748b; font-weight: 500; }
                .pl-card-info h3 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-top: 2px; }
                
                .reports-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .report-block { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
                .report-block-header { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
                .header-left { display: flex; align-items: center; gap: 10px; }
                .header-left h4 { font-weight: 700; color: #334155; }
                .total-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
                .total-badge.danger { background: #fee2e2; color: #991b1b; }
                .total-badge.success { background: #d1fae5; color: #065f46; }

                .list-container { max-height: 400px; overflow-y: auto; }
                .list-item { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
                .list-item:hover { background: #f8fafc; }
                .item-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
                .item-sub { font-size: 0.75rem; color: #94a3b8; }
                .item-value { font-weight: 700; color: #475569; font-size: 0.95rem; }
                .item-value.danger { color: #ef4444; }

                .pl-details-box { padding: 1.25rem; background: #f8fafc; border-radius: 12px; margin: 0 1.25rem 1.25rem; border: 1px solid #e2e8f0; }
                .pl-detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; color: #64748b; }
                .pl-detail-row.net { border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 8px; font-weight: 700; color: #0f172a; font-size: 1rem; }
                .text-success { color: #10b981; }
                .text-danger { color: #ef4444; }
                .empty-txt { padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.9rem; }
                .loader-container-full { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; }
                
                @media (max-width: 1024px) { .reports-main-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
};

export default AdvancedReports;
