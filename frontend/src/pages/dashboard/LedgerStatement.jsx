import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    Search,
    Download,
    Calendar,
    ArrowLeft,
    Loader2,
    FileText,
    Printer,
    Database,
    TrendingUp,
    TrendingDown,
    ArrowRightCircle,
    ArrowLeftCircle,
    ChevronLeft
} from 'lucide-react';
import './Dashboard.css';

const LedgerStatement = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [statementData, setStatementData] = useState(null);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
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

    const fetchStatement = async () => {
        if (!selectedLedger) return;
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/ledger-statement?ledgerId=${selectedLedger}&startDate=${dateRange.start}&endDate=${dateRange.end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setStatementData(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchLedgers();
    }, []);

    const exportToCSV = () => {
        if (!statementData || !statementData.data.length) return;
        const headers = "Date,Voucher No,Type,Particulars,Debit,Credit,Balance";
        const rows = statementData.data.map(r => `${new Date(r.date).toLocaleDateString()},${r.voucher_no},${r.type},${r.particulars},${r.debit},${r.credit},${r.balance}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Statement_${statementData.ledger}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                                    <Database size={20} />
                                </div>
                                <span className="metric-pill-modern">Account Forensics</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Ledger Statement</h2>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Granular transaction audit trails and fiscal flow analysis.</p>
                        </div>

                        <div className="flex flex-wrap gap-6 items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100/50">
                            <div className="w-80">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Select Account Hub</label>
                                <div className="relative group">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <select
                                        value={selectedLedger}
                                        onChange={e => setSelectedLedger(e.target.value)}
                                        className="input-premium-modern !pl-12 !h-14 w-full text-base font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="">SCAN REGISTRY...</option>
                                        {ledgers.map(l => <option key={l._id} value={l._id}>{l.name} [{l.group?.replace(/_/g, ' ')}]</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Temporal Window</label>
                                <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                    <Calendar size={18} className="text-indigo-300" />
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="bg-transparent text-sm font-black text-slate-700 outline-none" />
                                    <span className="text-slate-300 font-black">/</span>
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="bg-transparent text-sm font-black text-slate-700 outline-none" />
                                </div>
                            </div>

                            <button onClick={fetchStatement} className="btn-glow bg-slate-900 text-white px-10 h-14 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-200">
                                <Search size={20} /> AUDIT RECON
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] premium-shadow border border-slate-50">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={56} />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Querying Database Archives...</p>
                        </div>
                    ) : statementData ? (
                        <div className="bento-card p-0 overflow-hidden shadow-2xl fade-in border-indigo-100">
                            <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-50/20 backdrop-blur-md">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl text-indigo-600 border border-slate-100">
                                        <FileText size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{statementData.ledger}</h3>
                                        <div className="flex items-center gap-3 mt-4">
                                            <span className="metric-pill-modern bg-indigo-50 text-indigo-600 border-none px-4 text-[10px]">Registry Snapshot</span>
                                            <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase">{new Date(dateRange.start).toLocaleDateString()} — {new Date(dateRange.end).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={exportToCSV} className="btn-glow bg-white border border-slate-200 px-8 py-4 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm flex items-center gap-4 font-black text-xs uppercase tracking-widest">
                                        <Download size={20} /> Export Manifest
                                    </button>
                                    <button onClick={() => window.print()} className="btn-glow bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-4 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
                                        <Printer size={20} /> Print Audit
                                    </button>
                                </div>
                            </div>

                            <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 bg-slate-50/30 border-b border-slate-50">
                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 h-36 flex flex-col justify-between group hover:-translate-y-2 transition-transform">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Fiscal Opening</p>
                                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">₹{(statementData.opening_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 h-36 flex flex-col justify-between group hover:-translate-y-2 transition-transform">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Aggregate Credit</p>
                                    <h4 className="text-3xl font-black text-emerald-600 tracking-tighter">₹{statementData.data.reduce((acc, curr) => acc + curr.credit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 h-36 flex flex-col justify-between group hover:-translate-y-2 transition-transform">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-1">Aggregate Debit</p>
                                    <h4 className="text-3xl font-black text-rose-600 tracking-tighter">₹{statementData.data.reduce((acc, curr) => acc + curr.debit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                                <div className={`p-10 rounded-[2.5rem] border-4 h-36 flex flex-col justify-between shadow-2xl transition-all hover:scale-105 ${(statementData.data[statementData.data.length - 1]?.balance || 0) >= 0 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Closing Net Yield</p>
                                    <h4 className="text-3xl font-black tracking-tighter">
                                        ₹{(statementData.data[statementData.data.length - 1]?.balance ?? statementData.opening_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h4>
                                </div>
                            </div>

                            <div className="overflow-x-auto p-4 lg:p-10">
                                <div className="overflow-x-auto">
                                    <table className="modern-table-premium">
                                        <thead>
                                            <tr className="text-slate-300 uppercase text-[10px] font-black tracking-[0.25em]">
                                                <th className="px-12 py-8">Timeline</th>
                                                <th className="px-6 py-8 text-center">Ref Manifest</th>
                                                <th className="px-6 py-8">Narrative Context</th>
                                                <th className="px-6 py-8 text-right">Debit Outflow</th>
                                                <th className="px-6 py-8 text-right">Credit Inflow</th>
                                                <th className="px-12 py-8 text-right">Running Net Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statementData.data.map((row, i) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-12 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300">
                                                                <Calendar size={20} />
                                                            </div>
                                                            <span className="text-lg font-black text-slate-800 tracking-tight">{new Date(row.date).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8 text-center text-[10px] font-black text-indigo-400 bg-indigo-50/30 rounded-xl m-4 block">VCH-{row.voucher_no}</td>
                                                    <td className="px-6 py-8 font-black text-slate-900 uppercase text-xs tracking-tight">{row.particulars}</td>
                                                    <td className="px-6 py-8 text-right font-black text-2xl tracking-tighter text-rose-600">
                                                        {row.debit > 0 ? (
                                                            <div className="flex items-center justify-end gap-3">
                                                                <TrendingDown size={18} className="opacity-30" />
                                                                ₹{row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        ) : <span className="opacity-10">0.00</span>}
                                                    </td>
                                                    <td className="px-6 py-8 text-right font-black text-2xl tracking-tighter text-emerald-600">
                                                        {row.credit > 0 ? (
                                                            <div className="flex items-center justify-end gap-3">
                                                                <TrendingUp size={18} className="opacity-30" />
                                                                ₹{row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        ) : <span className="opacity-10">0.00</span>}
                                                    </td>
                                                    <td className={`px-12 py-8 text-right font-black text-2xl tracking-tighter ${row.balance >= 0 ? 'text-slate-900' : 'text-rose-600 underline'}`}>
                                                        ₹{row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {statementData.data.length === 0 && (
                                        <div className="py-32 text-center opacity-30 group">
                                            <Database size={80} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                            <h3 className="text-2xl font-black">Archive Void</h3>
                                            <p className="font-bold">No registered transactions discovered for this fiscal period.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[4rem] border-4 border-slate-50 border-dashed premium-shadow group">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 group-hover:bg-indigo-50">
                                <FileText size={48} className="text-slate-200 group-hover:text-indigo-200 transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.3em]">Query Required</h3>
                            <p className="text-slate-400 font-bold mt-2">Select an account entity and fiscal window to generate intelligence.</p>
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default LedgerStatement;
