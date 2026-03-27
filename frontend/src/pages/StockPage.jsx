import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Search,
    Package,
    AlertTriangle,
    RefreshCw,
    Download,
    FileText,
    Settings,
    Eye,
    EyeOff,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    MinusCircle,
    Activity,
    Layers,
    ChevronDown,
    Building2,
    Database,
    X,
    CheckCircle2,
    Loader2,
    Calendar
} from 'lucide-react';
import './StockPage.css';

const StockPage = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState([]);
    const [summary, setSummary] = useState({
        totalStock: 0,
        totalStockValue: 0,
        nilStock: 0,
        negativeStock: 0,
        minStock: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
        category: '',
        brand: ''
    });

    const [reportType, setReportType] = useState('NORMAL'); // NORMAL or DETAILED
    const [showSettings, setShowSettings] = useState(false);

    // Detailed column selection state
    const [selectedColumns, setSelectedColumns] = useState({
        code: true,
        barcode: true,
        name: true,
        category: true,
        brand: true,
        unit: true,
        purchase_price: true,
        cost_price: true,
        selling_price: true,
        mrp: true,
        openingStk: true,
        stockIn: true,
        stockOut: true,
        closingStk: true,
        stockValue: true
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

            const response = await fetch(`${import.meta.env.VITE_API_URL}/stock/report?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                setStockData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch stock report", err);
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

    const handleSearchInput = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter') fetchReport();
    };

    const exportToCSV = () => {
        if (stockData.length === 0) return;
        const headers = reportType === 'NORMAL'
            ? ['CODE', 'BARCODE', 'ITEM NAME', 'CATEGORY', 'BRAND', 'CLOSING STK', 'STOCK VALUE']
            : Object.keys(selectedColumns).filter(k => selectedColumns[k]).map(k => k.toUpperCase().replace('_', ' '));

        const rows = stockData.map(p => {
            if (reportType === 'NORMAL') {
                return [p.code, p.barcode, p.name, p.category, p.brand, p.closingStk, p.stockValue];
            } else {
                return Object.keys(selectedColumns).filter(k => selectedColumns[k]).map(k => p[k]);
            }
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Inventory_Audit_${filters.startDate}.csv`);
        link.click();
    };

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main overflow-hidden font-sans">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Stock Master"
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'NORMAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    onClick={() => setReportType('NORMAL')}
                                >
                                    Normal
                                </button>
                                <button
                                    className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'DETAILED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    onClick={() => setReportType('DETAILED')}
                                >
                                    Detailed
                                </button>
                            </div>
                            <button className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${showSettings ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-900'}`} onClick={() => setShowSettings(!showSettings)}>
                                <Settings size={16} />
                            </button>
                            <button className="btn-premium-primary !py-2 !px-6" onClick={exportToCSV}>
                                <Download size={16} />
                                <span className="text-[10px] uppercase font-black">Export</span>
                            </button>
                        </div>
                    }
                />
                <div className="dashboard-content fade-in p-6 lg:p-14 max-w-[2000px] mx-auto w-full">


                    {/* Industrial Summary Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-20">
                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Package size={12} className="text-indigo-500" /> Total Hand Stock
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.totalStock.toLocaleString()}</h4>
                            <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={12} className="text-emerald-500" /> Assets Valuation
                            </p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">₹{summary.totalStockValue.toLocaleString()}</h4>
                            <div className="h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MinusCircle size={12} className="text-slate-300" /> Nil Accounts
                            </p>
                            <h4 className="text-4xl font-black text-slate-400 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.nilStock}</h4>
                            <div className="h-1 w-12 bg-slate-300 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ArrowDownRight size={12} className="text-rose-500" /> Negative Variance
                            </p>
                            <h4 className="text-4xl font-black text-rose-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.negativeStock}</h4>
                            <div className="h-1 w-12 bg-rose-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div className="group lg:pl-10 lg:border-l border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle size={12} className="text-amber-500" /> Minimum Threshold
                            </p>
                            <h4 className="text-4xl font-black text-amber-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{summary.minStock}</h4>
                            <div className="h-1 w-12 bg-amber-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>

                    {/* Column Field Selection Panel */}
                    {showSettings && (
                        <div className="mb-14 p-10 bg-slate-50 border border-slate-100 rounded-[3rem] animate-scaleIn relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-900">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Audit Matrix Customization</h5>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select relevant field stream for detailed analysis</p>
                                    </div>
                                </div>
                                <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline" onClick={() => setSelectedColumns(Object.keys(selectedColumns).reduce((acc, k) => ({ ...acc, [k]: true }), {}))}>Enable All Fields</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-10">
                                {Object.keys(selectedColumns).map(col => (
                                    <label key={col} className="flex items-center gap-4 cursor-pointer group">
                                        <div
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedColumns[col] ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'border-slate-200 group-hover:border-slate-400'}`}
                                            onClick={() => setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                                        >
                                            {selectedColumns[col] && <CheckCircle2 size={12} />}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedColumns[col] ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {col.replace('_', ' ')}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter Action Tool Hub */}
                    <div className="flex flex-wrap items-center justify-between gap-10 mb-10 pb-10 border-b border-slate-50">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative group max-w-xl">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search Matrix (SKU Code, Barcode, Name, Category)..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-8 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all outline-none uppercase placeholder:normal-case"
                                    value={filters.search}
                                    onChange={handleSearchInput}
                                    onKeyDown={handleSearchSubmit}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="px-4 border-r border-slate-200">
                                <ReportNavigationDropdown />
                            </div>
                            <div className="flex items-center px-4 py-2 gap-4 border-r border-slate-200">
                                <Calendar size={18} className="text-slate-400" />
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                    <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="bg-transparent border-none outline-none w-[115px]" />
                                    <span className="opacity-30">—</span>
                                    <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="bg-transparent border-none outline-none w-[115px]" />
                                </div>
                            </div>
                            <button className="h-10 px-6 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center gap-2" onClick={fetchReport}>
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Run Audit
                            </button>
                        </div>
                    </div>

                    {/* Inventory Registry Grid */}
                    <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mb-20 animate-fadeInShort">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        {reportType === 'NORMAL' ? (
                                            <>
                                                <th className="p-6">Registry Code</th>
                                                <th className="p-6">Barcode</th>
                                                <th className="p-6">Asset Specification</th>
                                                <th className="p-6">Group Hub</th>
                                                <th className="p-6">Origin Brand</th>
                                                <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Closing Stk</th>
                                                <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Fiscal Value</th>
                                            </>
                                        ) : (
                                            <>
                                                {selectedColumns.code && <th className="p-6">Code</th>}
                                                {selectedColumns.barcode && <th className="p-6">Barcode</th>}
                                                {selectedColumns.name && <th className="p-6">Asset Name</th>}
                                                {selectedColumns.category && <th className="p-6">Group</th>}
                                                {selectedColumns.brand && <th className="p-6">Brand</th>}
                                                {selectedColumns.unit && <th className="p-6">Unit</th>}
                                                {selectedColumns.purchase_price && <th className="p-6 text-right bg-indigo-50/5">Purch Rate</th>}
                                                {selectedColumns.cost_price && <th className="p-6 text-right bg-indigo-50/5">Cost Rate</th>}
                                                {selectedColumns.selling_price && <th className="p-6 text-right bg-emerald-50/5">Sales Rate</th>}
                                                {selectedColumns.mrp && <th className="p-6 text-right bg-emerald-50/5">MRP</th>}
                                                {selectedColumns.openingStk && <th className="p-6 text-right">Opening</th>}
                                                {selectedColumns.stockIn && <th className="p-6 text-right text-emerald-600">In</th>}
                                                {selectedColumns.stockOut && <th className="p-6 text-right text-rose-600 border-r border-slate-50">Out</th>}
                                                {selectedColumns.closingStk && <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Closing</th>}
                                                {selectedColumns.stockValue && <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Value</th>}
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={20} className="p-32 text-center text-slate-300 flex-col items-center gap-4">
                                            <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Reconstructing Inventory Archive...</p>
                                        </td></tr>
                                    ) : stockData.length === 0 ? (
                                        <tr><td colSpan={20} className="p-32 text-center">
                                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No operational variance detected</p>
                                        </td></tr>
                                    ) : stockData.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/30 group transition-all">
                                            {reportType === 'NORMAL' ? (
                                                <>
                                                    <td className="p-6 text-xs font-bold text-slate-400">{p.code || '---'}</td>
                                                    <td className="p-6 text-xs font-bold text-slate-400">{p.barcode || '---'}</td>
                                                    <td className="p-6">
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-900 block tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{p.name}</span>
                                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block mt-0.5">{p.unit || 'Standard Unit'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg uppercase border border-slate-100">{p.category}</span>
                                                    </td>
                                                    <td className="p-6 text-xs font-bold text-slate-400 uppercase">{p.brand || '---'}</td>
                                                    <td className={`p-6 text-right font-black text-base bg-slate-50/20 ${p.closingStk <= 0 ? 'text-rose-500' : 'text-slate-900'}`}>{p.closingStk}</td>
                                                    <td className="p-6 text-right font-black text-base bg-slate-50/20 text-slate-900">₹{p.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </>
                                            ) : (
                                                <>
                                                    {selectedColumns.code && <td className="p-6 text-xs font-bold text-slate-400">{p.code || '---'}</td>}
                                                    {selectedColumns.barcode && <td className="p-6 text-xs font-bold text-slate-400">{p.barcode || '---'}</td>}
                                                    {selectedColumns.name && <td className="p-6 text-sm font-bold text-slate-900 uppercase">{p.name}</td>}
                                                    {selectedColumns.category && <td className="p-6 text-xs font-bold text-slate-400 uppercase">{p.category}</td>}
                                                    {selectedColumns.brand && <td className="p-6 text-xs font-bold text-slate-400 uppercase">{p.brand || '---'}</td>}
                                                    {selectedColumns.unit && <td className="p-6 text-xs font-bold text-slate-400 uppercase">{p.unit || '---'}</td>}
                                                    {selectedColumns.purchase_price && <td className="p-6 text-sm font-bold text-slate-600 text-right bg-indigo-50/5">₹{p.purchase_price}</td>}
                                                    {selectedColumns.cost_price && <td className="p-6 text-sm font-bold text-slate-600 text-right bg-indigo-50/5">₹{p.cost_price}</td>}
                                                    {selectedColumns.selling_price && <td className="p-6 text-sm font-bold text-emerald-600 text-right bg-emerald-50/5">₹{p.selling_price}</td>}
                                                    {selectedColumns.mrp && <td className="p-6 text-sm font-bold text-emerald-600 text-right bg-emerald-50/5">₹{p.mrp}</td>}
                                                    {selectedColumns.openingStk && <td className="p-6 text-sm font-bold text-slate-400 text-right">{p.openingStk}</td>}
                                                    {selectedColumns.stockIn && <td className="p-6 text-sm font-black text-emerald-600 text-right">{p.stockIn}</td>}
                                                    {selectedColumns.stockOut && <td className="p-6 text-sm font-black text-rose-600 text-right border-r border-slate-50">{p.stockOut}</td>}
                                                    {selectedColumns.closingStk && <td className={`p-6 text-right font-black text-slate-900 bg-slate-50/20 text-base ${p.closingStk <= 0 ? 'text-rose-600' : ''}`}>{p.closingStk}</td>}
                                                    {selectedColumns.stockValue && <td className="p-6 text-right font-black text-slate-900 bg-slate-50/20 text-base">₹{p.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
                                                </>
                                            )}
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
                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default StockPage;
