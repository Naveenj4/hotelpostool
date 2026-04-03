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
    Settings,
    Database,
    ChevronDown,
    Landmark,
    Building2,
    Eye,
    X,
    FileText,
    Printer,
    Target
} from 'lucide-react';
import './Dashboard.css';

const SalesProfit = ({ isEmbedded = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalSales: 0,
        return: 0,
        salesProfit: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        groupBy: 'BILL' // BILL, ITEM, CATEGORY, BRAND
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
                groupBy: filters.groupBy
            }).toString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/sales-profit?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch sales profit report", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.groupBy, fetchReport]);

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
        const headers = ["Trans No", "Date", "Party", "Item", "Category", "Brand", "Revenue", "Cost Basis", "Sales Basis", "Profit", "Margin %"];
        const rows = reportData.map(row => [
            row.transaction_no,
            row.date === "---" ? "---" : new Date(row.date).toLocaleDateString(),
            row.party_name,
            row.item_name,
            row.category,
            row.brand,
            row.bill_amount,
            row.cost_rate,
            row.sales_rate,
            row.profit_amt,
            row.profit_pct
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Profit_Audit_${filters.startDate}.csv`);
        link.click();
    };

    const content = (
        <div className={`dashboard-content fade-in ${isEmbedded ? 'p-0 pb-32' : 'p-6 lg:p-14 pb-24'} max-w-[2000px] mx-auto w-full`}>

            {/* Industrial Header */}
            <div className={`flex flex-col xl:flex-row justify-between items-end xl:items-center ${isEmbedded ? 'mb-8 border-b border-slate-50 pb-6' : 'mb-16 border-b border-slate-100 pb-10'} gap-8`}>
                <div>
                    <div className="flex items-center gap-2 mb-4 text-[#101828]">
                        <Target size={24} strokeWidth={2.5} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Profitability Audit Engine</span>
                    </div>
                    <h2 className={`${isEmbedded ? 'text-3xl' : 'text-5xl'} font-black text-slate-900 tracking-[-0.04em] mb-3 uppercase`}>Margin Intelligence</h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">Advanced yield analysis across multi-stream revenue hierarchies.</p>
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
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-10 ${isEmbedded ? 'mb-10' : 'mb-20'}`}>
                <div className="group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp size={12} className="text-indigo-500" /> Gross Generated Revenue
                    </p>
                    <h4 className={`${isEmbedded ? 'text-2xl' : 'text-4xl'} font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform`}>₹{fmt(summary.totalSales)}</h4>
                    <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className="group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingDown size={12} className="text-rose-500" /> Sales Return / Variance
                    </p>
                    <h4 className={`${isEmbedded ? 'text-2xl' : 'text-4xl'} font-black text-rose-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform`}>₹{fmt(summary.return)}</h4>
                    <div className="h-1 w-12 bg-rose-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className={`group ${isEmbedded ? '' : 'lg:pl-10 lg:border-l border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={12} className="text-emerald-500" /> Net Fiscal Yield (Profit)
                    </p>
                    <h4 className={`${isEmbedded ? 'text-2xl' : 'text-4xl'} font-black text-emerald-600 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform`}>₹{fmt(summary.salesProfit)}</h4>
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-2">{summary.totalSales === 0 ? 0 : ((summary.salesProfit / summary.totalSales) * 100).toFixed(2)}% Operational Margin</div>
                </div>
            </div>

            {/* Breakdown Tool Hub */}
            <div className={`flex flex-wrap items-center justify-between gap-10 ${isEmbedded ? 'mb-6 pb-6' : 'mb-10 pb-10'} border-b border-slate-50`}>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-300" />
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm ml-4">
                        {[
                            { id: 'BILL', label: 'By Bill', icon: <Briefcase size={12} /> },
                            { id: 'ITEM', label: 'By SKU', icon: <Box size={12} /> },
                            { id: 'CATEGORY', label: 'By Group', icon: <Layers size={12} /> },
                            { id: 'BRAND', label: 'By Alpha', icon: <Tag size={12} /> }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setFilters(p => ({ ...p, groupBy: mode.id }))}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${filters.groupBy === mode.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {mode.icon} {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={exportToCSV} className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all flex items-center gap-3">
                        <Download size={16} /> Export Audit
                    </button>
                    <button onClick={() => window.print()} className="h-12 px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-200">
                        <Printer size={16} /> Print Manifest
                    </button>
                </div>
            </div>

            {/* Precision Profitability Grid */}
            <div className={`overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm ${isEmbedded ? 'mb-6' : 'mb-20'} animate-fadeInShort`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#FAFAFB] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-6">Trans ID</th>
                                <th className="p-6">Date</th>
                                <th className="p-6">Manifest / Party</th>
                                <th className="p-6">Commodity (SKU)</th>
                                <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Revenue (Bill)</th>
                                <th className="p-6 text-right">Cost Basis</th>
                                <th className="p-6 text-right border-r border-slate-50">Sales Basis</th>
                                <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Fiscal Yield (Profit)</th>
                                <th className="p-6 text-center bg-slate-50/50">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={15} className="p-32 text-center">
                                    <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Calculating Fiscal Margins...</p>
                                </td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan={15} className="p-32 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No operational transactions logged</td></tr>
                            ) : reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/30 group transition-all">
                                    <td className="p-6 text-[10px] font-black text-indigo-400 bg-indigo-50/20">{row.transaction_no}</td>
                                    <td className="p-6 text-xs font-bold text-slate-400">{row.date === "---" ? "---" : new Date(row.date).toLocaleDateString('en-GB')}</td>
                                    <td className="p-6">
                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.party_name}</span>
                                    </td>
                                    <td className="p-6">
                                        <div>
                                            <span className="text-sm font-bold text-slate-900 block tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{row.item_name}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{row.category}</span>
                                                <span className="text-[9px] font-black text-slate-300 uppercase opacity-50">•</span>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{row.brand}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right font-black text-base bg-slate-50/20 text-slate-900">₹{fmt(row.bill_amount)}</td>
                                    <td className="p-6 text-right text-xs font-bold text-slate-400">₹{row.cost_rate === 0 ? "---" : fmt(row.cost_rate)}</td>
                                    <td className="p-6 text-right text-xs font-bold text-slate-400 border-r border-slate-50">₹{row.sales_rate === 0 ? "---" : fmt(row.sales_rate)}</td>
                                    <td className="p-6 text-right bg-slate-50/30">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-base font-black ${row.profit_amt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{fmt(row.profit_amt)}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${row.profit_amt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{row.profit_pct}% Margin</span>
                                        </div>
                                    </td>
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

export default SalesProfit;

