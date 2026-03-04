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
                <div className="dashboard-content fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="text-indigo-600" size={20} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Real-time Analytics</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Enterprise Intelligence</h2>
                            <p className="text-slate-500 font-medium">Multi-module financial health & operational performance.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-[1.5rem] border border-slate-100 premium-shadow">
                            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                                <Calendar size={18} className="text-slate-400" />
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="text-xs font-bold text-slate-700 outline-none bg-transparent" />
                                <span className="text-slate-300 font-black">→</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="text-xs font-bold text-slate-700 outline-none bg-transparent" />
                            </div>
                            <button onClick={fetchAllReports} className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-slate-900 transition-all shadow-md">
                                <Search size={18} />
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col justify-between transition-all hover:scale-[1.02] premium-shadow h-52 relative overflow-hidden ${profitLoss.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <div className="absolute -right-6 -bottom-6 opacity-10">
                                        <TrendingUp size={160} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${profitLoss.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            <TrendingUp size={24} />
                                        </div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Net Profit/Loss</p>
                                    </div>
                                    <h3 className={`text-4xl font-black tracking-tighter ${profitLoss.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{(profitLoss.netProfit || 0).toLocaleString()}</h3>
                                </div>

                                <div className="p-8 rounded-[2.5rem] border-2 border-indigo-100 bg-indigo-50 flex flex-col justify-between transition-all hover:scale-[1.02] premium-shadow h-52 relative overflow-hidden">
                                    <div className="absolute -right-6 -bottom-6 opacity-10">
                                        <DollarSign size={160} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                                            <DollarSign size={24} />
                                        </div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Gross Revenue</p>
                                    </div>
                                    <h3 className="text-4xl font-black text-indigo-800 tracking-tighter">₹{(profitLoss.revenue || 0).toLocaleString()}</h3>
                                </div>

                                <div className="p-8 rounded-[2.5rem] border-2 border-amber-100 bg-amber-50 flex flex-col justify-between transition-all hover:scale-[1.02] premium-shadow h-52 relative overflow-hidden">
                                    <div className="absolute -right-6 -bottom-6 opacity-10">
                                        <Package size={160} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                                            <Package size={24} />
                                        </div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Stock Asset Value</p>
                                    </div>
                                    <h3 className="text-4xl font-black text-amber-700 tracking-tighter">₹{(stockValuation.totalValue || 0).toLocaleString()}</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden premium-shadow">
                                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                                <Truck size={24} className="text-rose-500" />
                                                Supplier Payables
                                            </h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1">Outstanding amounts due to vendors.</p>
                                        </div>
                                        <button onClick={() => exportToCSV(supplierOutstanding, 'Suppliers')} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all hover:bg-indigo-50"><Download size={20} /></button>
                                    </div>
                                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto px-4">
                                        {supplierOutstanding.map((s, i) => (
                                            <div key={i} className="px-4 py-5 flex justify-between items-center hover:bg-slate-50/50 rounded-2xl transition-all group">
                                                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{s.name}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-rose-600 font-black text-lg">₹{(s.balance || 0).toLocaleString()}</span>
                                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-tighter">Debit Accrual</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden premium-shadow">
                                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                                <Users size={24} className="text-emerald-500" />
                                                Customer Credits
                                            </h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1">Pending payments from customers/ledgers.</p>
                                        </div>
                                        <button onClick={() => exportToCSV(customerOutstanding, 'Customers')} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all hover:bg-indigo-50"><Download size={20} /></button>
                                    </div>
                                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto px-4">
                                        {customerOutstanding.map((c, i) => (
                                            <div key={i} className="px-4 py-5 flex justify-between items-center hover:bg-slate-50/50 rounded-2xl transition-all group">
                                                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{c.name}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-emerald-600 font-black text-lg">₹{(c.balance || 0).toLocaleString()}</span>
                                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-tighter">Credit Accrual</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SALES' && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                            <div className="lg:col-span-3 bg-white p-10 rounded-[2.5rem] border border-slate-100 premium-shadow h-[600px] flex flex-col">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                            <BarChart3 className="text-indigo-600" size={28} />
                                            Brand Analytics
                                        </h4>
                                        <p className="text-slate-400 font-bold mt-1 text-sm">Volume distribution per brand entity.</p>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <Bar data={{
                                        labels: salesByBrand.map(b => b.brand),
                                        datasets: [{
                                            label: 'Sales Revenue',
                                            data: salesByBrand.map(b => b.amount),
                                            backgroundColor: '#6366f1',
                                            borderRadius: 16,
                                            borderSkipped: false,
                                            hoverBackgroundColor: '#4f46e5',
                                            barThickness: 32
                                        }]
                                    }} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { cornerRadius: 12, padding: 12, titleFont: { size: 14, weight: 'bold' } } },
                                        scales: {
                                            y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { font: { weight: 'bold' }, color: '#94a3b8' } },
                                            x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: 'bold' }, color: '#64748b' } }
                                        }
                                    }} />
                                </div>
                            </div>

                            <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 premium-shadow h-[600px] flex flex-col">
                                <div className="mb-10 text-center">
                                    <h4 className="text-2xl font-black text-slate-800">Operational Share</h4>
                                    <p className="text-slate-400 font-bold mt-1 text-sm">Service distribution by Captain.</p>
                                </div>
                                <div className="flex-1 flex items-center justify-center p-6">
                                    <Pie data={{
                                        labels: salesByCaptain.map(c => c.captain),
                                        datasets: [{
                                            data: salesByCaptain.map(c => c.amount),
                                            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'],
                                            borderWidth: 0,
                                            hoverOffset: 20
                                        }]
                                    }} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: 'black', size: 11 }, padding: 25 } }
                                        },
                                        cutout: '40%'
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PURCHASE' && (
                        <div className="bg-white rounded-[3rem] border border-slate-100 premium-shadow overflow-hidden">
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                                <div>
                                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">Purchase Intelligence</h4>
                                    <p className="text-slate-500 font-medium">Detailed breakdown of vendor liabilities and cash flow.</p>
                                </div>
                                <button onClick={() => exportToCSV(purchaseSummary, 'Purchases')} className="flex items-center gap-3 bg-indigo-600 px-8 py-4 rounded-[2rem] text-white font-black hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"><Download size={22} /> Export CSV</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-100/50 text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">
                                            <th className="px-10 py-6">Vendor Entity / Stakeholder</th>
                                            <th className="px-10 py-6">Total Commitment</th>
                                            <th className="px-10 py-6">Capital Disbursed</th>
                                            <th className="px-10 py-6 text-right">Deferred Payable</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {purchaseSummary.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                                <td className="px-10 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors uppercase">{p.name || 'INTERNAL ENTITY'}</span>
                                                        <span className="text-[10px] font-black text-slate-300">MASTER LEDGER REF: {i + 102}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-black text-slate-900 text-xl tracking-tighter">₹{p.amount?.toLocaleString()}</td>
                                                <td className="px-10 py-6 font-black text-emerald-600 text-lg opacity-80">₹{p.paid?.toLocaleString()}</td>
                                                <td className="px-10 py-6 font-black text-rose-600 text-2xl text-right">₹{p.due?.toLocaleString()}</td>
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
