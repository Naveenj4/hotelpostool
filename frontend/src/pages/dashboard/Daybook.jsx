import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Download, Loader2, ListPlus } from 'lucide-react';
import './Dashboard.css';

const Daybook = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/daybook?date=${filterDate}`, { headers });
            const result = await res.json();

            if (result.success) {
                setTransactions(result.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterDate]);

    const exportToCSV = () => {
        if (!transactions.length) return;
        const headers = "Time,Type,Reference,Particulars,Inflow,Outflow\n";
        const rows = transactions.map(row => {
            const time = new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const inflow = row.side === 'IN' ? row.amount : 0;
            const outflow = row.side === 'OUT' ? row.amount : 0;
            return `"${time}","${row.type}","${row.ref}","${row.desc}",${inflow},${outflow}`;
        }).join('\n');

        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Daybook_${filterDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalInflow = transactions.filter(t => t.side === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const totalOutflow = transactions.filter(t => t.side === 'OUT').reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <ListPlus className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Accounts</span>
                            </div>
                            <h2>Real-time Daybook</h2>
                            <p>Daily chronological ledger of all cashflow and active bounds.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={exportToCSV} className="btn-premium-outline">
                                <Download size={18} /> EXPORT CSV
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-premium">
                        <div className="flex gap-4 items-center w-full justify-between">
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="input-premium font-bold text-indigo-600"
                                    style={{ width: '200px' }}
                                />
                            </div>
                            <div className="flex gap-6 items-center">
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Inflow</div>
                                    <div className="text-xl font-black text-emerald-600">₹{totalInflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                </div>
                                <div className="h-10 w-px bg-slate-200"></div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Outflow</div>
                                    <div className="text-xl font-black text-red-600">₹{totalOutflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Synchronizing Chronology...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                            <div className="table-container-premium">
                                <table className="table-premium w-full">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Document Class</th>
                                            <th>Reference / Particulars</th>
                                            <th style={{ textAlign: 'right' }}>Inflow (Dr)</th>
                                            <th style={{ textAlign: 'right' }}>Outflow (Cr)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold bg-slate-50/50">No operational records found for this period.</td></tr>
                                        ) : (
                                            transactions.map((t, ix) => (
                                                <tr key={ix}>
                                                    <td className="font-bold text-slate-700 w-32">
                                                        {new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="text-slate-500 font-bold text-xs tracking-wider">
                                                        <span className={`px-2 py-0.5 rounded
                                                            ${t.type === 'SALE' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                                                                t.type === 'PURCHASE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                    'bg-slate-100 text-slate-600 border border-slate-200'}
                                                        `}>
                                                            {t.type}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="font-bold text-slate-800">{t.ref || 'System'}</div>
                                                        <div className="text-xs text-slate-400 mt-1">{t.desc}</div>
                                                    </td>
                                                    <td className="text-right font-black text-emerald-600">
                                                        {t.side === 'IN' ? `₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                                    </td>
                                                    <td className="text-right font-black text-red-600">
                                                        {t.side === 'OUT' ? `₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Daybook;
