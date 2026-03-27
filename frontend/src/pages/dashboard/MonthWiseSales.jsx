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
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
    Download,
    Loader2,
    Calendar,
    Activity,
    TrendingUp,
    Target,
    Box,
    ChevronRight,
    RefreshCw,
    Printer,
    Eye,
    LayoutDashboard
} from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthWiseSales = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalSales: 0, totalBills: 0 });

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const url = `${import.meta.env.VITE_API_URL}/reports/month-wise?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                setData(result.data.monthlyBreakdown || []);
                setSummary({
                    totalSales: result.data.totalSales || 0,
                    totalBills: result.data.totalBills || 0
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
        const headers = ["Month", "Doc Volume", "Revenue Recognition"];
        const rows = data.map(d => [d.month, d.billCount, d.totalSales]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Monthwise_Audit_${dateRange.start}.csv`);
        link.click();
    };

    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: 'Monthly Net Realization (₹)',
                data: data.map(d => d.totalSales),
                backgroundColor: 'rgba(79, 70, 229, 0.9)',
                hoverBackgroundColor: '#1e1b4b',
                borderRadius: 12,
                barThickness: 40
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { size: 10, weight: 'bold', family: 'Inter' },
                bodyFont: { size: 12, weight: '900', family: 'Inter' },
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f8fafc', drawBorder: false },
                ticks: { font: { size: 10, weight: '700' }, color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: '700' }, color: '#94a3b8' }
            }
        }
    };

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main overflow-hidden font-sans">
                <Header toggleSidebar={toggleSidebar} />

                <div className="dashboard-content fade-in p-6 lg:p-14 max-w-[2000px] mx-auto w-full">

                    {/* Industrial Header */}
                    <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center mb-16 gap-8 border-b border-slate-100 pb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-[#101828]">
                                <Activity size={24} strokeWidth={2.5} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Longitudinal Revenue Audit</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3 uppercase">Month-Wise Archive</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Monthly aggregate realization and document volume trajectory.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="px-4 border-r border-slate-200">
                                <ReportNavigationDropdown />
                            </div>
                            <div className="flex items-center px-6 py-3 gap-6 border-r border-slate-200">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
                        <div className="group col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <TrendingUp size={12} className="text-indigo-500" /> Aggregate Revenue Recognition
                            </p>
                            <h4 className="text-4xl font-black text-indigo-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.totalSales)}</h4>
                            <div className="h-1 w-24 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target size={12} className="text-slate-900" /> Aggregate Doc Volume
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.totalBills}</h4>
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
                            <p className="text-slate-300 font-bold tracking-widest uppercase text-[10px]">Processing Longitudinal Matrix...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-16 mb-20">
                            {/* Visual Trajectory */}
                            <div className="xl:col-span-2">
                                <div className="bg-[#FAFAFB] p-10 rounded-3xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-10">
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Temporal Revenue Vector</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Realization</span>
                                        </div>
                                    </div>
                                    <div className="h-[450px]">
                                        <Bar data={chartData} options={chartOptions} />
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Data Precinct */}
                            <div className="xl:col-span-1">
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="p-6">Chronology</th>
                                                <th className="p-6 text-center">Volume</th>
                                                <th className="p-6 text-right">Yield</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {data.length === 0 ? (
                                                <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-bold uppercase text-[9px]">No logs detected</td></tr>
                                            ) : (
                                                data.map((m, ix) => (
                                                    <tr key={ix} className="hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => navigate('/dashboard/self-service/bills-sales', { state: { search: m.month } })}>
                                                        <td className="p-6">
                                                            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{m.month}</span>
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                                {m.billCount} docs
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-right font-black text-slate-900 text-base">
                                                            ₹{fmt(m.totalSales)}
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

export default MonthWiseSales;
