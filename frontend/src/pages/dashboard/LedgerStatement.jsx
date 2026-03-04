import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Search, Download, Calendar, ArrowLeft, Loader2, FileText, Printer } from 'lucide-react';

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
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content p-4 lg:p-8">
                    <div className="page-header mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><FileText className="text-indigo-600" size={32} /> Ledger Statement</h2>
                            <p className="text-slate-500 font-medium">Generate detailed transaction history for any account.</p>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                            <select
                                value={selectedLedger}
                                onChange={e => setSelectedLedger(e.target.value)}
                                className="border border-slate-200 p-2.5 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
                            >
                                <option value="">Select Ledger Account</option>
                                {ledgers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                            </select>
                            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="bg-transparent text-sm font-bold text-slate-600 outline-none" />
                                <span className="text-slate-300">to</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="bg-transparent text-sm font-bold text-slate-600 outline-none" />
                            </div>
                            <button onClick={fetchStatement} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <Search size={18} /> Generate
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
                    ) : statementData ? (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{statementData.ledger}</h3>
                                    <p className="text-slate-400 font-bold text-sm">Statement Period: {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={exportToCSV} className="bg-white border border-slate-200 p-3 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 font-bold">
                                        <Download size={18} /> CSV
                                    </button>
                                    <button onClick={() => window.print()} className="bg-white border border-slate-200 p-3 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 font-bold">
                                        <Printer size={18} /> Print PDF
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 border-b border-slate-100">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Opening Balance</p>
                                    <h4 className="text-2xl font-black text-indigo-600">₹{statementData.opening_balance.toLocaleString()}</h4>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-right">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Closing Balance</p>
                                    <h4 className={`text-2xl font-black ${statementData.data[statementData.data.length - 1]?.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        ₹{statementData.data[statementData.data.length - 1]?.balance.toLocaleString() || statementData.opening_balance.toLocaleString()}
                                    </h4>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-800 text-white">
                                        <tr>
                                            <th className="px-6 py-4 font-black uppercase text-xs tracking-widest">Date</th>
                                            <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-center">Voucher</th>
                                            <th className="px-6 py-4 font-black uppercase text-xs tracking-widest">Particulars</th>
                                            <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-right">Debit (Dr)</th>
                                            <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-right">Credit (Cr)</th>
                                            <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {statementData.data.map((row, i) => (
                                            <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-500 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black">{row.type} / {row.voucher_no}</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-700">{row.particulars}</td>
                                                <td className="px-6 py-4 text-right font-black text-rose-600 opacity-80">{row.debit > 0 ? `₹${row.debit.toLocaleString()}` : '-'}</td>
                                                <td className="px-6 py-4 text-right font-black text-emerald-600 opacity-80">{row.credit > 0 ? `₹${row.credit.toLocaleString()}` : '-'}</td>
                                                <td className={`px-6 py-4 text-right font-black ${row.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>₹{row.balance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {statementData.data.length === 0 && (
                                            <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold">No transactions found for the selected period.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 border-dashed">
                            <FileText size={64} className="text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">Select a ledger and date range to view statement.</h3>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LedgerStatement;
