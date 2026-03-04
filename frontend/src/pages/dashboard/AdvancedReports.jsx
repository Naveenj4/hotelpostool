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
    Filter
} from 'lucide-react';

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
            if (data[3].success) setProfitLoss(data[3].data);
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

    if (loading) return <div className="loader-container-full"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content p-4 lg:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800">Advanced Admin Reports</h2>
                            <p className="text-slate-500 font-medium">Comprehensive financial and operational analytics.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-slate-400" />
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="text-sm font-bold text-slate-600 outline-none" />
                                <span className="text-slate-300">to</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="text-sm font-bold text-slate-600 outline-none" />
                            </div>
                            <button onClick={fetchAllReports} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8 w-fit">
                        {['SUMMARY', 'SALES', 'PURCHASE', 'ACCOUNTS'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'SUMMARY' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className={`p-6 rounded-2xl border flex items-center gap-4 transition-all hover:shadow-lg ${profitLoss.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${profitLoss.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        <TrendingUp size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Net Profit / (Loss)</p>
                                        <h3 className={`text-2xl font-black ${profitLoss.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{profitLoss.netProfit.toLocaleString()}</h3>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50 flex items-center gap-4 transition-all hover:shadow-lg">
                                    <div className="w-14 h-14 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                                        <DollarSign size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                                        <h3 className="text-2xl font-black text-indigo-700">₹{profitLoss.revenue.toLocaleString()}</h3>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl border border-amber-100 bg-amber-50 flex items-center gap-4 transition-all hover:shadow-lg">
                                    <div className="w-14 h-14 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                                        <Package size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Stock Valuation</p>
                                        <h3 className="text-2xl font-black text-amber-700">₹{stockValuation.totalValue.toLocaleString()}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <h4 className="font-black text-slate-700 flex items-center gap-2"><Truck size={20} className="text-indigo-500" /> Supplier Payables</h4>
                                        <button onClick={() => exportToCSV(supplierOutstanding, 'Suppliers')} className="text-slate-400 hover:text-indigo-600 transition-colors"><Download size={18} /></button>
                                    </div>
                                    <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                                        {supplierOutstanding.map((s, i) => (
                                            <div key={i} className="px-5 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                                <span className="font-bold text-slate-700">{s.name}</span>
                                                <span className="text-rose-600 font-black">₹{s.balance.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <h4 className="font-black text-slate-700 flex items-center gap-2"><Users size={20} className="text-emerald-500" /> Customer Receivables</h4>
                                        <button onClick={() => exportToCSV(customerOutstanding, 'Customers')} className="text-slate-400 hover:text-indigo-600 transition-colors"><Download size={18} /></button>
                                    </div>
                                    <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                                        {customerOutstanding.map((c, i) => (
                                            <div key={i} className="px-5 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                                <span className="font-bold text-slate-700">{c.name}</span>
                                                <span className="text-emerald-600 font-black">₹{c.balance.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SALES' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2"><Filter size={20} className="text-indigo-500" /> Brand Performance</h4>
                                <div className="h-80">
                                    <Bar data={{
                                        labels: salesByBrand.map(b => b.brand),
                                        datasets: [{
                                            label: 'Sales Amount',
                                            data: salesByBrand.map(b => b.amount),
                                            backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                            borderRadius: 8
                                        }]
                                    }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2"><Users size={20} className="text-emerald-500" /> Captain Sales Distribution</h4>
                                <div className="h-80">
                                    <Pie data={{
                                        labels: salesByCaptain.map(c => c.captain),
                                        datasets: [{
                                            data: salesByCaptain.map(c => c.amount),
                                            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                                        }]
                                    }} options={{ responsive: true, maintainAspectRatio: false }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PURCHASE' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h4 className="text-xl font-black text-slate-700">Detailed Purchase Summary</h4>
                                <button onClick={() => exportToCSV(purchaseSummary, 'Purchases')} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-indigo-600 font-bold hover:bg-slate-50 transition-colors shadow-sm"><Download size={18} /> Export Report</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-500 uppercase text-xs font-black tracking-widest"><th className="px-6 py-4">Stakeholder / Ref</th><th className="px-6 py-4">Total Value</th><th className="px-6 py-4">Paid</th><th className="px-6 py-4">Due</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {purchaseSummary.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-700">{p.name || 'N/A'}</td>
                                                <td className="px-6 py-4 font-black text-indigo-700">₹{p.amount?.toLocaleString()}</td>
                                                <td className="px-6 py-4 font-black text-emerald-600">₹{p.paid?.toLocaleString()}</td>
                                                <td className="px-6 py-4 font-black text-rose-600">₹{p.due?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACCOUNTS' && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-xl font-black text-slate-700 flex items-center gap-2"><BookOpen size={22} className="text-indigo-600" /> Daybook Summary</h4>
                                    <button onClick={() => exportToCSV(daybook, 'Daybook')} className="text-slate-400 hover:text-indigo-600 transition-colors"><Download size={22} /></button>
                                </div>
                                <div className="space-y-4">
                                    {daybook.map((tr, i) => (
                                        <div key={i} className="group p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${tr.side === 'IN' ? 'bg-emerald-100 text-emerald-600' : (tr.side === 'OUT' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600')}`}>
                                                    {tr.type.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-700 leading-tight">{tr.desc}</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wide">{new Date(tr.time).toLocaleTimeString()} • {tr.type} • Ref: {tr.ref}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-black ${tr.side === 'IN' ? 'text-emerald-600' : (tr.side === 'OUT' ? 'text-rose-600' : 'text-slate-500')}`}>
                                                    {tr.side === 'IN' ? '+' : (tr.side === 'OUT' ? '-' : '')} ₹{tr.amount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {daybook.length === 0 && <p className="text-center py-10 font-bold text-slate-400">No transactions recorded for this day.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <style jsx>{`
                .loader-container-full { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; }
            `}</style>
        </div>
    );
};

export default AdvancedReports;
