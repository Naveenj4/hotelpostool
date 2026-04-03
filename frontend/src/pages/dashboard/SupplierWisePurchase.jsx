import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import ReportNavigationDropdown from '../../components/dashboard/ReportNavigationDropdown';
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
import { Doughnut, Bar } from 'react-chartjs-2';
import { Download, Loader2, Calendar, Users } from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const SupplierWisePurchase = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalAmount: 0, totalDue: 0, totalPaid: 0 });

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

            const url = `${import.meta.env.VITE_API_URL}/reports/purchase-summary?groupBy=SUPPLIER&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalAmount: fetchedData.reduce((sum, item) => sum + item.amount, 0),
                    totalDue: fetchedData.reduce((sum, item) => sum + item.due, 0),
                    totalPaid: fetchedData.reduce((sum, item) => sum + item.paid, 0)
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
        const headers = "Supplier Name,Total Gross,Total Paid,Total Due\n";
        const rows = data.map(row => `"${row.name}",${row.amount},${row.paid},${row.due}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Supplier_Wise_Purchase_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateColors = (count) => {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'
        ];
        return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
    };

    const chartRenderData = data.slice(0, 8); // Display top 8 in pie/doughnut 
    const palette = generateColors(chartRenderData.length);

    const chartData = {
        labels: chartRenderData.map(d => d.name),
        datasets: [
            {
                data: chartRenderData.map(d => d.amount),
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
        cutout: '65%',
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = chartData.labels[index];
                navigate('/dashboard/self-service/purchase-invoices', { state: { supplierName: label } });
            }
        }
    };

    const sortedTableData = [...data].sort((a, b) => b.amount - a.amount);

    const content = (
        <div className={`${isEmbedded ? 'master-content-layout p-0 pb-32' : 'master-content-layout'} fade-in`}>
            <div className="master-header-premium">
                <div className="master-title-premium">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="text-red-600" size={18} />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full">Purchase Summary</span>
                    </div>
                    <h2 className={`${isEmbedded ? 'text-3xl' : ''}`}>Supplier Expenditure Profile</h2>
                    <p>Strategic supplier spend and due capital analysis.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportToCSV} className="btn-premium-outline">
                        <Download size={18} /> EXPORT CSV
                    </button>
                </div>
            </div>

            <div className="toolbar-premium">
                <div className="flex flex-wrap items-center gap-4">
                    {!isEmbedded && <ReportNavigationDropdown />}
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
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Spend</div>
                        <div className={`${isEmbedded ? 'text-lg' : 'text-xl'} font-black text-red-600`}>₹{summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div className="text-right">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Dues</div>
                        <div className={`${isEmbedded ? 'text-lg' : 'text-xl'} font-black text-amber-600`}>₹{summary.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Assembling Supplier Metrics...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-5 gap-6">
                    <div className="md:col-span-1 lg:col-span-1 xl:col-span-2">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 flex flex-col justify-center items-center h-full">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 w-full text-left">Capital Outflow Distribution</h3>
                            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                                {data.length > 0 ? (
                                    <Doughnut data={chartData} options={chartOptions} />
                                ) : (
                                    <div className="flex justify-center items-center h-32 text-slate-400 font-bold text-sm">No supplier procurement data</div>
                                )}
                                {data.length > 0 && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4 -ml-16">
                                        <div className="text-2xl font-black text-slate-800">
                                            {chartRenderData.length}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entities</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1 lg:col-span-1 xl:col-span-3">
                        <div className="table-container-premium max-h-[500px] overflow-y-auto w-full">
                            <table className="table-premium w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 border-b">Supplier Entity</th>
                                        <th className="p-4 border-b" style={{ textAlign: 'right' }}>Paid</th>
                                        <th className="p-4 border-b" style={{ textAlign: 'right' }}>Due</th>
                                        <th className="p-4 border-b" style={{ textAlign: 'right' }}>Gross Billed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTableData.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-bold">No supplier entries mapped</td></tr>
                                    ) : (
                                        sortedTableData.map((supp, ix) => (
                                            <tr key={ix}
                                                onClick={() => navigate('/dashboard/self-service/purchase-invoices', { state: { supplierName: supp.name } })}
                                                style={{ cursor: 'pointer' }}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="p-4 font-bold text-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ background: palette[ix % palette.length] || '#cbd5e1' }}></div>
                                                        <span className="truncate w-32 md:w-full" title={supp.name}>{supp.name || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded text-xs font-black border border-emerald-100">
                                                        ₹{supp.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {supp.due > 0 ? (
                                                        <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded text-xs font-black border border-amber-100">
                                                            ₹{supp.due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-bold">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right font-black text-red-600">
                                                    ₹{supp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

    if (isEmbedded) {
        return (
            <div className="fade-in flex-1 flex flex-col min-h-0 overflow-hidden w-full">
                {content}
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <main className="dashboard-main overflow-hidden flex flex-col">
                <Header toggleSidebar={toggleSidebar} />
                <div className="flex-1 overflow-auto">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default SupplierWisePurchase;

