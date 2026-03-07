import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
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
import { Download, Loader2, Calendar, Activity, Box } from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ItemWiseSales = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalRevenue: 0, totalItems: 0 });

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

            // limit=10000 to get virtually all items
            const url = `${import.meta.env.VITE_API_URL}/reports/top-products?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=10000`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalRevenue: fetchedData.reduce((sum, item) => sum + item.revenue, 0),
                    totalItems: fetchedData.reduce((sum, item) => sum + item.quantity, 0)
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
        const headers = "Item Name,Quantity Sold,Total Revenue\n";
        const rows = data.map(row => `"${row.name}",${row.quantity},${row.revenue}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Item_Wise_Sales_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Take top 15 for charting to avoid overcrowding
    const chartRenderData = data.slice(0, 15);

    const chartData = {
        labels: chartRenderData.map(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name),
        datasets: [
            {
                label: 'Revenue (₹)',
                data: chartRenderData.map(d => d.revenue),
                backgroundColor: 'rgba(126, 161, 196, 0.8)',
                borderColor: '#7ea1c4',
                borderWidth: 1,
                borderRadius: 4,
                yAxisID: 'y'
            },
            {
                label: 'Quantity',
                data: chartRenderData.map(d => d.quantity),
                backgroundColor: 'rgba(56, 189, 248, 0.4)',
                borderColor: '#38bdf8',
                borderWidth: 1,
                borderRadius: 4,
                yAxisID: 'y1'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', align: 'end' },
            title: { display: false }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                grid: { color: '#f1f5f9', drawBorder: false },
                title: { display: true, text: 'Revenue (₹)', font: { size: 10, weight: 'bold' } }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                grid: { drawOnChartArea: false, drawBorder: false },
                title: { display: true, text: 'Quantity', font: { size: 10, weight: 'bold' } }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { maxRotation: 45, minRotation: 45 }
            }
        }
    };

    const sortedTableData = [...data].sort((a, b) => b.revenue - a.revenue);

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Box className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Sales Summary</span>
                            </div>
                            <h2>Item-wise Sales Intelligence</h2>
                            <p>Product performance and contribution analysis.</p>
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
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Gross Revenue Volume</div>
                                <div className="text-xl font-black text-indigo-600">₹{summary.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div className="text-right">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Units Moved</div>
                                <div className="text-xl font-black text-slate-800">{summary.totalItems}</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Assembling Product Metrics...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Top Selling Products (Top 15)</h3>
                                    </div>
                                    <div style={{ height: '400px' }}>
                                        {data.length > 0 ? (
                                            <Bar data={chartData} options={chartOptions} />
                                        ) : (
                                            <div className="flex justify-center items-center h-full text-slate-400 font-bold text-sm">No sales data for visualization</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-1">
                                <div className="table-container-premium max-h-[500px] overflow-y-auto">
                                    <table className="table-premium">
                                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                            <tr>
                                                <th>Item Classification</th>
                                                <th style={{ textAlign: 'center' }}>Qty</th>
                                                <th style={{ textAlign: 'right' }}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedTableData.length === 0 ? (
                                                <tr><td colSpan="3" className="text-center py-10 text-slate-400 font-bold">No product sales found</td></tr>
                                            ) : (
                                                sortedTableData.map((item, ix) => (
                                                    <tr key={ix}>
                                                        <td className="font-bold text-slate-700">
                                                            <div className="truncate w-32 md:w-full" title={item.name}>{item.name}</div>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-black">
                                                                {item.quantity}
                                                            </span>
                                                        </td>
                                                        <td className="text-right font-black text-indigo-600">
                                                            ₹{item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default ItemWiseSales;
