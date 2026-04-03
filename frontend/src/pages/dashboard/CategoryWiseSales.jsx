import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
    Download,
    Loader2,
    Calendar,
    Layers,
    Activity,
    Target,
    RefreshCw,
    ChevronRight,
    Eye,
    Landmark,
    PieChart,
    Database,
    Printer
} from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CategoryWiseSales = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalSales: 0, itemCount: 0 });

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const url = `${import.meta.env.VITE_API_URL}/reports/sales-by-category?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalSales: fetchedData.reduce((sum, item) => sum + item.totalSales, 0),
                    itemCount: fetchedData.reduce((sum, item) => sum + item.itemCount, 0)
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const exportToCSV = () => {
        if (!data.length) return;
        const headers = ["Segment", "Unit Volume", "Revenue Realization"];
        const rows = data.map(d => [d.category, d.itemCount, d.totalSales]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Category_Audit_${dateRange.start}.csv`);
        link.click();
    };

    const chartRenderData = data.slice(0, 8);
    const industrialPalette = [
        '#4f46e5', '#1e1b4b', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f5f3ff'
    ];

    const chartData = {
        labels: chartRenderData.map(d => d.category),
        datasets: [
            {
                data: chartRenderData.map(d => d.totalSales),
                backgroundColor: industrialPalette,
                borderWidth: 0,
                hoverOffset: 20
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 10, weight: 'bold' },
                bodyFont: { size: 12, weight: '900' }
            }
        },
        cutout: '80%',
    };

    const sortedTableData = [...data].sort((a, b) => b.totalSales - a.totalSales);

    const content = (
        <div className={`dashboard-content fade-in ${isEmbedded ? 'p-0 pb-32' : 'p-6 lg:p-14 pb-24'} max-w-[2000px] mx-auto w-full`}>

            {/* Industrial Header */}
            <div className={`flex flex-col xl:flex-row justify-between items-end xl:items-center ${isEmbedded ? 'mb-8 border-b border-slate-50 pb-6' : 'mb-16 border-b border-slate-100 pb-10'} gap-8`}>
                <div>
                    <div className="flex items-center gap-2 mb-4 text-[#101828]">
                        <Layers size={24} strokeWidth={2.5} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Segmental Intelligence</span>
                    </div>
                    <h2 className="premium-page-title mb-3">Category Analytics</h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">High-precision breakdown of revenue streams by operational segments.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    {!isEmbedded && (
                        <div className="px-4 border-r border-slate-200">
                            <ReportNavigationDropdown />
                        </div>
                    )}
                    <div className={`flex items-center px-6 py-3 gap-6 ${isEmbedded ? '' : 'border-r border-slate-200'}`}>
                        <Calendar size={20} className="text-indigo-600" />
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="bg-transparent border-none outline-none w-[115px] p-0" />
                            <span className="opacity-30">—</span>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="bg-transparent border-none outline-none w-[115px] p-0" />
                        </div>
                    </div>
                    <button className="h-12 px-8 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200" onClick={fetchData}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Period
                    </button>
                </div>
            </div>

            {/* Industrial Summary Counters */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 ${isEmbedded ? 'mb-10' : 'mb-20'}`}>
                <div className="group col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={12} className="text-indigo-500" /> Aggregate Segment Yield
                    </p>
                    <h4 className={`${isEmbedded ? 'text-2xl' : 'text-4xl'} font-black text-indigo-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform`}>₹{fmt(summary.totalSales)}</h4>
                    <div className="h-1 w-24 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className="group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target size={12} className="text-slate-900" /> Net Inventory Flow
                    </p>
                    <h4 className={`${isEmbedded ? 'text-2xl' : 'text-4xl'} font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform`}>{summary.itemCount} Units</h4>
                    <div className="h-1 w-12 bg-slate-900 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all flex items-center gap-3">
                        <Download size={16} /> Export XLS
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-32">
                    <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
                    <p className="text-slate-300 font-bold tracking-widest uppercase text-[10px]">Assembling Segmental Matrix...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-16 mb-20 items-start">
                    {/* Visual Analytics */}
                    <div className="xl:col-span-2 flex flex-col items-center bg-[#FAFAFB] p-16 rounded-[3rem] border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                            <PieChart size={200} />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-16 self-start">Yield Distribution</h3>
                        <div className="relative w-full max-w-[320px] aspect-square">
                            <Doughnut data={chartData} options={chartOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">{data.length}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Active Nodes</span>
                            </div>
                        </div>
                        <div className="mt-16 w-full grid grid-cols-2 gap-4">
                            {chartRenderData.map((d, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: industrialPalette[i] }}></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate">{d.category}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Segment Data Precinct */}
                    <div className="xl:col-span-3 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="p-6">Segment Hub</th>
                                    <th className="p-6 text-center">Operational Units</th>
                                    <th className="p-6 text-right">Yield Recognition</th>
                                    <th className="p-6 text-center">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sortedTableData.length === 0 ? (
                                    <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold uppercase text-[9px]">No categorical data detected</td></tr>
                                ) : (
                                    sortedTableData.map((cat, ix) => (
                                        <tr key={ix} className="hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => navigate('/dashboard/self-service/bills-sales', { state: { search: cat.category } })}>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                        <Database size={14} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{cat.category || 'Generic/Misc'}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase">
                                                    {cat.itemCount} Units
                                                </span>
                                            </td>
                                            <td className="p-6 text-right font-black text-slate-900 text-base">
                                                ₹{fmt(cat.totalSales)}
                                            </td>
                                            <td className="p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto shadow-lg">
                                                    <ChevronRight size={14} />
                                                </div>
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

    if (isEmbedded) {
        return (
            <div className="fade-in flex-1 flex flex-col min-h-0 overflow-hidden w-full">
                {content}
            </div>
        );
    }

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main overflow-hidden font-sans flex flex-col">
                <Header toggleSidebar={toggleSidebar} />
                <div className="flex-1 overflow-auto">
                    {content}
                </div>
            </main>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CategoryWiseSales;

