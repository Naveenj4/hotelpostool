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
    <div className="bento-card group flex flex-col justify-between h-56 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
            {icon}
        </div>
        <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner" style={{ backgroundColor: `${color}10`, color: color }}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                {trend && (
                    <div className={`mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <ArrowUpRight size={12} className={trend.startsWith('-') ? 'rotate-90' : ''} />
                        {trend} <span className="text-slate-300 font-bold ml-1">Period</span>
                    </div>
                )}
            </div>
        </div>
        <div className="mt-8">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
            <div className="w-full h-1.5 bg-slate-50 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full opacity-20 transition-all duration-1000 group-hover:w-full" style={{ width: '40%', backgroundColor: color }}></div>
            </div>
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
        <div className="dashboard-layout premium-gradient-bg">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} restaurantName={dashboardData?.restaurantInfo?.printName} />

                <div className="dashboard-content fade-in p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    <div className="master-header-premium-refined flex-col md:flex-row mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                                    <Activity size={20} />
                                </div>
                                <span className="metric-pill-modern">System Pulse: Online</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Command Centre</h2>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Real-time oversight of your POS ecosystem and fiscal health.</p>
                        </div>
                        <button className="btn-glow bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.1em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center gap-4 group">
                            <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-500" /> Create New Transaction
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
                        <StatCard label="Inflow (Today)" value={`₹${(dashboardData?.todaySales || 0).toLocaleString()}`} icon={<TrendingUp size={48} />} color="#10b981" trend="+12.5%" />
                        <StatCard label="Outflow (Today)" value={`₹${(dashboardData?.todayPurchases || 0).toLocaleString()}`} icon={<ShoppingBag size={48} />} color="#ef4444" trend="+4.2%" />
                        <StatCard label="Vendor Liabilities" value={`₹${(dashboardData?.supplierOutstanding || 0).toLocaleString()}`} icon={<CreditCard size={48} />} color="#f59e0b" trend="-2.1%" />
                        <StatCard label="Ledger Credits" value={`₹${(dashboardData?.customerOutstanding || 0).toLocaleString()}`} icon={<Wallet size={48} />} color="#3b82f6" trend="+0.5%" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 bento-card flex flex-col p-0 overflow-hidden">
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 backdrop-blur-sm">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-50">
                                            <Activity size={24} />
                                        </div>
                                        Transaction Audit Trail
                                    </h3>
                                    <p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Latest real-time ledger entries</p>
                                </div>
                                <button className="w-12 h-12 bg-white text-slate-400 hover:text-indigo-600 hover:scale-110 rounded-2xl transition-all shadow-sm border border-slate-50 flex items-center justify-center"><ArrowRight size={24} /></button>
                            </div>
                            <div className="p-6 overflow-x-auto">
                                <table className="modern-table-premium">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                                            <th className="px-6 py-4 text-left">Timestamp</th>
                                            <th className="px-6 py-4 text-left">Type</th>
                                            <th className="px-6 py-4 text-left">Amount</th>
                                            <th className="px-6 py-4 text-left">Ledger Pair</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData?.latestVouchers?.map((v, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="flex items-center gap-3 font-black text-slate-700">
                                                        <Calendar size={14} className="text-indigo-600 opacity-40" />
                                                        {new Date(v.date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${v.type === 'RECEIPT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        v.type === 'PAYMENT' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {v.type}
                                                    </span>
                                                </td>
                                                <td className="font-black text-slate-900 text-lg">₹{v.amount.toLocaleString()}</td>
                                                <td>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                                                        <span className="opacity-40 font-black">DR</span> {v.dr}
                                                        <span className="text-indigo-200">|</span>
                                                        <span className="opacity-40 font-black">CR</span> {v.cr}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bento-card flex flex-col p-0 overflow-hidden border-rose-100/50">
                            <div className="p-10 border-b border-rose-50 flex justify-between items-center bg-rose-50/10 backdrop-blur-sm">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                                            <AlertTriangle size={24} />
                                        </div>
                                        Inventory Alerts
                                    </h3>
                                    <p className="text-xs font-black text-rose-400 mt-2 uppercase tracking-[0.2em]">Replenishment required</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-6 flex-1">
                                {dashboardData?.lowStockItems?.length > 0 ? (
                                    dashboardData.lowStockItems.map((alert, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-rose-100 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 font-black text-xl group-hover:scale-110 transition-transform">!</div>
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase text-sm tracking-tight leading-none group-hover:text-rose-700">{alert.item}</p>
                                                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{alert.unit} Base Unit</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-rose-600">{alert.remaining}</p>
                                                <div className="h-1 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }}></div>
                                                </div>
                                                <p className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em] mt-2">Critical Level</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-30 py-20">
                                        <Activity size={80} className="mb-6 text-indigo-200" />
                                        <p className="font-black uppercase tracking-[0.3em] text-sm">All Inventory Stable</p>
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
