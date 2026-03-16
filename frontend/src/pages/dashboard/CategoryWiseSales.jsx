import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
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
import { Download, Loader2, Calendar, Layers } from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CategoryWiseSales = () => {
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
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const exportToCSV = () => {
        if (!data.length) return;
        const headers = "Category Name,Items Sold,Total Revenue\n";
        const rows = data.map(row => `"${row.category}",${row.itemCount},${row.totalSales}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Category_Wise_Sales_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateColors = (count) => {
        const colors = [
            '#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb923c', '#fbbf24', '#34d399', '#2dd4bf'
        ];
        return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
    };

    const chartRenderData = data.slice(0, 8); // Display top 8 in pie/doughnut 
    const palette = generateColors(chartRenderData.length);

    const chartData = {
        labels: chartRenderData.map(d => d.category),
        datasets: [
            {
                data: chartRenderData.map(d => d.totalSales),
                backgroundColor: palette,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 10
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { font: { weight: 'bold' } }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.label}: ₹${context.raw.toLocaleString('en-IN')}`;
                    }
                }
            }
        },
        cutout: '65%', // Doughnut hole size
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = chartData.labels[index];
                navigate('/dashboard/self-service/bills-sales', { state: { search: label } });
            }
        }
    };

    const sortedTableData = [...data].sort((a, b) => b.totalSales - a.totalSales);

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Layers className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Sales Summary</span>
                            </div>
                            <h2>Category Analytics Profile</h2>
                            <p>Strategic categorization of menu performance.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={exportToCSV} className="btn-premium-outline">
                                <Download size={18} /> EXPORT CSV
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-premium">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="input-premium pl-11"
                                    style={{ width: '180px' }}
                                />
                            </div>
                            <span className="text-slate-400 font-bold px-2">TO</span>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="input-premium pl-11"
                                    style={{ width: '180px' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="text-right">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Category Aggregate</div>
                                <div className="text-xl font-black text-indigo-600">₹{summary.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div className="text-right">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Flow</div>
                                <div className="text-xl font-black text-slate-800">{summary.itemCount}</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Assembling Category Metrics...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-5 gap-6">
                            <div className="md:col-span-1 lg:col-span-1 xl:col-span-2">
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 flex flex-col justify-center items-center h-full">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 w-full text-left">Revenue Distribution</h3>
                                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                                        {data.length > 0 ? (
                                            <Doughnut data={chartData} options={chartOptions} />
                                        ) : (
                                            <div className="flex justify-center items-center h-32 text-slate-400 font-bold text-sm">No category data</div>
                                        )}
                                        {data.length > 0 && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4 -ml-16">
                                                <div className="text-2xl font-black text-slate-800">
                                                    {chartRenderData.length}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Divisions</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-1 lg:col-span-1 xl:col-span-3">
                                <div className="table-container-premium max-h-[500px] overflow-y-auto w-full">
                                    <table className="table-premium w-full">
                                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                            <tr>
                                                <th>Category Segment</th>
                                                <th style={{ textAlign: 'center' }}>Units</th>
                                                <th style={{ textAlign: 'right' }}>Revenue Yield</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedTableData.length === 0 ? (
                                                <tr><td colSpan="3" className="text-center py-10 text-slate-400 font-bold">No categorical entries mapped</td></tr>
                                            ) : (
                                                sortedTableData.map((cat, ix) => (
                                                    <tr key={ix}
                                                        onClick={() => navigate('/dashboard/self-service/bills-sales', { state: { search: cat.category } })}
                                                        style={{ cursor: 'pointer' }}
                                                        className="hover:bg-slate-50 transition-colors"
                                                    >
                                                        <td className="font-bold text-slate-700">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ background: palette[ix % palette.length] }}></div>
                                                                {cat.category || 'Uncategorized'}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded text-xs font-black border border-emerald-100">
                                                                {cat.itemCount}
                                                            </span>
                                                        </td>
                                                        <td className="text-right font-black text-indigo-600">
                                                            ₹{cat.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        </div>
    );
};

export default CategoryWiseSales;
