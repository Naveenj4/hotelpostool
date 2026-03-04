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
                <div className="dashboard-content fade-in p-6 lg:p-10">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="text-indigo-600" size={20} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Financial Audit Logs</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Ledger Statement</h2>
                            <p className="text-slate-500 font-medium">Detailed transaction audit trails for specific accounts.</p>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 premium-shadow">
                            <div className="flex-1 min-w-[240px]">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Account Select</label>
                                <select
                                    value={selectedLedger}
                                    onChange={e => setSelectedLedger(e.target.value)}
                                    className="w-full border-none bg-slate-50 p-3 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                                >
                                    <option value="">Search Ledger...</option>
                                    {ledgers.map(l => <option key={l._id} value={l._id}>{l.name} [{l.group.replace(/_/g, ' ')}]</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Period Selection</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl">
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="bg-transparent text-xs font-black text-slate-600 outline-none" />
                                    <span className="text-slate-300 font-black">→</span>
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="bg-transparent text-xs font-black text-slate-600 outline-none" />
                                </div>
                            </div>

                            <button onClick={fetchStatement} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all self-end shadow-lg shadow-slate-200">
                                <Search size={18} className="inline mr-2" /> Audit Account
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] premium-shadow border border-slate-50">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={56} />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Querying Database Archives...</p>
                        </div>
                    ) : statementData ? (
                        <div className="bg-white rounded-[3rem] border border-slate-100 premium-shadow overflow-hidden fade-in">
                            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50 backdrop-blur-md">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-sm text-indigo-600">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{statementData.ledger}</h3>
                                        <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase mt-2">Archives: {new Date(dateRange.start).toLocaleDateString().replace(/\//g, '-')} to {new Date(dateRange.end).toLocaleDateString().replace(/\//g, '-')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={exportToCSV} className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                                        <Download size={18} /> CSV
                                    </button>
                                    <button onClick={() => window.print()} className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                                        <Printer size={18} /> Print Audit
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 bg-slate-50/30 border-b border-slate-50">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-50 premium-shadow h-28 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Opening</p>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter">₹{(statementData.opening_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-50 premium-shadow h-28 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-1">Total Credit</p>
                                    <h4 className="text-2xl font-black text-emerald-600 tracking-tighter">₹{statementData.data.reduce((acc, curr) => acc + curr.credit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-50 premium-shadow h-28 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.2em] mb-1">Total Debit</p>
                                    <h4 className="text-2xl font-black text-rose-600 tracking-tighter">₹{statementData.data.reduce((acc, curr) => acc + curr.debit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                                <div className={`p-6 rounded-[2rem] border-2 h-28 flex flex-col justify-center premium-shadow ${(statementData.data[statementData.data.length - 1]?.balance || 0) >= 0 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}>
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Closing Net</p>
                                    <h4 className="text-2xl font-black tracking-tighter">
                                        ₹{(statementData.data[statementData.data.length - 1]?.balance ?? statementData.opening_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h4>
                                </div>
                            </div>

                            <div className="overflow-x-auto p-4 lg:p-10">
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                            <th className="px-6 py-4">Transaction Hub</th>
                                            <th className="px-6 py-4 text-center">Ref Identity</th>
                                            <th className="px-6 py-4">Context Details</th>
                                            <th className="px-6 py-4 text-right">Debit (Money Out)</th>
                                            <th className="px-6 py-4 text-right">Credit (Money In)</th>
                                            <th className="px-6 py-4 text-right">Running Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-0">
                                        {statementData.data.map((row, i) => (
                                            <tr key={i} className="group bg-white hover:bg-slate-50/50 transition-all rounded-2xl premium-shadow h-20">
                                                <td className="px-6 py-4 border-y border-l border-slate-50 group-hover:border-indigo-100 rounded-l-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                                            <Calendar size={18} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">{new Date(row.date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-y border-slate-50 group-hover:border-indigo-100 text-center">
                                                    <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-100">VCH: {row.voucher_no}</span>
                                                </td>
                                                <td className="px-6 py-4 border-y border-slate-50 group-hover:border-indigo-100 font-bold text-slate-800 uppercase text-xs tracking-tight">{row.particulars}</td>
                                                <td className="px-6 py-4 border-y border-slate-50 group-hover:border-indigo-100 text-right font-black text-rose-500">
                                                    {row.debit > 0 ? (
                                                        <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in duration-300">
                                                            <TrendingDown size={14} className="opacity-40" />
                                                            ₹{row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    ) : <span className="text-slate-100">-</span>}
                                                </td>
                                                <td className="px-6 py-4 border-y border-slate-50 group-hover:border-indigo-100 text-right font-black text-emerald-500">
                                                    {row.credit > 0 ? (
                                                        <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in duration-300">
                                                            <TrendingUp size={14} className="opacity-40" />
                                                            ₹{row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    ) : <span className="text-slate-100">-</span>}
                                                </td>
                                                <td className={`px-6 py-4 border-y border-r border-slate-50 group-hover:border-indigo-100 text-right rounded-r-2xl font-black text-lg tracking-tighter ${row.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
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
