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
    Landmark,
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
    ArrowUpRight,
    ArrowDownLeft,
    ChevronDown,
    MapPin,
    Building2,
    CreditCard
} from 'lucide-react';
import './Dashboard.css';

const CashAndBank = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        openingCash: 0,
        openingBank: 0,
        totalOpening: 0,
        closingBalance: 0,
        snapshots: []
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchAudit = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/cash-bank?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch cash-bank audit", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

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
        const headers = ["Date", "Transaction No", "Name", "Received", "Paid", "Cash Movement", "Bank Movement", "Balance", "Narration"];
        const rows = [
            [new Date(filters.startDate).toLocaleDateString(), '-', 'OPENING BALANCE', '-', '-', summary.openingCash, summary.openingBank, summary.totalOpening, '-'],
            ...data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.party || d.type,
                d.received,
                d.paid,
                d.cash_impact,
                d.bank_impact,
                d.balance,
                d.narration
            ])
        ];
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `CashBank_${filters.startDate}.csv`);
        link.click();
    };

    const handleRowClick = (tx) => {
        setSelectedTransaction(tx);
        setIsDrawerOpen(true);
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
                    
                    {/* Minimalist Top Navigation & Filter */}
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-16 gap-8 border-b border-slate-100 pb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-[#101828]">
                                <Building2 size={24} strokeWidth={2.5} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Financial Controller</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3">Cash & Liquid Assets</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Audit trail of monetary movement across banking hubs and physical cash reserves.</p>
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
                            <button className="h-10 px-6 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center gap-2" onClick={fetchAudit}>
                                <RefreshCw size={14} /> Update
                            </button>
                        </div>
                    </div>

                    {/* Industrial Summary Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Wallet size={12} className="text-emerald-500" /> Cash in Hand
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.snapshots.find(s => s.name.toLowerCase().includes('cash'))?.balance || summary.openingCash)}</h4>
                            <div className="h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {summary.snapshots.filter(s => s.name.toLowerCase().includes('bank')).map((bank, i) => (
                            <div key={i} className="group">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Landmark size={12} className="text-indigo-500" /> {bank.name}
                                </p>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(bank.balance)}</h4>
                                <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}

                        <div className="group lg:pl-10 lg:border-l border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={12} className="text-slate-900" /> Total Balance
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.closingBalance)}</h4>
                            <div className="h-1 w-12 bg-slate-900 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>

                    {/* Global Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-10 mb-10 pb-10 border-b border-slate-50">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative group max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search transaction logs..." 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all outline-none" 
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all flex items-center gap-3">
                                <Download size={16} /> Export XLS
                            </button>
                            <button onClick={() => window.print()} className="h-12 px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200">
                                <Printer size={16} /> Print Report
                            </button>
                        </div>
                    </div>

                    {/* Advanced Audit Grid */}
                    <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mb-20">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 whitespace-nowrap">Date</th>
                                        <th className="p-6 text-center">Ref</th>
                                        <th className="p-6">Entity / Description</th>
                                        <th className="p-6 text-right bg-emerald-50/10 text-emerald-600">Inflow</th>
                                        <th className="p-6 text-right bg-rose-50/10 text-rose-600 border-r border-slate-50">Outflow</th>
                                        <th className="p-6 text-right">Cash Link</th>
                                        <th className="p-6 text-right">Bank Link</th>
                                        <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Current Position</th>
                                        <th className="p-6 text-center">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {/* Opening Row */}
                                    <tr className="bg-slate-50/20 group">
                                        <td className="p-6 text-[11px] font-bold text-slate-400 tracking-wider">
                                            {new Date(filters.startDate).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="p-6 text-center opacity-20 text-[10px] font-black">---</td>
                                        <td className="p-6">
                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Opening Audit Position</span>
                                        </td>
                                        <td className="p-6 text-right opacity-10 font-bold">—</td>
                                        <td className="p-6 text-right opacity-10 font-bold border-r border-slate-50">—</td>
                                        <td className="p-6 text-right font-bold text-slate-400 text-xs">₹{fmt(summary.openingCash)}</td>
                                        <td className="p-6 text-right font-bold text-slate-400 text-xs">₹{fmt(summary.openingBank)}</td>
                                        <td className="p-6 text-right font-black text-slate-900 text-lg bg-slate-50/40">₹{fmt(summary.totalOpening)}</td>
                                        <td className="p-6 text-center text-slate-300"><Info size={16} className="mx-auto" /></td>
                                    </tr>

                                    {loading ? (
                                        <tr><td colSpan={9} className="p-32 text-center text-slate-300 flex-col items-center gap-4">
                                            <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Querying Audit Archive...</p>
                                        </td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={9} className="p-32 text-center">
                                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No liquidity movement found</p>
                                        </td></tr>
                                    ) : data.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50/30 group transition-all cursor-pointer" onClick={() => handleRowClick(d)}>
                                            <td className="p-6">
                                                <span className="text-xs font-bold text-slate-700">{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">#{d.voucher_no}</span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-900 block tracking-tight uppercase">{d.party || d.type}</span>
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block mt-0.5">{d.type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right font-bold text-emerald-600 bg-emerald-50/5">
                                                {d.received > 0 ? `₹${fmt(d.received)}` : <span className="opacity-10">—</span>}
                                            </td>
                                            <td className="p-6 text-right font-bold text-rose-600 bg-rose-50/5 border-r border-slate-50">
                                                {d.paid > 0 ? `₹${fmt(d.paid)}` : <span className="opacity-10">—</span>}
                                            </td>
                                            <td className="p-6 text-right font-bold text-slate-500 text-xs">
                                                {d.cash_impact !== 0 ? (d.cash_impact > 0 ? `+${fmt(d.cash_impact)}` : fmt(d.cash_impact)) : '—'}
                                            </td>
                                            <td className="p-6 text-right font-bold text-slate-500 text-xs">
                                                {d.bank_impact !== 0 ? (d.bank_impact > 0 ? `+${fmt(d.bank_impact)}` : fmt(d.bank_impact)) : '—'}
                                            </td>
                                            <td className="p-6 text-right font-black text-slate-900 bg-slate-50/20 text-base">
                                                ₹{fmt(d.balance)}
                                            </td>
                                            <td className="p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                                    <Eye size={14} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Final Net Row */}
                                    <tr className="bg-[#101828] text-white">
                                        <td className="p-8" colSpan={3}>
                                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Closing Liquidity Snapshot</span>
                                        </td>
                                        <td className="p-8 text-right font-bold text-emerald-400">₹{fmt(data.reduce((a,b)=>a+b.received, 0))}</td>
                                        <td className="p-8 text-right font-bold text-rose-400 border-r border-white/10">₹{fmt(data.reduce((a,b)=>a+b.paid, 0))}</td>
                                        <td colSpan={2}></td>
                                        <td className="p-8 text-right font-black text-white text-2xl">₹{fmt(summary.closingBalance)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Audit Drawer - Clean Minimalist Style */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedTransaction && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Audit Detail</p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">#{selectedTransaction.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</span>
                                            <span className="text-lg font-black text-slate-900 uppercase">{selectedTransaction.party || 'System'}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedTransaction.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Class</span>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedTransaction.type}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-3xl space-y-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Breakdown</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Wallet size={14} className="text-emerald-500" />
                                                    <span className="text-xs font-bold text-slate-600">Cash Flow</span>
                                                </div>
                                                <span className={`text-sm font-black ${selectedTransaction.cash_impact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {selectedTransaction.cash_impact !== 0 ? `₹${fmt(selectedTransaction.cash_impact)}` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Landmark size={14} className="text-indigo-500" />
                                                    <span className="text-xs font-bold text-slate-600">Bank Flow</span>
                                                </div>
                                                <span className={`text-sm font-black ${selectedTransaction.bank_impact >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                    {selectedTransaction.bank_impact !== 0 ? `₹${fmt(selectedTransaction.bank_impact)}` : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Narration / Memo</p>
                                        <div className="p-8 bg-slate-50 rounded-3xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-200">
                                            "{selectedTransaction.narration || 'No memorandums recorded for this entry.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-50 grid grid-cols-2 gap-4">
                                    <button className="h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2">
                                        <Download size={16} /> Receipt
                                    </button>
                                    <button className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                        <Printer size={16} /> Print Audit
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
                .scrollbar-premium::-webkit-scrollbar-thumb:hover {
                    background: #e2e8f0;
                }
            `}</style>
        </div>
    );
};

export default CashAndBank;
