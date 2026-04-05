import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Download, Loader2, Building2 } from 'lucide-react';
import './Dashboard.css';

const SupplierOutstanding = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalOutstanding: 0, supplierCount: 0 });

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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/supplier-outstanding`, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalOutstanding: fetchedData.reduce((sum, item) => sum + item.balance, 0),
                    supplierCount: fetchedData.length
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
        const headers = "Supplier Name,Contact Person,Outstanding Balance\n";
        const rows = data.map(row => `"${row.name}","${row.contact || ''}",${row.balance}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Supplier_Outstanding.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const content = (
        <div className={`${isEmbedded ? 'p-0' : 'master-content-layout'} fade-in h-full flex flex-col`}>
            {!isEmbedded && (
                <div className="master-header-premium">
                    <div className="master-title-premium">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="text-red-600" size={18} />
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full">Outstanding Payable</span>
                        </div>
                        <h2>Supplier Obligations</h2>
                        <p>Current due capital per partner organization.</p>
                    </div>
                </div>
            )}

            <div className="toolbar-premium border-b border-slate-50 bg-slate-50/30 px-6 py-4">
                <div className="flex gap-4 items-center w-full justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Tracking {summary.supplierCount} Active Accounts</div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aggregate Liability</div>
                            <div className="text-xl font-black text-red-600 leading-none">₹{summary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <button onClick={exportToCSV} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-400 hover:text-red-600" title="Export CSV">
                            <Download size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        <Loader2 className="animate-spin text-red-600 mb-4" size={32} />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Assembling Fiscal State...</p>
                    </div>
                ) : (
                    <div className="table-container-premium flex-1 overflow-y-auto scrollbar-premium">
                        <table className="table-premium w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Corporate Entity</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Point</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Outstanding Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-24">
                                            <div className="flex flex-col items-center opacity-30">
                                                <Building2 size={40} className="mb-3 text-slate-300" />
                                                <p className="text-sm font-bold text-slate-400">All supplier debts are currently resolved.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, ix) => (
                                        <tr key={ix} 
                                            onClick={() => navigate('/dashboard/self-service/ledger-statement', { state: { ledgerId: item.ledger_id } })}
                                            className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 group-hover:text-red-700 transition-colors">{item.name}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Business Partner</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-500 font-medium text-xs font-mono">
                                                    {item.contact || <span className="text-slate-300 italic">No Contact Provided</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-red-600 text-base">
                                                    ₹{item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
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

export default SupplierOutstanding;
