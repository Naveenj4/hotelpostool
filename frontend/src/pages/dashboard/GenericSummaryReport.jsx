import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Calendar, RefreshCw, Loader2, Download, Database,
    TrendingUp, FileText, AlertCircle, Search
} from 'lucide-react';

// ─── Smart column detection ────────────────────────────────────────────────────
// Looks at the first data row and decides which columns to render + how to style them.
const detectColumns = (rows) => {
    if (!rows || rows.length === 0) return [];
    const s = rows[0]; // sample row
    const k = Object.keys(s);

    // ── Item-wise sales (has salesQty + netValue)
    if (k.includes('salesQty') && k.includes('netValue')) return [
        { key: 'code',        label: 'Code',         type: 'badge' },
        { key: 'name',        label: 'Item Name',    type: 'primary' },
        { key: 'category',    label: 'Group',        type: 'tag' },
        { key: 'brand',       label: 'Brand',        type: 'text' },
        { key: 'salesQty',    label: 'Sold Qty',     type: 'num-center' },
        { key: 'salesValue',  label: 'Gross Value',  type: 'amt' },
        { key: 'returnQty',   label: 'Return Qty',   type: 'num-danger' },
        { key: 'returnValue', label: 'Return Value', type: 'amt-danger' },
        { key: 'netQty',      label: 'Net Qty',      type: 'num-success' },
        { key: 'netValue',    label: 'Net Value',    type: 'amt-success' },
    ];

    // ── Day-wise sales (has date + cash + card)
    if (k.includes('date') && k.includes('cash') && k.includes('card')) return [
        { key: 'date',      label: 'Date',   type: 'primary' },
        { key: 'billCount', label: 'Bills',  type: 'num-center' },
        { key: 'cash',      label: 'Cash',   type: 'amt-success' },
        { key: 'card',      label: 'Card',   type: 'amt' },
        { key: 'upi',       label: 'UPI',    type: 'amt' },
        { key: 'credit',    label: 'Credit', type: 'amt-danger' },
        { key: 'total',     label: 'Total',  type: 'amt-primary' },
    ];

    // ── Month-wise (has month + totalSales)
    if (k.includes('month') && k.includes('totalSales')) return [
        { key: 'month',      label: 'Month',     type: 'primary' },
        { key: 'billCount',  label: 'Documents', type: 'num-center' },
        { key: 'totalSales', label: 'Revenue',   type: 'amt-primary' },
    ];

    // ── Outstanding (has balance + name)
    if (k.includes('balance') && k.includes('name')) return [
        { key: 'name',    label: 'Party Name', type: 'primary' },
        { key: 'phone',   label: 'Contact',    type: 'text' },
        { key: 'balance', label: 'Outstanding',type: 'amt-danger' },
    ];

    // ── Aging / receivable-payable (has agingBucket or daysOverdue)
    if (k.includes('agingBucket') || k.includes('daysOverdue')) return [
        { key: 'name',        label: 'Party',       type: 'primary' },
        { key: 'agingBucket', label: 'Aging Bucket',type: 'tag' },
        { key: 'daysOverdue', label: 'Days Due',     type: 'num-center' },
        { key: 'balance',     label: 'Balance',      type: 'amt-danger' },
    ];

    // ── Purchase day-wise (has purchaseDate or purchaseCount)
    if (k.includes('purchaseDate') || (k.includes('date') && k.includes('totalAmount'))) return [
        { key: k.includes('purchaseDate') ? 'purchaseDate' : 'date', label: 'Date', type: 'primary' },
        { key: 'billCount',   label: 'Invoices',       type: 'num-center' },
        { key: 'totalAmount', label: 'Total Purchase', type: 'amt-primary' },
    ];

    // ── Generic group-by (brand/captain/supplier/category + amount)
    const nameKey = k.find(x => ['name', 'brand', 'captain', 'category', 'supplier', 'group', 'item'].includes(x));
    const qtyKey  = k.find(x => ['count', 'qty', 'itemCount', 'billCount', 'transactionCount'].includes(x));
    const amtKey  = k.find(x => ['amount', 'totalSales', 'total_amount', 'totalAmount', 'netSales', 'grandTotal'].includes(x));

    return [
        nameKey ? { key: nameKey, label: 'Classification', type: 'primary' } : null,
        qtyKey  ? { key: qtyKey,  label: 'Volume',         type: 'num-center' } : null,
        amtKey  ? { key: amtKey,  label: 'Amount',         type: 'amt-primary' } : null,
    ].filter(Boolean);
};

