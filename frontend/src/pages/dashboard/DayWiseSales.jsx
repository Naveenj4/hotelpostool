import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Search,
    CreditCard,
    Wallet,
    Smartphone,
    User,
    MapPin,
    Calendar,
    ChevronRight,
    Download,
    FileText,
    TrendingUp,
    Filter,
    Loader2,
    RefreshCw,
    XCircle,
    Info,
    ArrowUpRight,
    SearchCode,
    Receipt,
    Database,
    ChevronDown,
    Activity,
    Landmark,
    X,
    Eye,
    Printer,
    Target,
    LayoutDashboard
} from 'lucide-react';
import './Dashboard.css';

const DayWiseSales = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        totalBills: 0,
        cash: 0,
        card: 0,
        upi: 0,
        credit: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/sales/transaction-summary?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                // Group by Day
                const grouped = {};
                result.data.forEach(t => {
                    const date = new Date(t.date).toLocaleDateString('en-GB');
                    if (!grouped[date]) {
                        grouped[date] = {
                            date,
                            billCount: 0,
                            cash: 0,
                            card: 0,
                            upi: 0,
                            credit: 0,
                            total: 0
                        };
                    }
                    grouped[date].billCount++;
                    grouped[date].cash += t.cash;
                    grouped[date].card += t.card;
                    grouped[date].upi += t.upi;
                    grouped[date].credit += t.credit_amt;
                    grouped[date].total += t.total;
                });

                setData(Object.values(grouped).sort((a,b) => {
                    const da = a.date.split('/').reverse().join('-');
                    const db = b.date.split('/').reverse().join('-');
                    return new Date(db) - new Date(da);
                }));
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch day-wise summary", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, fetchReport]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const exportToCSV = () => {
        if (data.length === 0) return;
        const headers = ["Date", "Bill Count", "Cash", "Card", "UPI", "Credit", "Total"];
        const rows = data.map(d => [d.date, d.billCount, d.cash, d.card, d.upi, d.credit, d.total]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Daywise_Sales_${filters.startDate}.csv`);
        link.click();
    };

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main overflow-hidden font-sans">
                <Header toggleSidebar={toggleSidebar} />

                <div className="dashboard-content fade-in p-6 lg:p-14 max-w-[2000px] mx-auto w-full">
                    
                    {/* Industrial Header */}
                    <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center mb-16 gap-8 border-b border-slate-100 pb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-[#101828]">
                                <LayoutDashboard size={24} strokeWidth={2.5} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Temporal Sales Matrix</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3 uppercase">Day-Wise Summary</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Aggregated daily collection audit across multi-payment streams.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center px-6 py-3 gap-6 border-r border-slate-200">
                                <Calendar size={20} className="text-indigo-600" />
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                    <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className="bg-transparent border-none outline-none w-[115px] p-0"/>
                                    <span className="opacity-30">—</span>
                                    <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className="bg-transparent border-none outline-none w-[115px] p-0"/>
                                </div>
                            </div>
                            <button className="h-12 px-8 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200" onClick={fetchReport}>
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Period
                            </button>
                        </div>
                    </div>

                    {/* Industrial Summary Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-20">
                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target size={12} className="text-indigo-500" /> Period Bill Reg
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.totalBills}</h4>
                            <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Wallet size={12} className="text-emerald-500" /> Total Cash
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.cash)}</h4>
                            <div className="h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard size={12} className="text-blue-500" /> Total Card
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.card)}</h4>
                            <div className="h-1 w-12 bg-blue-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Smartphone size={12} className="text-amber-500" /> Digital / UPI
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.upi)}</h4>
                            <div className="h-1 w-12 bg-amber-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group lg:pl-10 lg:border-l border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={12} className="text-rose-500" /> Credit Exposure
                            </p>
                            <h4 className="text-4xl font-black text-rose-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.credit)}</h4>
                            <div className="h-1 w-12 bg-rose-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>

                    {/* Action Tool Hub */}
                    <div className="flex flex-wrap items-center justify-end gap-4 mb-10">
                        <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all flex items-center gap-3">
                            <Download size={16} /> Export Audit
                        </button>
                        <button onClick={() => window.print()} className="h-12 px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200">
                            <Printer size={16} /> Print Manifest
                        </button>
                    </div>

                    {/* Daily Summary Grid */}
                    <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mb-20 animate-fadeInShort">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Timeline Date</th>
                                        <th className="p-6 text-center">Receipt Vol</th>
                                        <th className="p-6 text-right font-black text-emerald-600 bg-emerald-50/5">Cash Realization</th>
                                        <th className="p-6 text-right font-black text-indigo-600 bg-indigo-50/5">Card Settlement</th>
                                        <th className="p-6 text-right font-black text-amber-600 bg-amber-50/5">Digital / UPI</th>
                                        <th className="p-6 text-right font-black text-rose-600 bg-rose-50/5 border-r border-slate-50">Credit Exposure</th>
                                        <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Fiscal Net</th>
                                        <th className="p-6 text-center bg-slate-50/50">Registry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={10} className="p-32 text-center">
                                            <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Auditing Temporal Registry...</p>
                                        </td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={10} className="p-32 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No sales variance logged in period</td></tr>
                                    ) : data.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50/30 group transition-all">
                                            <td className="p-6">
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{d.date}</span>
                                            </td>
                                            <td className="p-6 text-center font-bold text-slate-400">{d.billCount}</td>
                                            <td className="p-6 text-right font-bold text-emerald-600 bg-emerald-50/5">₹{fmt(d.cash)}</td>
                                            <td className="p-6 text-right font-bold text-indigo-600 bg-indigo-50/5">₹{fmt(d.card)}</td>
                                            <td className="p-6 text-right font-bold text-amber-600 bg-amber-50/5">₹{fmt(d.upi)}</td>
                                            <td className="p-6 text-right font-bold text-rose-500 bg-rose-50/5 border-r border-slate-50">₹{fmt(d.credit)}</td>
                                            <td className="p-6 text-right font-black text-slate-900 bg-slate-50/20 text-base">₹{fmt(d.total)}</td>
                                            <td className="p-6 text-center bg-slate-50/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto shadow-lg">
                                                    <Eye size={12} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fadeInShort {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DayWiseSales;
