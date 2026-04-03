import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Download, Loader2, Users } from 'lucide-react';
import './Dashboard.css';

const CustomerOutstanding = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalOutstanding: 0, customerCount: 0 });

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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/customer-outstanding`, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalOutstanding: fetchedData.reduce((sum, item) => sum + item.balance, 0),
                    customerCount: fetchedData.length
                });
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
        if (!data.length) return;
        const headers = "Customer Name,Contact,Outstanding Balance\n";
        const rows = data.map(row => `"${row.name}","${row.phone || ''}",${row.balance}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Customer_Outstanding.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const content = (
        <div className={`${isEmbedded ? 'master-content-layout p-0 pb-32' : 'master-content-layout'} fade-in`}>
            <div className="master-header-premium">
                <div className="master-title-premium">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="text-amber-600" size={18} />
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full">Outstanding</span>
                    </div>
                    <h2 className={`${isEmbedded ? 'text-3xl' : ''}`}>Customer Balances</h2>
                    <p>Current outstanding bounds aggregated per customer.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportToCSV} className="btn-premium-outline">
                        <Download size={18} /> EXPORT CSV
                    </button>
                </div>
            </div>

            <div className="toolbar-premium">
                <div className="flex gap-4 items-center w-full justify-between">
                    <div className="flex items-center">
                        <div className="text-slate-400 font-bold text-sm">Tracking {summary.customerCount} Active Accounts</div>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Outstanding</div>
                            <div className={`${isEmbedded ? 'text-xl' : 'text-2xl'} font-black text-amber-600`}>₹{summary.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <Loader2 className="animate-spin text-amber-600 mb-4" size={48} />
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Assembling Ledger Bounds...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                    <div className="table-container-premium">
                        <table className="table-premium w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 border-b">Customer Name</th>
                                    <th className="p-4 border-b">Contact Detail</th>
                                    <th className="p-4 border-b" style={{ textAlign: 'right' }}>Outstanding Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-10 text-slate-400 font-bold bg-slate-50/50">All customer ledgers are cleared.</td></tr>
                                ) : (
                                    data.map((item, ix) => (
                                        <tr key={ix} 
                                            onClick={() => navigate('/dashboard/self-service/ledger-statement', { state: { ledgerId: item.ledger_id } })}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <td className="p-4 font-bold text-slate-700">{item.name}</td>
                                            <td className="p-4 text-slate-500 font-bold text-sm tracking-wide">
                                                {item.phone || <span className="text-slate-300">Unregistered</span>}
                                            </td>
                                            <td className="p-4 text-right font-black text-amber-600">
                                                ₹{item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default CustomerOutstanding;