// ─── Column cell renderer ─────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const renderCell = (row, col) => {
    const val = row[col.key];
    switch (col.type) {
        case 'primary':
            return <span className="font-bold text-slate-900 uppercase tracking-tight">{val ?? '—'}</span>;
        case 'text':
            return <span className="text-slate-500 font-medium">{val || '—'}</span>;
        case 'badge':
            return val ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">{val}</span> : <span className="text-slate-300">—</span>;
        case 'tag':
            return val ? <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase border border-slate-200">{val}</span> : <span className="text-slate-300">—</span>;
        case 'num-center':
            return <span className="font-bold text-slate-900">{val ?? 0}</span>;
        case 'num-danger':
            return <span className="font-bold text-rose-500">{val ?? 0}</span>;
        case 'num-success':
            return <span className="font-bold text-emerald-600">{val ?? 0}</span>;
        case 'amt':
            return <span className="font-black text-slate-900">₹{fmt(val)}</span>;
        case 'amt-primary':
            return <span className="font-black text-indigo-600">₹{fmt(val)}</span>;
        case 'amt-success':
            return <span className="font-black text-emerald-600">₹{fmt(val)}</span>;
        case 'amt-danger':
            return <span className="font-black text-rose-600">₹{fmt(val)}</span>;
        default:
            return <span className="text-slate-600">{val ?? '—'}</span>;
    }
};

const cellAlign = (type) => {
    if (type.startsWith('amt') || type.startsWith('num')) return 'text-right';
    if (type === 'num-center') return 'text-center';
    return 'text-left';
};

// ─── Compute summary stats from data ─────────────────────────────────────────
const computeSummary = (rows, cols) => {
    if (!rows.length) return [];
    const amtCols = cols.filter(c => c.type.startsWith('amt'));
    const numCols = cols.filter(c => c.type.startsWith('num'));

    const stats = [{ label: 'Total Records', value: rows.length.toLocaleString(), color: 'indigo' }];

    numCols.slice(0, 1).forEach(c => {
        const total = rows.reduce((s, r) => s + (r[c.key] || 0), 0);
        stats.push({ label: c.label, value: total.toLocaleString(), color: 'slate' });
    });

    amtCols.slice(0, 2).forEach(c => {
        const total = rows.reduce((s, r) => s + (r[c.key] || 0), 0);
        const colorMap = { 'amt-primary': 'indigo', 'amt-success': 'emerald', 'amt-danger': 'rose', 'amt': 'slate' };
        stats.push({ label: c.label, value: `₹${fmt(total)}`, color: colorMap[c.type] || 'slate' });
    });

    return stats;
};

