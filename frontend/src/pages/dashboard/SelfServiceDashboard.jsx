import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    TrendingUp,
    FileText,
    CreditCard,
    AlertTriangle,
    ArrowUpRight,
    ShoppingBag,
    PlusCircle,
    Wallet,
    Calendar,
    Activity,
    ArrowRight
} from 'lucide-react';
import { Skeleton, TableSkeleton } from '../../components/Skeleton';
import './Dashboard.css';

const StatCard = ({ label, value, icon, color, trend }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between transition-all hover:scale-[1.02] premium-shadow h-48 relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            {icon}
        </div>
        <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${color}15`, color: color }}>
                {icon}
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
            {trend && (
                <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend} <span className="text-slate-300">from yesterday</span>
                </div>
            )}
        </div>
    </div>
);

const SelfServiceDashboard = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;
                const { token } = JSON.parse(savedUser);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) setDashboardData(result.data);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-layout bg-slate-50">
                <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
                <main className="dashboard-main">
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="dashboard-content p-10">
                        <div className="h-10 w-64 bg-slate-200 rounded-full animate-pulse mb-8" />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white rounded-[2.5rem] animate-pulse premium-shadow" />)}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="h-96 bg-white rounded-[2.5rem] animate-pulse premium-shadow" />
                            <div className="h-96 bg-white rounded-[2.5rem] animate-pulse premium-shadow" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} restaurantName={dashboardData?.restaurantInfo?.printName} />

                <div className="dashboard-content fade-in p-6 lg:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">System Overview</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Main Command Centre</h2>
                            <p className="text-slate-500 font-medium">Monitoring real-time POS operations and financial health.</p>
                        </div>
                        <button className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.1em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 flex items-center gap-3">
                            <PlusCircle size={20} /> Create New Sale
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-10">
                        <StatCard label="Live Gross Sales" value={`₹${(dashboardData?.todaySales || 0).toLocaleString()}`} icon={<TrendingUp size={48} />} color="#10b981" trend="+12.5%" />
                        <StatCard label="Expense Accrual" value={`₹${(dashboardData?.todayPurchases || 0).toLocaleString()}`} icon={<ShoppingBag size={48} />} color="#ef4444" trend="+4.2%" />
                        <StatCard label="Vendor Liability" value={`₹${(dashboardData?.supplierOutstanding || 0).toLocaleString()}`} icon={<CreditCard size={48} />} color="#f59e0b" trend="-2.1%" />
                        <StatCard label="Ledger Receivable" value={`₹${(dashboardData?.customerOutstanding || 0).toLocaleString()}`} icon={<Wallet size={48} />} color="#3b82f6" trend="+0.5%" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 premium-shadow overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                        <Activity size={24} className="text-indigo-600" />
                                        Recent Transaction Log
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Latest financial audit trail</p>
                                </div>
                                <button className="p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm border border-slate-50"><ArrowRight size={20} /></button>
                            </div>
                            <div className="overflow-x-auto p-4">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                                            <th className="px-6 py-4">Timestamp</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Ledger Distribution</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/50">
                                        {dashboardData?.latestVouchers?.map((v, i) => (
                                            <tr key={i} className="group hover:bg-slate-50/50 transition-all rounded-2xl h-16">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-bold text-slate-600 text-sm">
                                                        <Calendar size={14} className="text-slate-300" />
                                                        {new Date(v.date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${v.type === 'RECEIPT' ? 'bg-emerald-50 text-emerald-600' :
                                                            v.type === 'PAYMENT' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {v.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-black text-slate-800">₹{v.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                        <span className="text-[10px] opacity-40">DR:</span> {v.dr}
                                                        <span className="text-slate-200">/</span>
                                                        <span className="text-[10px] opacity-40">CR:</span> {v.cr}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 premium-shadow overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-rose-50 flex justify-between items-center bg-rose-50/20">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                        <AlertTriangle size={24} className="text-rose-500" />
                                        Critical Stock
                                    </h3>
                                    <p className="text-xs font-bold text-rose-400 mt-1 uppercase tracking-wider">Inventory replenishment alerts</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4 flex-1">
                                {dashboardData?.lowStockItems?.length > 0 ? (
                                    dashboardData.lowStockItems.map((alert, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl group hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm font-black text-lg">!</div>
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase text-xs tracking-tight leading-none group-hover:text-rose-700">{alert.item}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{alert.unit} Base Unit</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-rose-600">{alert.remaining}</p>
                                                <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Left</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                                        <Activity size={64} className="mb-4" />
                                        <p className="font-black uppercase tracking-widest text-xs">All Systems Stable</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SelfServiceDashboard;
