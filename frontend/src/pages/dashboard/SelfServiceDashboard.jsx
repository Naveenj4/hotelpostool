import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    TrendingUp,
    CreditCard,
    AlertTriangle,
    ArrowUpRight,
    ShoppingBag,
    Wallet,
    Activity,
    ArrowRight,
    Zap,
    MapPin,
    Users,
    Briefcase,
    PieChart,
    Search,
    Filter,
    Download
} from 'lucide-react';
import './Dashboard.css';


const StatCard = ({ label, value, icon, color, trend, percentage }) => (
    <div className="bento-card group flex flex-col justify-between relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white h-full p-6">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ backgroundColor: color }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative z-10 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md" style={{ backgroundColor: `${color}14`, color: color }}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[8px] font-extrabold uppercase tracking-tight ${trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-700' : 'bg-red-500/20 text-red-700'}`}>
                        {trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowUpRight size={10} className="rotate-90" />}
                        {trend}
                    </div>
                )}
            </div>
            <div className="flex-1 flex flex-col justify-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
        </div>
    </div>
);

const SelfServiceDashboard = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState({});
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
            <div className="dashboard-layout premium-gradient-bg">
                <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
                <main className="dashboard-main">
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="dashboard-content p-10 flex items-center justify-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 text-indigo-600">
                                <Activity size={32} />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Dashboard...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const grossProfit = (dashboardData?.todaySales || 0) - (dashboardData?.todayPurchases || 0);

    return (
        <div className="dashboard-layout premium-gradient-bg">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                {/* top_header_section mapped implicitly through Header, but adding the specific action bar below */}
                <Header toggleSidebar={toggleSidebar} restaurantName={dashboardData?.restaurantInfo?.printName} />

                <div className="dashboard-content fade-in p-8 lg:p-12 max-w-[1500px] mx-auto w-full">

                    {/* search_and_action_bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">CEO Overview</h2>
                            <p className="text-slate-500 font-medium text-base">Welcome back, monitor your key metrics here.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto md:flex-nowrap">
                            <div className="relative flex-1 md:flex-none md:w-72">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300 transition-all duration-200 placeholder-slate-400"
                                />
                            </div>
                            <button className="h-10 w-10 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center flex-shrink-0" title="Filter">
                                <Filter size={18} />
                            </button>
                            <button className="h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 rounded-lg font-bold text-sm hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-500/30 flex-shrink-0 border border-indigo-600">
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </div>

                    {/* kpi_metrics_cards - Responsive grid layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 mb-10 items-stretch">
                        {[{
                            label: 'Total Revenue',
                            value: `₹${(dashboardData?.todaySales || 0).toLocaleString()}`,
                            icon: <TrendingUp size={24} />, 
                            color: '#10b981', 
                            trend: '+12.5%'
                        }, {
                            label: 'Total Expenses',
                            value: `₹${(dashboardData?.todayPurchases || 0).toLocaleString()}`,
                            icon: <ShoppingBag size={24} />, 
                            color: '#ef4444', 
                            trend: '-4.2%'
                        }, {
                            label: 'Gross Profit',
                            value: `₹${grossProfit.toLocaleString()}`,
                            icon: <Wallet size={24} />, 
                            color: '#8b5cf6', 
                            trend: '+8.1%'
                        }, {
                            label: 'Current Ratio',
                            value: '1.5x',
                            icon: <Activity size={24} />, 
                            color: '#f59e0b', 
                            trend: '+0.2'
                        }, {
                            label: 'Total Clients',
                            value: dashboardData?.totalBills || 0,
                            icon: <Users size={24} />, 
                            color: '#3b82f6', 
                            trend: '+15%'
                        }, {
                            label: 'Total Employers',
                            value: dashboardData?.totalEmployers || 0,
                            icon: <Briefcase size={24} />, 
                            color: '#14b8a6', 
                            trend: '0%'
                        }].map(({ label, value, icon, color, trend }) => (
                            <div key={label} className="flex items-stretch">
                                <StatCard label={label} value={value} icon={icon} color={color} trend={trend} />
                            </div>
                        ))}
                    </div>

                    {/* analytics_visualization_section & top_entities_lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                        {/* left_panel: World Map Chart Placeholder */}
                        <div className="lg:col-span-7 bg-white rounded-2xl shadow-premium p-8 flex flex-col relative overflow-hidden border border-slate-200/50">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 tracking-tight text-lg">Top Country By Session</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Geographic distribution</p>
                                </div>
                                <button className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200 active:scale-95">View Map</button>
                            </div>
                            <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center min-h-[300px] relative">
                                <div className="w-16 h-16 rounded-2xl bg-white/50 flex items-center justify-center mb-4 shadow-sm">
                                    <MapPin size={32} className="text-slate-300" />
                                </div>
                                <div className="z-10 text-center max-w-xs">
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">Geospatial Distribution</p>
                                    <p className="text-slate-400 text-sm leading-relaxed">Active locations mapping rendered via telemetry layer interface.</p>
                                </div>
                            </div>
                        </div>

                        {/* right_panel: Top Lists & Donuts */}
                        <div className="lg:col-span-5 flex flex-col gap-6">

                            {/* top_company_list / top_customer_list via topProducts */}
                            <div className="bg-white rounded-2xl shadow-premium p-6 border border-slate-200/50">
                                <div className="flex justify-between items-center mb-5">
                                    <div>
                                        <h3 className="font-bold text-slate-900 tracking-tight">Top Companies/Customers</h3>
                                        <p className="text-xs text-slate-400 font-medium mt-1">Best performing clients</p>
                                    </div>
                                    <button className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 rounded-md border border-slate-200 hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-300 tracking-widest transition-all duration-200 active:scale-95">More</button>
                                </div>
                                <div className="space-y-3">
                                    {dashboardData?.topProducts?.slice(0, 3).map((prod, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50/50 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
                                                    {prod.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{prod.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{prod.quantity} units</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">₹{prod.sales.toLocaleString()}</p>
                                        </div>
                                    ))}
                                    {(!dashboardData?.topProducts || dashboardData.topProducts.length === 0) && (
                                        <p className="text-sm text-slate-400 font-medium text-center py-6">No active clients found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Donut Charts Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-2xl shadow-premium p-6 flex flex-col items-center justify-center text-center border border-slate-200/50">
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Subscribe</h4>
                                    <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-emerald-500 border-r-emerald-500 mb-3 flex items-center justify-center">
                                        <span className="text-xs font-bold text-slate-900">75%</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500">Active Rate</p>
                                </div>
                                <div className="bg-white rounded-2xl shadow-premium p-6 flex flex-col items-center justify-center text-center border border-slate-200/50">
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Lead Source</h4>
                                    <PieChart className="text-indigo-500 mb-2" size={40} />
                                    <div className="flex gap-2 text-[9px] font-bold text-slate-500 uppercase">
                                        <span className="text-indigo-600">Direct</span> • <span>Referral</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* bottom_analytics_panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* 1. Subscription Overview — Payment Breakdown */}
                        <div className="bg-white rounded-2xl shadow-premium p-6 border border-slate-200/50">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 tracking-tight">Subscription Overview</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Today's breakdown</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Today</span>
                            </div>
                            {dashboardData?.paymentSummary?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.paymentSummary.map((ps, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-slate-600 uppercase tracking-wide">{ps.mode}</span>
                                                <span className="text-slate-900 font-bold">₹{ps.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${Math.min(100, dashboardData.todaySales > 0 ? (ps.amount / dashboardData.todaySales) * 100 : 0)}%`,
                                                        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'][i % 4]
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-400 font-medium text-sm">
                                    <p className="text-2xl mb-2">—</p>
                                    No payment activity today.
                                </div>
                            )}
                        </div>

                        {/* 2. Tickets by Status — Mapped from Stock Alerts */}
                        <div className="bg-white rounded-2xl shadow-premium p-6 border border-slate-200/50">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 tracking-tight">Tickets by Status</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Stock alerts</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                    {dashboardData?.lowStockItems?.length || 0} open
                                </span>
                            </div>
                            {dashboardData?.lowStockItems?.length > 0 ? (
                                <div className="space-y-2">
                                    {dashboardData.lowStockItems.slice(0, 5).map((item, i) => {
                                        const severity = item.remaining < 3 ? 'Critical' : item.remaining < 7 ? 'Warning' : 'Low';
                                        const colors = { Critical: 'bg-rose-50 text-rose-600 border-rose-100', Warning: 'bg-amber-50 text-amber-600 border-amber-100', Low: 'bg-yellow-50 text-yellow-600 border-yellow-100' };
                                        return (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200">
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 truncate max-w-[130px]">{item.item}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{item.unit}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-sm">{item.remaining}</span>
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border ${colors[severity]}`}>{severity}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
                                        <Activity size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">All stock levels optimal.</p>
                                </div>
                            )}
                        </div>

                        {/* 3. Recent Activity — Latest Voucher Audit Trail */}
                        <div className="bg-white rounded-2xl shadow-premium p-6 border border-slate-200/50">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Audit trail</p>
                                </div>
                                <button className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 rounded-md border border-slate-200 hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-300 tracking-widest flex items-center gap-1 transition-all duration-200 active:scale-95">
                                    View All <ArrowRight size={11} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {dashboardData?.latestVouchers?.slice(0, 4).map((v, i) => (
                                    <div key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors duration-200">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0
                                            ${v.type === 'RECEIPT' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {v.type === 'RECEIPT' ? '↓' : '↑'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{v.dr || 'System'}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-[10px] text-slate-400 font-medium">{new Date(v.date).toLocaleDateString()}</p>
                                                <p className="text-xs font-bold text-slate-900">₹{v.amount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!dashboardData?.latestVouchers || dashboardData.latestVouchers.length === 0) && (
                                    <div className="py-8 text-center text-slate-400 font-medium text-sm">No recent voucher activity.</div>
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