const STAT_COLORS = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const GenericSummaryReport = ({ title, subtitle, endpoint, groupBy, isEmbedded = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);
    const [data, setData]     = useState([]);
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end:   new Date().toISOString().split('T')[0],
    });

    // Build URL — handle endpoints that already contain a `?`
    const buildUrl = useCallback(() => {
        const base = import.meta.env.VITE_API_URL;
        const sep  = endpoint.includes('?') ? '&' : '?';
        let url = `${base}${endpoint}${sep}startDate=${dateRange.start}&endDate=${dateRange.end}`;
        if (groupBy) url += `&groupBy=${groupBy}`;
        return url;
    }, [endpoint, groupBy, dateRange]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const saved = localStorage.getItem('user');
            if (!saved) { setLoading(false); return; }
            const { token } = JSON.parse(saved);
            const res    = await fetch(buildUrl(), { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (result.success) {
                // Some endpoints wrap data in a nested key (e.g. monthlyBreakdown)
                const raw = result.data;
                setData(
                    Array.isArray(raw) ? raw :
                    raw?.monthlyBreakdown ?? raw?.items ?? raw?.records ?? []
                );
            } else {
                setError(result.message || 'Failed to load report data.');
            }
        } catch (e) {
            console.error('[GenericSummaryReport]', e);
            setError('Network error — could not reach the server.');
        } finally {
            setLoading(false);
        }
    }, [buildUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(p => !p);
        else {
            const n = !isCollapsed;
            setIsCollapsed(n);
            localStorage.setItem('sidebarCollapsed', n);
        }
    };

    // Detect columns from first data row
    const columns = detectColumns(data);

    // Client-side search across all string values
    const filteredData = search.trim()
        ? data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
        : data;

    const summary = computeSummary(filteredData, columns);

    // CSV export
    const exportCSV = () => {
        if (!filteredData.length || !columns.length) return;
        const headers = columns.map(c => c.label);
        const rows    = filteredData.map(row => columns.map(c => {
            const v = row[c.key];
            return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
        }));
        const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${title.replace(/\s+/g, '_')}_${dateRange.start}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Content ───────────────────────────────────────────────────────────────
    const content = (
        <div className={`w-full ${isEmbedded ? 'p-0 pb-32' : 'p-6 lg:p-10 pb-24'}`}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 ${isEmbedded ? 'p-6 pb-0' : 'mb-8'}`}>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.18em] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                            Live Report
                        </span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">{title}</h2>
                    {subtitle && <p className="text-slate-400 font-medium text-sm mt-1">{subtitle}</p>}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 px-4 py-2 border-r border-slate-200">
                        <Calendar size={16} className="text-indigo-500 shrink-0" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                            className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-[120px]"
                        />
                        <span className="text-slate-300 font-bold">—</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                            className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-[120px]"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-60 shadow-lg shadow-indigo-200"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={!filteredData.length}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all disabled:opacity-40"
                    >
                        <Download size={13} />
                        Export
                    </button>
                </div>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            {!loading && !error && summary.length > 0 && (
                <div className={`grid gap-4 ${isEmbedded ? 'px-6 py-5' : 'mb-8'}`}
                     style={{ gridTemplateColumns: `repeat(${Math.min(summary.length, 4)}, minmax(0,1fr))` }}>
                    {summary.map((stat, i) => (
                        <div key={i} className={`rounded-2xl border p-5 ${STAT_COLORS[stat.color]} transition-transform hover:-translate-y-0.5`}>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-2">{stat.label}</p>
                            <p className="text-2xl font-black tracking-tight leading-none">{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Search bar ─────────────────────────────────────────────── */}
            {!loading && !error && data.length > 0 && (
                <div className={`relative mb-4 ${isEmbedded ? 'px-6' : ''}`}>
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Search within results…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
                    />
                </div>
            )}

            {/* ── Table area ─────────────────────────────────────────────── */}
            <div className={`${isEmbedded ? 'px-6 pb-6' : ''}`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">
                            Fetching Report Data…
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 bg-rose-50/50 rounded-3xl border border-rose-100">
                        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center">
                            <AlertCircle size={26} className="text-rose-500" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-slate-800 mb-1">Unable to Load Report</p>
                            <p className="text-sm text-slate-400 max-w-xs">{error}</p>
                        </div>
                        <button onClick={fetchData} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all">
                            Retry
                        </button>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 gap-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <Database size={24} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs mb-1">
                                {search ? 'No Matching Records' : 'No Data Found'}
                            </p>
                            <p className="text-xs text-slate-300">
                                {search ? 'Try a different search term' : 'Try changing the date range and refreshing'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-slate-100">
                                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-10">#</th>
                                        {columns.map(col => (
                                            <th
                                                key={col.key}
                                                className={`p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${
                                                    col.type.startsWith('amt') ? 'text-right' :
                                                    col.type === 'num-center' ? 'text-center' : 'text-left'
                                                }`}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredData.map((row, i) => (
                                        <tr key={i} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="p-5 text-[10px] font-bold text-slate-300">{i + 1}</td>
                                            {columns.map(col => (
                                                <td
                                                    key={col.key}
                                                    className={`p-5 text-sm ${
                                                        col.type.startsWith('amt') ? 'text-right' :
                                                        col.type.includes('center') ? 'text-center' : 'text-left'
                                                    }`}
                                                >
                                                    {renderCell(row, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Footer totals for amount columns */}
                                {columns.some(c => c.type.startsWith('amt')) && (
                                    <tfoot>
                                        <tr className="bg-slate-900 text-white">
                                            <td className="p-5" />
                                            {columns.map(col => {
                                                if (col.type.startsWith('amt')) {
                                                    const total = filteredData.reduce((s, r) => s + (r[col.key] || 0), 0);
                                                    return (
                                                        <td key={col.key} className="p-5 text-right font-black text-sm text-white">
                                                            ₹{fmt(total)}
                                                        </td>
                                                    );
                                                }
                                                if (col.type.startsWith('num')) {
                                                    const total = filteredData.reduce((s, r) => s + (r[col.key] || 0), 0);
                                                    return (
                                                        <td key={col.key} className="p-5 text-center font-black text-sm text-white">
                                                            {total.toLocaleString()}
                                                        </td>
                                                    );
                                                }
                                                if (col === columns.find(c => !c.type.startsWith('amt') && !c.type.startsWith('num'))) {
                                                    return (
                                                        <td key={col.key} className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            TOTAL ({filteredData.length} rows)
                                                        </td>
                                                    );
                                                }
                                                return <td key={col.key} className="p-5" />;
                                            })}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Row count bar */}
                        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-50 bg-[#FAFAFB]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {search && filteredData.length !== data.length
                                    ? `Showing ${filteredData.length} of ${data.length} records`
                                    : `${filteredData.length} Records`}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <FileText size={12} />
                                {title}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (isEmbedded) return content;

    return (
        <div className="dashboard-layout bg-[#F8FAFC]">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />
            )}
            <main className="dashboard-main overflow-hidden font-sans flex flex-col">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content p-6 lg:p-10 max-w-[2000px] mx-auto w-full">
                    <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3 mb-6 flex items-center gap-4">
                        <ReportNavigationDropdown />
                    </div>
                    {content}
                </div>
            </main>
        </div>
    );
};

export default GenericSummaryReport;
