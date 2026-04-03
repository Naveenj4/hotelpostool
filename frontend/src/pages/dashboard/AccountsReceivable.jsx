import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Download, Loader2, ArrowDownToLine } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AccountsReceivable = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [ranges, setRanges] = useState({});
    const [details, setDetails] = useState([]);

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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/aging-report?type=CUSTOMER`, { headers });
            const result = await res.json();

            if (result.success) {
                setRanges(result.data || {});
                setDetails(result.details || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportToCSV = () => {
        if (!details.length) return;
        const headers = "Entity,Reference,Date,Age (Days),Amount\n";
        const rows = details.map(row => `"${row.entity}","${row.reference}",${row.date.split('T')[0]},${row.age},${row.amount}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Accounts_Receivable_Aging.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalReceivable = Object.values(ranges).reduce((sum, val) => sum + val, 0);

    const chartData = {
        labels: ['0-30 Days', '30-60 Days', '60+ Days (Critical)'],
        datasets: [{
            label: 'Outstanding Volume (₹)',
            data: [ranges['0-30'] || 0, ranges['30-60'] || 0, ranges['60+'] || 0],
            backgroundColor: [
                'rgba(56, 189, 248, 0.8)', // Blue
                'rgba(245, 158, 11, 0.8)', // Amber
                'rgba(239, 68, 68, 0.8)'   // Red
            ],
            borderWidth: 0,
            borderRadius: 4
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
        }
    };

    const content = (
        <div className={`master-content-layout fade-in ${isEmbedded ? 'p-0' : ''}`}>
            {!isEmbedded && (
                <div className="master-header-premium">
                    <div className="master-title-premium">
                        <div className="flex items-center gap-2 mb-2">
                            <ArrowDownToLine className="text-emerald-600" size={18} />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">Receivables</span>
                        </div>
                        <h2>Accounts Receivable Aging</h2>
                        <p>Detailed temporal analysis of pending inbound capital.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={exportToCSV} className="btn-premium-outline">
                            <Download size={18} /> EXPORT CSV
                        </button>
                    </div>
                </div>
            )}

            <div className="toolbar-premium">
                <div className="flex gap-4 items-center w-full justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">0-30 Days</div>
                            <div className="font-black text-sky-500">₹{(ranges['0-30'] || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">30-60 Days</div>
                            <div className="font-black text-amber-500">₹{(ranges['30-60'] || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">60+ Days</div>
                            <div className="font-black text-red-500">₹{(ranges['60+'] || 0).toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="text-right border-l pl-6 border-slate-200">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Outstanding</div>
                        <div className="text-2xl font-black text-emerald-600">₹{totalReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Processing Receivables Matrix...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Aging Distribution</h3>
                            <div style={{ height: '300px' }}>
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="table-container-premium max-h-[420px] overflow-y-auto">
                            <table className="table-premium w-full">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr>
                                        <th>Reference</th>
                                        <th>Entity</th>
                                        <th style={{ textAlign: 'center' }}>Age (Days)</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-bold bg-slate-50/50">No pending receivables detected.</td></tr>
                                    ) : (
                                        details.map((item, ix) => (
                                            <tr key={ix} className="hover:bg-slate-50 transition-colors">
                                                <td className="font-bold text-slate-700">
                                                    <div className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</div>
                                                    <span 
                                                        onClick={() => item.id && navigate('/dashboard/self-service/bills-sales', { state: { billId: item.id } })}
                                                        className="text-indigo-600 hover:underline cursor-pointer"
                                                    >
                                                        {item.reference}
                                                    </span>
                                                </td>
                                                <td 
                                                    className="font-bold text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                                                    onClick={() => item.ledger_id && navigate('/dashboard/self-service/ledger-statement', { state: { ledgerId: item.ledger_id } })}
                                                >
                                                    {item.entity}
                                                </td>
                                                <td className="text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-black
                                                        ${item.age > 60 ? 'bg-red-50 text-red-600 border border-red-100' :
                                                            item.age > 30 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                'bg-sky-50 text-sky-600 border border-sky-100'}
                                                    `}>
                                                        {item.age} Days
                                                    </span>
                                                </td>
                                                <td className="text-right font-black text-emerald-600">
                                                    ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (isEmbedded) return content;

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                {content}
            </main>
        </div>
    );
};

export default AccountsReceivable;
