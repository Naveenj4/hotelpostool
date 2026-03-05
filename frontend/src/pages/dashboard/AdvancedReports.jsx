import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
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
    PieChart as PieIcon,
    ChevronRight,
    Loader2,
    BookOpen,
    Filter,
    BarChart3,
    Activity,
    Wallet
} from 'lucide-react';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AdvancedReports = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('SUMMARY'); // SUMMARY, SALES, PURCHASE, ACCOUNTS

    const [supplierOutstanding, setSupplierOutstanding] = useState([]);
    const [customerOutstanding, setCustomerOutstanding] = useState([]);
    const [stockValuation, setStockValuation] = useState({ items: [], totalValue: 0 });
    const [profitLoss, setProfitLoss] = useState({ revenue: 0, purchases: 0, expenses: 0, netProfit: 0 });

    const [salesByBrand, setSalesByBrand] = useState([]);
    const [salesByCaptain, setSalesByCaptain] = useState([]);
    const [purchaseSummary, setPurchaseSummary] = useState([]);
    const [daybook, setDaybook] = useState([]);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

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
            const query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;

            const urls = [
                `${import.meta.env.VITE_API_URL}/reports/supplier-outstanding`,
                `${import.meta.env.VITE_API_URL}/reports/customer-outstanding`,
                `${import.meta.env.VITE_API_URL}/reports/stock-valuation`,
                `${import.meta.env.VITE_API_URL}/reports/profit-loss${query}`,
                `${import.meta.env.VITE_API_URL}/reports/sales-by-brand${query}`,
                `${import.meta.env.VITE_API_URL}/reports/sales-by-captain${query}`,
                `${import.meta.env.VITE_API_URL}/reports/purchase-summary${query}`,
                `${import.meta.env.VITE_API_URL}/reports/daybook?date=${dateRange.end}`
            ];

            const responses = await Promise.all(urls.map(url => fetch(url, { headers })));
            const data = await Promise.all(responses.map(r => r.json()));

            if (data[0].success) setSupplierOutstanding(data[0].data);
            if (data[1].success) setCustomerOutstanding(data[1].data);
            if (data[2].success) setStockValuation(data[2].data);
            if (data[3].success) {
                const pl = data[3].data;
                setProfitLoss({
                    revenue: pl.income.total,
                    purchases: pl.direct_expenses.total,
                    expenses: pl.indirect_expenses.total,
                    grossProfit: pl.gross_profit,
                    netProfit: pl.net_profit
                });
            }
            if (data[4].success) setSalesByBrand(data[4].data);
            if (data[5].success) setSalesByCaptain(data[5].data);
            if (data[6].success) setPurchaseSummary(data[6].data);
            if (data[7].success) setDaybook(data[7].data);

        } catch (err) {
            console.error("Report fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, [dateRange]);

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        const keys = Object.keys(data[0]);
        const headers = keys.join(',');
        const rows = data.map(obj => keys.map(k => obj[k]).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Assembling Enterprise Insights...</p>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content fade-in p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    <div className="master-header-premium-refined flex-col md:flex-row mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                                    <BarChart3 size={20} />
                                </div>
                                <span className="metric-pill-modern">Predictive Analytics</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Enterprise Intelligence</h2>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Multi-module financial health & real-time operational performance.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                            <div className="flex items-center gap-3 px-5 border-r border-slate-100">
                                <Calendar size={22} className="text-indigo-300" />
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="text-sm font-black text-slate-700 outline-none bg-transparent cursor-pointer" />
                                <span className="text-slate-200 font-black">/</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="text-sm font-black text-slate-700 outline-none bg-transparent cursor-pointer" />
                            </div>
                            <button onClick={fetchAllReports} className="btn-glow bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all flex items-center justify-center">
                                <Search size={22} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-[1.25rem] mb-10 w-fit backdrop-blur-sm">
                        {['SUMMARY', 'SALES', 'PURCHASE', 'ACCOUNTS'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm premium-shadow scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'SUMMARY' && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="bento-card group h-64 p-10 flex flex-col justify-between border-emerald-100/50 hover:border-emerald-200">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${profitLoss.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            <TrendingUp size={28} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fiscal Yield</p>
                                            <div className="metric-pill-modern mt-2 bg-emerald-50 text-emerald-600 border-none">Net Growth</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={`text-5xl font-black tracking-tighter leading-none ${profitLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{(profitLoss.netProfit || 0).toLocaleString()}</h3>
                                        <p className="text-xs font-black text-slate-400 mt-4 uppercase tracking-widest opacity-50">Operational Net Recalibration</p>
                                    </div>
                                </div>

                                <div className="bento-card group h-64 p-10 flex flex-col justify-between border-indigo-100/50 hover:border-indigo-200">
                                    <div className="flex items-center justify-between">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                            <DollarSign size={28} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Capital Velocity</p>
                                            <div className="metric-pill-modern mt-2 bg-indigo-50 text-indigo-600 border-none">Topline Gross</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">₹{(profitLoss.revenue || 0).toLocaleString()}</h3>
                                        <p className="text-xs font-black text-slate-400 mt-4 uppercase tracking-widest opacity-50">Aggregate Liquidity Staging</p>
                                    </div>
                                </div>

                                <div className="bento-card group h-64 p-10 flex flex-col justify-between border-amber-100/50 hover:border-amber-200">
                                    <div className="flex items-center justify-between">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                            <Package size={28} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Asset Valuation</p>
                                            <div className="metric-pill-modern mt-2 bg-amber-50 text-amber-600 border-none">Stock Density</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">₹{(stockValuation.totalValue || 0).toLocaleString()}</h3>
                                        <p className="text-xs font-black text-slate-400 mt-4 uppercase tracking-widest opacity-50">Current Inventory Capitalization</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bento-card p-0 overflow-hidden shadow-2xl">
                                    <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-rose-50/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                                                <Truck size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Vendor Payables</h4>
                                                <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest">Distributed liabilities across supply chain</p>
                                            </div>
                                        </div>
                                        <button onClick={() => exportToCSV(supplierOutstanding, 'Suppliers')} className="w-12 h-12 bg-white text-slate-400 hover:text-indigo-600 hover:scale-110 rounded-2xl transition-all shadow-sm flex items-center justify-center"><Download size={24} /></button>
                                    </div>
                                    <div className="max-h-[500px] overflow-y-auto px-6 py-6 space-y-4">
                                        {supplierOutstanding.map((s, i) => (
                                            <div key={i} className="flex justify-between items-center p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300 text-xl group-hover:scale-110 transition-transform">V</div>
                                                    <span className="font-black text-slate-800 text-lg uppercase tracking-tight">{s.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-rose-600 tracking-tighter">₹{(s.balance || 0).toLocaleString()}</span>
                                                    <div className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em] mt-1 italic">Liability Vector</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bento-card p-0 overflow-hidden shadow-2xl">
                                    <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-emerald-50/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ledger Credits</h4>
                                                <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest">Pending inflows from client accounts</p>
                                            </div>
                                        </div>
                                        <button onClick={() => exportToCSV(customerOutstanding, 'Customers')} className="w-12 h-12 bg-white text-slate-400 hover:text-indigo-600 hover:scale-110 rounded-2xl transition-all shadow-sm flex items-center justify-center"><Download size={24} /></button>
                                    </div>
                                    <div className="max-h-[500px] overflow-y-auto px-6 py-6 space-y-4">
                                        {customerOutstanding.map((c, i) => (
                                            <div key={i} className="flex justify-between items-center p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300 text-xl group-hover:scale-110 transition-transform">C</div>
                                                    <span className="font-black text-slate-800 text-lg uppercase tracking-tight">{c.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">₹{(c.balance || 0).toLocaleString()}</span>
                                                    <div className="text-[9px] font-black text-emerald-300 uppercase tracking-[0.2em] mt-1 italic">Receivable Stream</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SALES' && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                            <div className="lg:col-span-3 bento-card p-10 h-[650px] flex flex-col shadow-2xl">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                                <BarChart3 size={28} />
                                            </div>
                                            Brand Architecture
                                        </h4>
                                        <p className="text-slate-400 font-black mt-2 text-xs uppercase tracking-widest">Revenue distribution per strategic brand entity</p>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <Bar data={{
                                        labels: salesByBrand.map(b => b.brand),
                                        datasets: [{
                                            label: 'Fiscal Output',
                                            data: salesByBrand.map(b => b.amount),
                                            backgroundColor: '#6366f1',
                                            borderRadius: 20,
                                            borderSkipped: false,
                                            hoverBackgroundColor: '#4f46e5',
                                            barThickness: 48
                                        }]
                                    }} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { cornerRadius: 20, padding: 20, titleFont: { size: 16, weight: '900' }, bodyFont: { size: 14, weight: 'bold' }, background: '#0f172a' } },
                                        scales: {
                                            y: { border: { display: false }, grid: { color: '#f8fafc', lineWidth: 2 }, ticks: { font: { weight: '900', size: 12 }, color: '#cbd5e1' } },
                                            x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: '900', size: 11 }, color: '#64748b', autoSkip: false } }
                                        }
                                    }} />
                                </div>
                            </div>

                            <div className="lg:col-span-2 bento-card p-10 h-[650px] flex flex-col shadow-2xl overflow-hidden relative">
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl"></div>
                                <div className="mb-12 text-center relative z-10">
                                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Deployment Share</h4>
                                    <p className="text-slate-400 font-black mt-2 text-xs uppercase tracking-widest">Master Service Distribution Index</p>
                                </div>
                                <div className="flex-1 flex items-center justify-center p-6 relative z-10 scale-110">
                                    <Pie data={{
                                        labels: salesByCaptain.map(c => c.captain),
                                        datasets: [{
                                            data: salesByCaptain.map(c => c.amount),
                                            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'],
                                            borderWidth: 8,
                                            borderColor: '#ffffff',
                                            hoverOffset: 30
                                        }]
                                    }} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'rectRounded', font: { weight: '900', size: 11 }, padding: 30, color: '#64748b' } }
                                        },
                                        cutout: '55%'
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PURCHASE' && (
                        <div className="bento-card p-0 overflow-hidden shadow-2xl">
                            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 backdrop-blur-md">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-md border border-slate-50">
                                        <Truck size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-4xl font-black text-slate-900 tracking-tighter">Procurement Matrix</h4>
                                        <p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Detailed audit of resource inward and fiscal commitment</p>
                                    </div>
                                </div>
                                <button onClick={() => exportToCSV(purchaseSummary, 'Purchases')} className="btn-glow bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-4 group transition-all">
                                    <Download size={22} className="group-hover:-translate-y-1 transition-transform" /> Manifest Extraction
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="modern-table-premium">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                                            <th className="px-12 py-8 text-left">Vendor Infrastructure</th>
                                            <th className="px-8 py-8">Aggregated commitment</th>
                                            <th className="px-8 py-8">Capital Injected</th>
                                            <th className="px-8 py-8 text-right">Deferred Staging</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchaseSummary.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50/30 transition-all">
                                                <td className="px-12 py-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-xl tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{p.name || 'GLOBAL CORE ENTITY'}</span>
                                                        <span className="text-[10px] font-black text-indigo-300 mt-2 tracking-widest bg-indigo-50/50 w-fit px-3 py-1 rounded-lg uppercase">System Ref Vector: {i + 102}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{p.amount?.toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="metric-pill-modern bg-emerald-50 text-emerald-600 border-none font-black text-xl px-6 py-2">₹{p.paid?.toLocaleString()}</div>
                                                </td>
                                                <td className="px-8 py-8 text-right">
                                                    <span className="text-3xl font-black text-rose-600 tracking-tighter">₹{p.due?.toLocaleString()}</span>
                                                    <div className="text-[9px] font-black text-rose-300 uppercase tracking-widest mt-1 opacity-50">Staged Liability</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACCOUNTS' && (
                        <div className="max-w-5xl mx-auto space-y-10">
                            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 premium-shadow relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                                <div className="flex justify-between items-center mb-12 relative z-10">
                                    <div>
                                        <h4 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                                                <BookOpen size={28} />
                                            </div>
                                            Financial Daybook
                                        </h4>
                                        <p className="text-slate-500 font-medium mt-1">Chronological audit trail of all transactions.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest">Date: {new Date(dateRange.end).toLocaleDateString()}</div>
                                        <button onClick={() => exportToCSV(daybook, 'Daybook')} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"><Download size={24} /></button>
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10 text-center">
                                    {daybook.length === 0 ? (
                                        <div className="py-24 group opacity-20">
                                            <Activity size={100} className="mx-auto mb-6 group-hover:scale-110 transition-transform" />
                                            <p className="text-3xl font-black">Audit trail is currently clear.</p>
                                            <p className="text-lg font-bold">No ledger activities were logged for this specific period.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {daybook.map((tr, i) => (
                                                <div key={i} className="group p-6 rounded-3xl border border-slate-50 hover:border-indigo-100 hover:bg-slate-50/50 transition-all flex justify-between items-center bg-white shadow-sm hover:shadow-md">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black shadow-inner ${tr.side === 'IN' ? 'bg-emerald-50 text-emerald-600' : (tr.side === 'OUT' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400')}`}>
                                                            <span className="text-base leading-none">{tr.side === 'IN' ? '+' : '-'}</span>
                                                            <span className="text-[10px] uppercase opacity-60 font-black tracking-widest">{tr.side || 'LOG'}</span>
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-black text-slate-800 text-xl leading-tight group-hover:text-indigo-700 transition-colors uppercase">{tr.desc}</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">{tr.type}</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time: {new Date(tr.time).toLocaleTimeString()} • Audit ID: {tr.ref}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-3xl font-black tracking-tighter ${tr.side === 'IN' ? 'text-emerald-600' : (tr.side === 'OUT' ? 'text-rose-600' : 'text-slate-800')}`}>
                                                            ₹{tr.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdvancedReports;
