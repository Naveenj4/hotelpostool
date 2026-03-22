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
    Target
} from 'lucide-react';
import './Dashboard.css';

const TransactionWiseSales = () => {
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
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
        payMode: '',
        partyId: '',
        area: ''
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
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch transaction summary", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.payMode, filters.area, fetchReport]);

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
        const headers = ["Date", "Transaction No", "Party Name", "Area", "Cash", "Card", "UPI", "Credit Amt", "Total"];
        const rows = data.map(d => [
            new Date(d.date).toLocaleDateString(),
            d.transaction_no,
            d.party_name,
            d.area,
            d.cash,
            d.card,
            d.upi,
            d.credit_amt,
            d.total
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Transaction_Audit_${filters.startDate}.csv`);
        link.click();
    };

    const uniqueAreas = [...new Set(data.map(d => d.area))].filter(Boolean);

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
                                <Receipt size={24} strokeWidth={2.5} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Financial Settlement Audit</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3 uppercase">Transaction Intelligence</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Advanced multi-node reconciliation across all payment protocols.</p>
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
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Run Audit
                            </button>
                        </div>
                    </div>

                    {/* Industrial Summary Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-20">
                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target size={12} className="text-indigo-500" /> Total Bill Registry
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.totalBills}</h4>
                            <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Wallet size={12} className="text-emerald-500" /> Cash Liquidity
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.cash)}</h4>
                            <div className="h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard size={12} className="text-blue-500" /> Card Settlement
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.card)}</h4>
                            <div className="h-1 w-12 bg-blue-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Smartphone size={12} className="text-amber-500" /> Digital / UPI Yield
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

                    {/* Industrial Search & Filter Action Tool Hub */}
                    <div className="flex flex-wrap items-center justify-between gap-10 mb-10 pb-10 border-b border-slate-50">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative group max-w-xl">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Scan Manifest (Bill No, Customer Name, Identity)..." 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-8 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all outline-none uppercase placeholder:normal-case" 
                                    value={filters.search}
                                    onChange={(e) => setFilters(p => ({...p, search: e.target.value}))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center px-4 py-3 gap-2 border-r border-slate-200">
                                    <Filter size={14} className="text-slate-400" />
                                    <select 
                                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                                        value={filters.payMode}
                                        onChange={(e) => setFilters(p => ({...p, payMode: e.target.value}))}
                                    >
                                        <option value="">All Paymodes</option>
                                        <option value="CASH">Cash Only</option>
                                        <option value="CARD">Card Only</option>
                                        <option value="UPI">UPI Only</option>
                                        <option value="CREDIT">Credit Only</option>
                                    </select>
                                </div>
                                <div className="flex items-center px-4 py-3 gap-2">
                                    <MapPin size={14} className="text-slate-400" />
                                    <select 
                                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                                        value={filters.area}
                                        onChange={(e) => setFilters(p => ({...p, area: e.target.value}))}
                                    >
                                        <option value="">Operational Area</option>
                                        {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all flex items-center gap-3">
                                <Download size={16} /> Export XLS
                            </button>
                        </div>
                    </div>

                    {/* Comprehensive Settlement Registry Grid */}
                    <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mb-20 animate-fadeInShort">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Temporal ID</th>
                                        <th className="p-6">Ref Manifest</th>
                                        <th className="p-6">Client / Entity Identity</th>
                                        <th className="p-6">Sector / Area</th>
                                        <th className="p-6 text-right font-black text-emerald-600 bg-emerald-50/5">Cash Port</th>
                                        <th className="p-6 text-right font-black text-indigo-600 bg-indigo-50/5">Card Port</th>
                                        <th className="p-6 text-right font-black text-amber-600 bg-amber-50/5">Digital Port</th>
                                        <th className="p-6 text-right font-black text-rose-600 bg-rose-50/5 border-r border-slate-50">Credit Exposure</th>
                                        <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Net Recognized</th>
                                        <th className="p-6 text-center bg-slate-50/50">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={10} className="p-32 text-center">
                                            <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Reconciling Transaction Archives...</p>
                                        </td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={10} className="p-32 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No settlement variance detected</td></tr>
                                    ) : data.map((d, i) => (
                                        <tr key={d._id} className="hover:bg-slate-50/30 group transition-all cursor-pointer">
                                            <td className="p-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">{new Date(d.date).toLocaleDateString('en-GB')}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{new Date(d.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">{d.transaction_no}</span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{d.party_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.area || 'Direct'}</span>
                                            </td>
                                            <td className="p-6 text-right font-bold text-emerald-600 bg-emerald-50/5">₹{fmt(d.cash)}</td>
                                            <td className="p-6 text-right font-bold text-indigo-600 bg-indigo-50/5">₹{fmt(d.card)}</td>
                                            <td className="p-6 text-right font-bold text-amber-600 bg-amber-50/5">₹{fmt(d.upi)}</td>
                                            <td className="p-6 text-right font-bold text-rose-500 bg-rose-50/5 border-r border-slate-50">₹{fmt(d.credit_amt)}</td>
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

export default TransactionWiseSales;
