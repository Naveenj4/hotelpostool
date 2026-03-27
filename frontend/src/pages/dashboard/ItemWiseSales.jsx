import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Search,
    TrendingUp,
    TrendingDown,
    Activity,
    Loader2,
    RefreshCw,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Briefcase,
    DollarSign,
    Box,
    Layers,
    Tag,
    ChevronRight,
    Download,
    Package,
    LayoutGrid,
    SearchCode,
    Barcode,
    Database,
    ChevronDown,
    X,
    Eye,
    Printer,
    Target
} from 'lucide-react';
import './Dashboard.css';

const ItemWiseSales = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Data States
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalItems: 0,
        salesQty: 0,
        returnQty: 0,
        totalSalesQty: 0,
        salesValue: 0
    });

    // Filter States
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
        category: '',
        brand: ''
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const queryParams = new URLSearchParams({
                startDate: filters.startDate,
                endDate: filters.endDate,
                search: filters.search,
                category: filters.category,
                brand: filters.brand
            }).toString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/sales/item-detailed?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch detailed item-wise report", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.category, filters.brand, fetchReport]);

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
        if (reportData.length === 0) return;
        const headers = ["Code", "Barcode", "Item Name", "Category", "Brand", "Sales Qty", "Sales Value", "Return Qty", "Return Value", "Net Qty", "Net Value"];
        const rows = reportData.map(d => [
            d.code, d.barcode, d.name, d.category, d.brand,
            d.salesQty, d.salesValue, d.returnQty, d.returnValue, d.netQty, d.netValue
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Item_Analysis_${filters.startDate}.csv`);
        link.click();
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
                                <Package size={24} strokeWidth={2.5} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">SKU Intelligence Hub</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-[-0.04em] mb-3 uppercase">Stock Sales Matrix</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Granular item-wise performance audit across sales and return streams.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="px-4 border-r border-slate-200">
                                <ReportNavigationDropdown />
                            </div>
                            <div className="flex items-center px-6 py-3 gap-6 border-r border-slate-200">
                                <Calendar size={20} className="text-indigo-600" />
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                    <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="bg-transparent border-none outline-none w-[115px] p-0" />
                                    <span className="opacity-30">—</span>
                                    <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="bg-transparent border-none outline-none w-[115px] p-0" />
                                </div>
                            </div>
                            <button className="h-12 px-8 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200" onClick={fetchReport}>
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Run Audit
                            </button>
                        </div>
                    </div>

                    {/* Industrial Summary Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-20">
                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Box size={12} className="text-indigo-500" /> Active SKUs Traded
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.totalItems}</h4>
                            <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <TrendingUp size={12} className="text-emerald-500" /> Gross Qty Out
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.salesQty}</h4>
                            <div className="h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <TrendingDown size={12} className="text-rose-500" /> Return Vol
                            </p>
                            <h4 className="text-4xl font-black text-rose-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.returnQty}</h4>
                            <div className="h-1 w-12 bg-rose-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={12} className="text-indigo-600" /> Net Trading Vol
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.totalSalesQty}</h4>
                            <div className="h-1 w-12 bg-indigo-600 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group lg:pl-10 lg:border-l border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <DollarSign size={12} className="text-slate-900" /> Fiscal Realization
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{fmt(summary.salesValue)}</h4>
                            <div className="h-1 w-12 bg-slate-900 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>

                    {/* Filter Navigation Tool Hub */}
                    <div className="flex flex-wrap items-center justify-between gap-10 mb-10 pb-10 border-b border-slate-50">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative group max-w-xl">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Scan Matrix (SKU, Barcode, Name, Group)..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-8 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all outline-none uppercase placeholder:normal-case"
                                    value={filters.search}
                                    onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <div className="flex items-center px-4 py-3 gap-2 border-r border-slate-200">
                                    <Layers size={14} className="text-slate-400" />
                                    <select
                                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                                        value={filters.category}
                                        onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
                                    >
                                        <option value="">Group Hub</option>
                                        {[...new Set(reportData.map(d => d.category))].filter(Boolean).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center px-4 py-3 gap-2">
                                    <Tag size={14} className="text-slate-400" />
                                    <select
                                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                                        value={filters.brand}
                                        onChange={(e) => setFilters(p => ({ ...p, brand: e.target.value }))}
                                    >
                                        <option value="">Alpha Brand</option>
                                        {[...new Set(reportData.map(d => d.brand))].filter(Boolean).map(br => (
                                            <option key={br} value={br}>{br}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all flex items-center gap-3">
                                <Download size={16} /> Export XLS
                            </button>
                        </div>
                    </div>

                    {/* Detailed SKU Movement Grid */}
                    <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mb-20 animate-fadeInShort">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Registry Code</th>
                                        <th className="p-6">Commodity Detail</th>
                                        <th className="p-6 text-center bg-indigo-50/5 text-indigo-600">Gross Qty</th>
                                        <th className="p-6 text-right bg-indigo-50/10 text-indigo-600 border-r border-slate-50">Gross Value</th>
                                        <th className="p-6 text-center bg-rose-50/5 text-rose-600">Return Qty</th>
                                        <th className="p-6 text-right bg-rose-50/10 text-rose-600 border-r border-slate-50">Return Value</th>
                                        <th className="p-6 text-center bg-emerald-50/5 text-emerald-600">Net Qty</th>
                                        <th className="p-6 text-right bg-emerald-50/10 text-emerald-600">Net Realized</th>
                                        <th className="p-6 text-center bg-slate-50/50">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={15} className="p-32 text-center">
                                            <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Auditing SKU Matrix...</p>
                                        </td></tr>
                                    ) : reportData.length === 0 ? (
                                        <tr><td colSpan={15} className="p-32 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No movement detected in selected window</td></tr>
                                    ) : reportData.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50/30 group transition-all">
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg w-fit whitespace-nowrap">{d.code}</span>
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter truncate max-w-[80px]">{d.barcode}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 min-w-[200px]">
                                                <span className="text-sm font-bold text-slate-900 block tracking-tight uppercase group-hover:text-indigo-600 transition-colors mb-1">{d.name}</span>
                                                <div className="flex gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                                    <span>{d.category}</span>
                                                    <span>/</span>
                                                    <span>{d.brand}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center font-bold text-slate-900 bg-indigo-50/5 border-l border-indigo-50/30">{d.salesQty}</td>
                                            <td className="p-6 text-right font-black text-slate-900 bg-indigo-50/10 border-r border-indigo-50/30">₹{fmt(d.salesValue)}</td>

                                            <td className="p-6 text-center font-bold text-rose-400 bg-rose-50/5 border-r border-rose-50/30">{d.returnQty}</td>
                                            <td className="p-6 text-right font-black text-rose-600 bg-rose-50/10 border-r border-rose-50/30">₹{fmt(d.returnValue)}</td>

                                            <td className="p-6 text-center font-bold text-emerald-500 bg-emerald-50/5 border-r border-emerald-50/30">{d.netQty}</td>
                                            <td className="p-6 text-right font-black text-emerald-600 bg-emerald-50/10 text-base">₹{fmt(d.netValue)}</td>
                                            <td className="p-6 text-center bg-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto shadow-lg">
                                                    <Eye size={12} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fadeInShort {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ItemWiseSales;
