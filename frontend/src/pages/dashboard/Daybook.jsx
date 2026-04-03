import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Download,
    Loader2,
    Calendar,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Wallet,
    Search,
    Info,
    RefreshCw,
    User,
    FileText,
    PieChart,
    ArrowRight,
    Eye,
    X,
    Filter,
    Layers,
    Activity,
    Printer,
    Building2,
    CreditCard,
    ArrowDownLeft,
    ArrowUpRight
} from 'lucide-react';
import './Dashboard.css';

const Daybook = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        totalTransactions: 0,
        paymentIn: 0,
        paymentOut: 0,
        totalCash: 0,
        totalCredit: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: ''
    });

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchDaybook = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/daybook?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch daybook", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchDaybook();
    }, [fetchDaybook]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleRowClick = (entry) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const exportToCSV = () => {
        if (data.length === 0) return;
        const headers = ["Date", "Trans No", "Type", "Party", "Inflow", "Outflow", "Credit", "Narration"];
        const rows = data.map(d => [
            new Date(d.date).toLocaleDateString(),
            d.voucher_no,
            d.type,
            d.party,
            d.payment_in,
            d.payment_out,
            d.credit_amt,
            d.narration
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Daybook_${filters.startDate}.csv`);
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
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-16 gap-8 border-b border-slate-100 pb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-[#101828]">
                                <FileText size={24} strokeWidth={2.5} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Journal Registry</span>
                            </div>
                            <h2 className="premium-page-title mb-3">Daily Ledger Audit</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Comprehensive chronological log of organizational financial movements. Every entry verified.</p>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                            <div className="flex items-center px-4 py-2 gap-4 border-r border-slate-200">
                                <Calendar size={18} className="text-slate-400" />
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                    <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className="bg-transparent border-none outline-none w-[115px]"/>
                                    <span className="opacity-30">—</span>
                                    <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className="bg-transparent border-none outline-none w-[115px]"/>
                                </div>
                            </div>
                            <button className="h-10 px-6 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center gap-2" onClick={fetchDaybook}>
                                <RefreshCw size={14} /> Update Registry
                            </button>
                        </div>
                    </div>

                    {/* Industrial Summary Bento Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-20">
                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={12} className="text-indigo-500" /> Total Events
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.totalTransactions}</h4>
                            <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ArrowDownLeft size={12} className="text-emerald-500" /> Payment In
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.paymentIn)}</h4>
                            <div className="h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ArrowUpRight size={12} className="text-rose-500" /> Payment Out
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.paymentOut)}</h4>
                            <div className="h-1 w-12 bg-rose-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Wallet size={12} className="text-indigo-500" /> Cash Snap
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.totalCash)}</h4>
                            <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group lg:pl-10 lg:border-l border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Building2 size={12} className="text-amber-500" /> Credit Yield
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.totalCredit)}</h4>
                            <div className="h-1 w-12 bg-amber-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>

                    {/* Filter & Action Tool Hub */}
                    <div className="flex flex-wrap items-center justify-between gap-10 mb-10 pb-10 border-b border-slate-50">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative group max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search Voucher (e.g. #25) or Entity Name..." 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all outline-none" 
                                    value={filters.search}
                                    onChange={e => setFilters(p => ({...p, search: e.target.value}))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all flex items-center gap-3 active:scale-95">
                                <Download size={16} /> Export Audit
                            </button>
                            <button onClick={() => window.print()} className="h-12 px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200 active:scale-95">
                                <Printer size={16} /> Print Registry
                            </button>
                        </div>
                    </div>

                    {/* Daybook Audit Table */}
                    <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mb-20">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Date</th>
                                        <th className="p-6 text-center">Ref Manifest</th>
                                        <th className="p-6">Voucher Type</th>
                                        <th className="p-6">Entity / Ledger Hub</th>
                                        <th className="p-6 text-right bg-emerald-50/10 text-emerald-600">Payment In</th>
                                        <th className="p-6 text-right bg-rose-50/10 text-rose-600 border-r border-slate-50">Payment Out</th>
                                        <th className="p-6 text-right font-black text-amber-600 bg-amber-50/10 border-l border-amber-100/30">Credit Volume</th>
                                        <th className="p-6 text-center">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={8} className="p-32 text-center text-slate-300 flex-col items-center gap-4">
                                            <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Reconstructing Daily Movements...</p>
                                        </td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={8} className="p-32 text-center">
                                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Registry is empty for this temporal window</p>
                                        </td></tr>
                                    ) : data.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50/30 group transition-all cursor-pointer" onClick={() => handleRowClick(d)}>
                                            <td className="p-6">
                                                <span className="text-xs font-bold text-slate-700">{new Date(d.date).toLocaleDateString('en-GB')}</span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full tracking-tighter uppercase">{d.voucher_no}</span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    d.type === 'SALES' ? 'text-indigo-600' :
                                                    d.type === 'PURCHASE' ? 'text-amber-600' :
                                                    d.type === 'RECEIPT' ? 'text-emerald-600' :
                                                    d.type === 'PAYMENT' ? 'text-rose-600' : 'text-slate-400'
                                                }`}>
                                                    {d.type}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 block tracking-tight uppercase line-clamp-1">{d.party}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right font-bold text-emerald-600 bg-emerald-50/5">
                                                {d.payment_in > 0 ? `₹${fmt(d.payment_in)}` : <span className="opacity-10">—</span>}
                                            </td>
                                            <td className="p-6 text-right font-bold text-rose-600 bg-rose-50/5 border-r border-slate-50">
                                                {d.payment_out > 0 ? `₹${fmt(d.payment_out)}` : <span className="opacity-10">—</span>}
                                            </td>
                                            <td className="p-6 text-right font-black text-amber-600 bg-amber-50/5">
                                                {d.credit_amt > 0 ? `₹${fmt(d.credit_amt)}` : <span className="opacity-10">—</span>}
                                            </td>
                                            <td className="p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
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

                {/* Audit Drawer - Journal Detail Overlay */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedEntry && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Journal Detail</p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">VCH-{selectedEntry.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Hub</span>
                                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedEntry.type}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Point</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedEntry.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Counterparty</span>
                                            <span className="text-sm font-black text-slate-900 uppercase">{selectedEntry.party}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-3xl space-y-8">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Valuation</p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment In</span>
                                                <span className="text-2xl font-black text-emerald-600">₹{selectedEntry.payment_in > 0 ? fmt(selectedEntry.payment_in) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Out</span>
                                                <span className="text-2xl font-black text-rose-600">₹{selectedEntry.payment_out > 0 ? fmt(selectedEntry.payment_out) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credit Volume</span>
                                                <span className="text-2xl font-black text-amber-600">₹{selectedEntry.credit_amt > 0 ? fmt(selectedEntry.credit_amt) : '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Info size={14} className="text-slate-300" /> Memoranda / Narrative
                                        </p>
                                        <div className="p-8 bg-slate-50 rounded-3xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-200 leading-relaxed shadow-inner">
                                            "{selectedEntry.narration || 'No narrative description documented for this record.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-50 bg-slate-50 grid grid-cols-2 gap-4">
                                    <button className="h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <Download size={16} /> Save Record
                                    </button>
                                    <button className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                                        <Printer size={16} /> Print Voucher
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .scrollbar-premium::-webkit-scrollbar {
                    height: 8px;
                }
                .scrollbar-premium::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-premium::-webkit-scrollbar-thumb {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default Daybook;
