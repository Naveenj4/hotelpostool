import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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

const StockPage = ({ isEmbedded = false, embeddedFilter = null }) => {
    const location = useLocation();
    const activeFilter = embeddedFilter || new URLSearchParams(location.search).get('filter') || 'all';
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

    // Client-side filter based on URL param
    const filteredStockData = useMemo(() => {
        if (!stockData.length) return stockData;
        switch (activeFilter) {
            case 'negative': return stockData.filter(p => (p.closingStk || 0) < 0);
            case 'nil': return stockData.filter(p => (p.closingStk || 0) === 0);
            case 'min': return stockData.filter(p => p.min_stock != null && (p.closingStk || 0) < p.min_stock);
            case 'max': return stockData.filter(p => p.max_stock != null && (p.closingStk || 0) > p.max_stock);
            case 'moving': return stockData.filter(p => (p.stockOut || 0) > 0);
            case 'non-moving': return stockData.filter(p => (p.stockOut || 0) === 0);
            case 'transaction': return stockData.filter(p => (p.stockIn || 0) > 0 || (p.stockOut || 0) > 0);
            case 'all':
            default: return stockData;
        }
    }, [stockData, activeFilter]);

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
        if (filteredStockData.length === 0) return;
        const headers = reportType === 'NORMAL'
            ? ['CODE', 'BARCODE', 'ITEM NAME', 'CATEGORY', 'BRAND', 'CLOSING STK', 'STOCK VALUE']
            : Object.keys(selectedColumns).filter(k => selectedColumns[k]).map(k => k.toUpperCase().replace('_', ' '));

        const rows = filteredStockData.map(p => {
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

    const content = (
        <div className={`dashboard-content fade-in ${isEmbedded ? 'p-0 pb-24 pt-2 lg:px-0 lg:pb-32' : 'p-6 lg:p-14 pb-24'} max-w-[2000px] mx-auto w-full`}>
            {isEmbedded ? (
                <div className="flex items-center gap-3 bg-[#FAFAFB] px-6 py-4 border-b border-slate-100 w-full justify-between overflow-x-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 shrink-0">
                            <button className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'NORMAL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 border border-transparent hover:bg-slate-50'}`} onClick={() => setReportType('NORMAL')}>Normal</button>
                            <button className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'DETAILED' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 border border-transparent hover:bg-slate-50'}`} onClick={() => setReportType('DETAILED')}>Detailed View</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button className={`h-10 px-4 border border-transparent flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all rounded-xl ${showSettings ? 'bg-indigo-600 shadow-md shadow-indigo-200 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'}`} onClick={() => setShowSettings(!showSettings)}>
                            <Settings size={14} /> Fields
                        </button>
                        <button className="h-10 px-5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2" onClick={exportToCSV}>
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100 rounded-3xl p-3 mb-10 flex flex-col lg:flex-row lg:items-center justify-between z-20 relative animate-scaleIn">
                    <div className="flex items-center gap-4">
                        <ReportNavigationDropdown />
                        <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>
                        <div className="hidden lg:flex flex-col items-start px-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Hub</span>
                            <span className="text-xs font-bold text-slate-900 uppercase">Stock Navigation</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 lg:mt-0 lg:border-l border-slate-100 lg:pl-6">
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                            <button className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'NORMAL' ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`} onClick={() => setReportType('NORMAL')}>Normal</button>
                            <button className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'DETAILED' ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`} onClick={() => setReportType('DETAILED')}>Detailed</button>
                        </div>
                        <button className="h-10 px-6 bg-slate-900 text-white shadow-xl shadow-slate-900/10 rounded-[10px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2" onClick={exportToCSV}>
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>
            )}                    {/* Unified Summary Dashboard */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10 ${isEmbedded ? 'px-6 mt-4' : ''}`}>
                        
                        <div className="group bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-center transition-all hover:bg-white hover:shadow-md hover:-translate-y-1">
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Package size={14} /> Total Hand Stock
                            </p>
                            <h4 className="text-2xl xl:text-3xl font-black text-indigo-900 tracking-tight truncate" title={summary.totalStock.toLocaleString()}>{summary.totalStock.toLocaleString()}</h4>
                        </div>

                        <div className="group bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center transition-all hover:bg-white hover:shadow-md hover:-translate-y-1">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Activity size={14} /> Assets Valuation
                            </p>
                            <h4 className="text-2xl xl:text-3xl font-black text-emerald-700 tracking-tight truncate" title={`₹${summary.totalStockValue.toLocaleString()}`}>₹{summary.totalStockValue.toLocaleString()}</h4>
                        </div>

                        <div className="group bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center transition-all hover:bg-white hover:shadow-md hover:-translate-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <MinusCircle size={14} /> Nil Accounts
                            </p>
                            <h4 className="text-2xl xl:text-3xl font-black text-slate-700 tracking-tight truncate" title={summary.nilStock.toLocaleString()}>{summary.nilStock.toLocaleString()}</h4>
                        </div>

                        <div className="group bg-rose-50/50 p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-center transition-all hover:bg-white hover:shadow-md hover:-translate-y-1">
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ArrowDownRight size={14} /> Negative Variance
                            </p>
                            <h4 className="text-2xl xl:text-3xl font-black text-rose-700 tracking-tight truncate" title={summary.negativeStock.toLocaleString()}>{summary.negativeStock.toLocaleString()}</h4>
                        </div>

                        <div className="group bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-center transition-all hover:bg-white hover:shadow-md hover:-translate-y-1">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertTriangle size={14} /> Min Threshold
                            </p>
                            <h4 className="text-2xl xl:text-3xl font-black text-amber-700 tracking-tight truncate" title={summary.minStock.toLocaleString()}>{summary.minStock.toLocaleString()}</h4>
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
                    <div className={`flex flex-wrap items-center justify-between gap-6 mb-8 border-b border-slate-50 ${isEmbedded ? 'px-6 pb-6' : 'pb-10 mb-10'}`}>
                        <div className="flex-1 min-w-[250px] max-w-xl">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by SKU, Barcode, Name..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-6 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                    value={filters.search}
                                    onChange={handleSearchInput}
                                    onKeyDown={handleSearchSubmit}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center px-4 py-2 gap-3 border-r border-slate-200">
                                <Calendar size={16} className="text-indigo-500 shrink-0" />
                                <input 
                                    type="date" 
                                    value={filters.startDate} 
                                    onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} 
                                    className="bg-transparent border-none outline-none w-[110px] text-xs font-bold text-slate-700" 
                                />
                                <span className="opacity-30 text-slate-400 font-bold">—</span>
                                <input 
                                    type="date" 
                                    value={filters.endDate} 
                                    onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} 
                                    className="bg-transparent border-none outline-none w-[110px] text-xs font-bold text-slate-700" 
                                />
                            </div>
                            <button 
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2" 
                                onClick={fetchReport}
                                disabled={loading}
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Run Audit
                            </button>
                        </div>
                    </div>

                    {/* Inventory Registry Grid */}
                    <div className={`overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-10 animate-fadeInShort ${isEmbedded ? 'mx-6' : ''}`}>
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
                                    ) : filteredStockData.length === 0 ? (
                                        <tr><td colSpan={20} className="p-32 text-center">
                                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No operational variance detected</p>
                                        </td></tr>
                                    ) : filteredStockData.map((p, i) => (
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
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Stock Master"
                    actions={
                        <button className={`h-10 w-10 flex items-center justify-center transition-all rounded-2xl ${showSettings ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200'}`} onClick={() => setShowSettings(!showSettings)}>
                            <Settings size={16} />
                        </button>
                    }
                />
                {content}
            </main>
        </div>
    );
};

export default StockPage;
