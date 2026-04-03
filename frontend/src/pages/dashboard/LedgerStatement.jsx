import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Search,
    Download,
    Calendar,
    Loader2,
    FileText,
    Printer,
    Database,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    ArrowDownCircle,
    ArrowUpCircle,
    Activity,
    Info,
    Filter,
    X,
    Eye,
    Landmark,
    Building2,
    RefreshCw,
    Layers
} from 'lucide-react';
import './Dashboard.css';

const LedgerStatement = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [statement, setStatement] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchLedgers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ledgers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setLedgers(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchStatementData = useCallback(async () => {
        if (!selectedLedger) return;
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/ledger-statement?ledgerId=${selectedLedger}&startDate=${dateRange.start}&endDate=${dateRange.end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setStatement(result);
        } catch (err) {
            console.error("Statement error", err);
        } finally {
            setLoading(false);
        }
    }, [selectedLedger, dateRange]);

    useEffect(() => {
        fetchLedgers();
        if (location.state?.ledgerId) setSelectedLedger(location.state.ledgerId);
    }, [location.state]);

    useEffect(() => {
        if (selectedLedger) fetchStatementData();
    }, [selectedLedger, dateRange, fetchStatementData]);

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleRowClick = (tx) => {
        setSelectedTransaction(tx);
        setIsDrawerOpen(true);
    };

    const exportToCSV = () => {
        if (!statement || !statement.data) return;
        const headers = ["Date", "Transaction No", "Type", "Inflow", "Outflow", "Balance", "Narration"];
        const rows = [
            [new Date(dateRange.start).toLocaleDateString(), '-', 'OPENING BALANCE', '-', '-', statement.summary.openingBalance, '-'],
            ...statement.data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.type,
                d.credit,
                d.debit,
                d.balance,
                d.narration
            ])
        ];
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Statement_${statement.ledger.name}.csv`);
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
                                <Database size={24} strokeWidth={2.5} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Forensic Accounting Hub</span>
                            </div>
                            <h2 className="premium-page-title mb-3">Ledger Intelligence</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Reconstruct fiscal history for any entity. Precision audit trail across all vouchers.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center px-6 py-3 gap-6 border-r border-slate-200 min-w-[300px]">
                                <Search size={20} className="text-indigo-600" />
                                <select 
                                    className="bg-transparent border-none focus:outline-none text-xs font-black text-slate-700 uppercase w-full cursor-pointer appearance-none"
                                    value={selectedLedger}
                                    onChange={(e) => setSelectedLedger(e.target.value)}
                                >
                                    <option value="">SCAN ENTITY DATABASE...</option>
                                    {(() => {
                                        const grouped = ledgers.reduce((acc, l) => {
                                            const cat = l.group || 'OTHER';
                                            if(!acc[cat]) acc[cat] = [];
                                            acc[cat].push(l);
                                            return acc;
                                        }, {});
                                        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, list]) => (
                                            <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                                                {list.sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                            </optgroup>
                                        ));
                                    })()}
                                </select>
                            </div>
                            <div className="flex items-center px-4 py-2 gap-4">
                                <Calendar size={18} className="text-slate-400" />
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-transparent border-none outline-none w-[115px]"/>
                                    <span className="opacity-30">—</span>
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-transparent border-none outline-none w-[115px]"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {statement ? (<>
                        {/* Industrial Summary Counters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
                            <div className="group">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <TrendingUp size={12} className="text-indigo-500" /> Total Sales / Debits
                                </p>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(statement.summary.totalSales)}</h4>
                                <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            </div>

                            <div className="group">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ArrowDownCircle size={12} className="text-emerald-500" /> Amount Received
                                </p>
                                <h4 className="text-4xl font-black text-emerald-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(statement.summary.totalReceived)}</h4>
                                <div className="h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            </div>

                            <div className="group lg:pl-10 lg:border-l border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity size={12} className="text-slate-900" /> Calculated Receivable
                                </p>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(statement.summary.currentReceivable)}</h4>
                                <div className="h-1 w-12 bg-slate-900 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>

                        {/* Global Actions Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-10 mb-10 pb-10 border-b border-slate-50">
                            <div className="flex items-center gap-4 text-slate-400">
                                <Filter size={18} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Active Audit Hub: {statement.ledger.name}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all flex items-center gap-3">
                                    <Download size={16} /> Export XLS
                                </button>
                                <button onClick={() => window.print()} className="h-12 px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200">
                                    <Printer size={16} /> Print Manifest
                                </button>
                            </div>
                        </div>

                        {/* High-Precision Statement Table */}
                        <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mb-20">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="p-6">Date</th>
                                            <th className="p-6 text-center">Ref Manifest</th>
                                            <th className="p-6">Type</th>
                                            <th className="p-6 text-right bg-emerald-50/10 text-emerald-600">Inflow (Cr)</th>
                                            <th className="p-6 text-right bg-rose-50/10 text-rose-600 border-r border-slate-50">Outflow (Dr)</th>
                                            <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Balance Snapshot</th>
                                            <th className="p-6 text-center">Audit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {/* Opening Row */}
                                        <tr className="bg-slate-50/20 group">
                                            <td className="p-6 text-[10px] font-bold text-slate-400 tracking-wider">
                                                {new Date(dateRange.start).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="p-6 text-center opacity-20 text-[10px] font-black">---</td>
                                            <td className="p-6">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Opening Registry Position</span>
                                            </td>
                                            <td className="p-6 text-right opacity-10 font-bold">—</td>
                                            <td className="p-6 text-right opacity-10 font-bold border-r border-slate-50">—</td>
                                            <td className="p-6 text-right font-black text-slate-900 text-lg bg-slate-50/40">₹{fmt(statement.summary.openingBalance)}</td>
                                            <td className="p-6 text-center text-slate-200"><Info size={16} className="mx-auto" /></td>
                                        </tr>

                                        {statement.data.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50/30 group transition-all cursor-pointer" onClick={() => handleRowClick(d)}>
                                                <td className="p-6">
                                                    <span className="text-xs font-bold text-slate-700">{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{d.voucher_no}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.type}</span>
                                                </td>
                                                <td className="p-6 text-right font-bold text-emerald-600 bg-emerald-50/5">
                                                    {d.credit > 0 ? `₹${fmt(d.credit)}` : <span className="opacity-10">—</span>}
                                                </td>
                                                <td className="p-6 text-right font-bold text-rose-600 bg-rose-50/5 border-r border-slate-50">
                                                    {d.debit > 0 ? `₹${fmt(d.debit)}` : <span className="opacity-10">—</span>}
                                                </td>
                                                <td className="p-6 text-right font-black text-slate-900 bg-slate-50/20 text-base">
                                                    ₹{fmt(d.balance)}
                                                </td>
                                                <td className="p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto shadow-lg">
                                                        <Eye size={12} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Cumulative Yield Row */}
                                        <tr className="bg-slate-900 text-white border-t-2 border-slate-800">
                                            <td className="p-8" colSpan={3}>
                                                <div className="flex items-center gap-4">
                                                    <Layers size={20} className="text-slate-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Ledger Cumulative Snapshot</span>
                                                </div>
                                            </td>
                                            <td className="p-8 text-right font-bold text-emerald-400">₹{fmt(statement.data.reduce((a,b)=>a+b.credit, 0))}</td>
                                            <td className="p-8 text-right font-bold text-rose-400 border-r border-white/10">₹{fmt(statement.data.reduce((a,b)=>a+b.debit, 0))}</td>
                                            <td className="p-8 text-right font-black text-white text-2xl">₹{fmt(statement.summary.currentReceivable)}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>) : (
                        <div className="flex flex-col items-center justify-center p-40 bg-slate-50 rounded-[4rem] border border-slate-100 border-dashed group mt-20">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-all shadow-sm">
                                <Database size={44} className="text-slate-200 group-hover:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 tracking-widest mb-2 uppercase">Awaiting Registry Selection</h3>
                            <p className="text-slate-400 font-medium max-w-sm text-center">Reconstruct the fiscal history of any counterparty or internal ledger to verify balances.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[200] flex flex-col items-center justify-center transition-all duration-500 fade-in">
                            <Loader2 size={64} className="text-slate-900 animate-spin mb-4" />
                            <p className="text-slate-900 font-black tracking-[0.4em] uppercase text-xs">Accessing Archives...</p>
                        </div>
                    )}
                </div>

                {/* Audit Drawer - Entry Intelligence Overlay */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedTransaction && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Fiscal Entry Point</p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">#{selectedTransaction.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Origin</span>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedTransaction.type}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Point</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedTransaction.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Hub</span>
                                            <span className="text-sm font-black text-slate-900 uppercase">{statement.ledger.name}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-3xl space-y-8">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Valuation</p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inflow (Credit)</span>
                                                <span className="text-2xl font-black text-emerald-600">₹{selectedTransaction.credit > 0 ? fmt(selectedTransaction.credit) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outflow (Debit)</span>
                                                <span className="text-2xl font-black text-rose-600">₹{selectedTransaction.debit > 0 ? fmt(selectedTransaction.debit) : '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Narrative / Memo</p>
                                        <div className="p-8 bg-slate-100/50 rounded-3xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-300 leading-relaxed shadow-inner">
                                            "{selectedTransaction.narration || 'No memorandums documented for this registry entry.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-50 bg-[#F8FAFC] grid grid-cols-2 gap-4">
                                    <button className="h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <FileText size={16} /> Save Memo
                                    </button>
                                    <button className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                                        <Printer size={16} /> Print Entry
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
            `}</style>
        </div>
    );
};

export default LedgerStatement;
