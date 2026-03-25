import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle, Search, Edit, CheckCircle2, XCircle, Trash2,
    Loader2, Book, AlertCircle, ChevronDown, ChevronRight,
    Target, ArrowUpRight, ArrowDownLeft, Layers, Filter,
    TrendingUp, TrendingDown, Package, Wallet, BarChart3,
    Users, Landmark, ShoppingCart, FileText
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const NATURE_CONFIG = {
    ASSETS:      { label: 'Assets',      color: '#6366f1', bg: '#eef2ff', icon: <Package size={14} />,   darkBg: 'bg-indigo-600' },
    LIABILITIES: { label: 'Liabilities', color: '#f59e0b', bg: '#fffbeb', icon: <TrendingDown size={14} />, darkBg: 'bg-amber-500' },
    INCOME:      { label: 'Income',      color: '#10b981', bg: '#d1fae5', icon: <TrendingUp size={14} />,   darkBg: 'bg-emerald-500' },
    EXPENSES:    { label: 'Expenses',    color: '#ef4444', bg: '#fee2e2', icon: <Wallet size={14} />,   darkBg: 'bg-rose-500' }
};

// Group icon mapping
const GROUP_ICONS = {
    'Bank Accounts':            <Landmark size={18} />,
    'Cash-in-Hand':             <Wallet size={18} />,
    'Sundry Debtors':           <Users size={18} />,
    'Sundry Creditors':         <Users size={18} />,
    'Sales Accounts':           <TrendingUp size={18} />,
    'Purchase Accounts':        <ShoppingCart size={18} />,
    'Direct Expenses':          <FileText size={18} />,
    'Indirect Expenses':        <FileText size={18} />,
    'Direct Incomes':           <TrendingUp size={18} />,
    'Indirect Incomes':         <TrendingUp size={18} />,
    'Duties & Taxes':           <BarChart3 size={18} />,
    'Fixed Assets':             <Package size={18} />,
    'Investments':              <TrendingUp size={18} />,
    'Capital Account':          <Layers size={18} />,
    'Reserves & Surplus':       <Layers size={18} />,
    'Loans (Liability)':        <Target size={18} />,
    'Bank OD A/c':              <Landmark size={18} />,
    'Secured Loans':            <Target size={18} />,
    'Unsecured Loans':          <Target size={18} />,
    'Provisions':               <Target size={18} />,
    'Suspense A/c':             <Target size={18} />,
    'Stock-in-Hand':            <Package size={18} />,
};

const LedgerMaster = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('ALL');
    const [filterNature, setFilterNature] = useState('ALL');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '', group: 'Indirect Expenses', opening_balance: 0, balance_type: 'DR', description: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lRes, gRes] = await Promise.all([
                fetch(`${API}/ledgers`, { headers: { Authorization: `Bearer ${getToken()}` } }),
                fetch(`${API}/ledger-groups`, { headers: { Authorization: `Bearer ${getToken()}` } })
            ]);
            const lData = await lRes.json();
            const gData = await gRes.json();
            if (lData.success) setLedgers(lData.data);
            if (gData.success) {
                setGroups(gData.data);
                // Auto-expand all groups initially
                const expanded = {};
                gData.data.forEach(g => { expanded[g.name] = true; });
                setExpandedGroups(expanded);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Filtered ledgers
    const filteredLedgers = useMemo(() => ledgers.filter(l => {
        const nm = l?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   l?.group?.toLowerCase().includes(searchTerm.toLowerCase());
        const grp = filterGroup === 'ALL' || l?.group === filterGroup;
        const nt = filterNature === 'ALL' || (() => {
            const grpObj = groups.find(g => g.name === l?.group);
            return grpObj?.nature === filterNature;
        })();
        return nm && grp && nt;
    }), [ledgers, searchTerm, filterGroup, filterNature, groups]);

    // Group ledgers by group name
    const ledgersByGroup = useMemo(() => {
        const map = {};
        filteredLedgers.forEach(l => {
            if (!map[l.group]) map[l.group] = [];
            map[l.group].push(l);
        });
        return map;
    }, [filteredLedgers]);

    // Get nature-ordered groups
    const groupsByNature = useMemo(() => {
        const order = ['ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'];
        const result = {};
        order.forEach(n => {
            result[n] = groups.filter(g => g.nature === n && ledgersByGroup[g.name]?.length > 0);
        });
        return result;
    }, [groups, ledgersByGroup]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const url = isEditing ? `${API}/ledgers/${formData._id}` : `${API}/ledgers`;
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error || result.message);
            fetchData();
            setShowDrawer(false);
            resetForm();
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    const handleToggleStatus = async (ledger) => {
        try {
            await fetch(`${API}/ledgers/${ledger._id}/toggle-status`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (ledger) => {
        if (!window.confirm(`Delete ledger "${ledger.name}"?`)) return;
        try {
            const res = await fetch(`${API}/ledgers/${ledger._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const result = await res.json();
            if (result.success) fetchData();
            else alert(result.error || result.message);
        } catch (err) { console.error(err); }
    };

    const handleEdit = (ledger) => {
        setFormData(ledger);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', group: 'Indirect Expenses', opening_balance: 0, balance_type: 'DR', description: '' });
        setIsEditing(false);
        setError('');
    };

    const toggleGroupExpand = (groupName) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const getNatureForGroup = (groupName) => {
        return groups.find(g => g.name === groupName)?.nature || 'ASSETS';
    };

    // Summary stats
    const stats = useMemo(() => {
        const total = ledgers.length;
        const active = ledgers.filter(l => l.is_active).length;
        const totalBalance = ledgers.reduce((sum, l) => {
            return sum + (l.balance_type === 'DR' ? l.opening_balance : -l.opening_balance);
        }, 0);
        return { total, active, inactive: total - active, totalBalance };
    }, [ledgers]);

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Ledger Master"
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                className="btn-premium-primary !py-2 !px-4 !bg-slate-100 !text-slate-700 hover:!bg-slate-200"
                                onClick={() => navigate('/dashboard/self-service/group-master')}
                            >
                                <Layers size={16} />
                                <span className="text-[10px] uppercase font-black">Groups</span>
                            </button>
                            <button
                                className="btn-premium-primary !py-2 !px-4 !bg-slate-100 !text-slate-700 hover:!bg-slate-200"
                                onClick={() => navigate('/dashboard/self-service/ledgers/create')}
                            >
                                <Users size={16} />
                                <span className="text-[10px] uppercase font-black">Party/Ledger</span>
                            </button>
                            <button className="btn-premium-primary !py-2 !px-6" onClick={() => { resetForm(); setShowDrawer(true); }}>
                                <PlusCircle size={18} />
                                <span className="text-[10px] uppercase font-black">Add Ledger</span>
                            </button>
                        </div>
                    }
                />

                <div className="master-content-layout fade-in p-6 lg:p-10 max-w-[1600px] mx-auto w-full">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bento-card p-6">
                            <div className="text-3xl font-black text-slate-900 mb-1">{stats.total}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ledgers</div>
                        </div>
                        <div className="bento-card p-6">
                            <div className="text-3xl font-black text-emerald-600 mb-1">{stats.active}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</div>
                        </div>
                        <div className="bento-card p-6">
                            <div className="text-3xl font-black text-slate-400 mb-1">{stats.inactive}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inactive</div>
                        </div>
                        <div className="bento-card p-6">
                            <div className="text-2xl font-black text-indigo-600 mb-1">
                                ₹{Math.abs(stats.totalBalance).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Balance</div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="bento-card p-4 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                <input type="text" placeholder="Search ledgers by name or group..."
                                    className="input-premium-modern !pl-14 w-full" value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mr-1">Nature:</span>
                                {['ALL', 'ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'].map(n => (
                                    <button key={n} onClick={() => setFilterNature(n)}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterNature === n ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ledger Tree View by Nature → Group */}
                    {loading ? (
                        <div className="bento-card p-32 text-center">
                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-6" size={48} />
                            <p className="font-black text-slate-300 uppercase tracking-[0.3em] text-xs">Loading Ledgers...</p>
                        </div>
                    ) : filteredLedgers.length === 0 ? (
                        <div className="bento-card p-32 text-center opacity-40">
                            <Book size={80} className="mx-auto mb-8 text-indigo-100" />
                            <p className="font-black uppercase tracking-[0.4em] text-sm">No Ledgers Found</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupsByNature).map(([nature, grpList]) => {
                                if (grpList.length === 0) return null;
                                const cfg = NATURE_CONFIG[nature];
                                return (
                                    <div key={nature}>
                                        {/* Nature Header */}
                                        <div className="flex items-center gap-3 mb-4 px-2">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ background: cfg.bg, color: cfg.color }}>
                                                {cfg.icon}
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-[0.2em]"
                                                style={{ color: cfg.color }}>{cfg.label}</span>
                                            <div className="flex-1 h-px" style={{ background: `${cfg.color}20` }}></div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                {grpList.reduce((s, g) => s + (ledgersByGroup[g.name]?.length || 0), 0)} accounts
                                            </span>
                                        </div>

                                        {/* Groups */}
                                        <div className="space-y-3">
                                            {grpList.map(grp => {
                                                const grpLedgers = ledgersByGroup[grp.name] || [];
                                                const isExpanded = expandedGroups[grp.name] !== false;
                                                const grpTotal = grpLedgers.reduce((s, l) => s + (l.opening_balance || 0), 0);

                                                return (
                                                    <div key={grp._id} className="bento-card overflow-hidden p-0">
                                                        {/* Group Header */}
                                                        <button
                                                            className="w-full flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors text-left"
                                                            onClick={() => toggleGroupExpand(grp.name)}
                                                        >
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                                style={{ background: cfg.bg, color: cfg.color }}>
                                                                {GROUP_ICONS[grp.name] || <Layers size={18} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-black text-slate-900 text-base">{grp.name}</div>
                                                                {grp.parent && <div className="text-[10px] text-slate-400 font-bold">under {grp.parent}</div>}
                                                            </div>
                                                            <div className="text-right mr-4 flex-shrink-0">
                                                                <div className="text-base font-black text-slate-700">₹{grpTotal.toLocaleString('en-IN')}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">{grpLedgers.length} ledger{grpLedgers.length !== 1 ? 's' : ''}</div>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                                            </div>
                                                        </button>

                                                        {/* Ledger rows */}
                                                        {isExpanded && grpLedgers.length > 0 && (
                                                            <div className="border-t border-slate-50">
                                                                <table className="w-full">
                                                                    <tbody>
                                                                        {grpLedgers.map((ledger, idx) => (
                                                                            <tr key={ledger._id}
                                                                                className={`group/lrow transition-colors hover:bg-slate-50/50 ${idx < grpLedgers.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                                                                <td className="pl-16 pr-6 py-4">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 transition-all group-hover/lrow:bg-indigo-100 group-hover/lrow:text-indigo-600">
                                                                                            <Target size={14} />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="font-black text-slate-800 text-sm">{ledger.name}</div>
                                                                                            {(ledger.phone || ledger.gstin) && (
                                                                                                <div className="text-[10px] text-slate-400">
                                                                                                    {ledger.phone && <span>{ledger.phone}</span>}
                                                                                                    {ledger.gstin && <span className="ml-2 font-mono">{ledger.gstin}</span>}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ledger?.balance_type === 'DR' ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'}`}>
                                                                                            {ledger?.balance_type === 'DR' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-sm font-black text-slate-700">₹{(ledger?.opening_balance || 0).toLocaleString('en-IN')}</div>
                                                                                            <div className={`text-[9px] font-black uppercase ${ledger?.balance_type === 'DR' ? 'text-indigo-400' : 'text-rose-400'}`}>
                                                                                                {ledger?.balance_type === 'DR' ? 'DR' : 'CR'}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-4">
                                                                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${ledger.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                                        {ledger.is_active ? 'Active' : 'Inactive'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="pr-6 py-4 text-right">
                                                                                    <div className="flex justify-end gap-2 opacity-0 group-hover/lrow:opacity-100 transition-opacity">
                                                                                        <button onClick={() => handleEdit(ledger)}
                                                                                            className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all">
                                                                                            <Edit size={13} />
                                                                                        </button>
                                                                                        <button onClick={() => handleToggleStatus(ledger)}
                                                                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${ledger.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                                                                                            {ledger.is_active ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                                                                                        </button>
                                                                                        <button onClick={() => handleDelete(ledger)}
                                                                                            className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                                                                            <Trash2 size={13} />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick-Add Ledger Drawer */}
                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[1000] flex flex-col">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                            <Book size={20} />
                                        </div>
                                        <span className="metric-pill-modern">{isEditing ? 'EDIT LEDGER' : 'NEW LEDGER'}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {isEditing ? 'Modify Ledger Account' : 'Create Ledger Account'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-[0.2em]">
                                        For detailed party ledgers, use <button onClick={() => { setShowDrawer(false); navigate('/dashboard/self-service/ledgers/create'); }} className="text-indigo-500 underline">Party/Ledger Creation</button>
                                    </p>
                                </div>
                                <button onClick={() => setShowDrawer(false)}
                                    className="w-12 h-12 rounded-2xl hover:bg-white hover:text-rose-500 flex items-center justify-center transition-all bg-slate-100 text-slate-400">
                                    <XCircle size={28} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="ledger-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Name */}
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Account Name *</label>
                                        <input required className="input-premium-modern w-full font-bold text-lg"
                                            placeholder="e.g. Petty Cash, HDFC Bank Account..."
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>

                                    {/* Group */}
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Ledger Group *</label>
                                        <div className="relative">
                                            <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                            <select
                                                required
                                                className="input-premium-modern !pl-12 w-full appearance-none cursor-pointer"
                                                value={formData.group}
                                                onChange={e => setFormData({ ...formData, group: e.target.value })}
                                            >
                                                {['ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'].map(nature => {
                                                    const grpsForNature = groups.filter(g => g.nature === nature);
                                                    if (grpsForNature.length === 0) return null;
                                                    return (
                                                        <optgroup key={nature} label={`── ${NATURE_CONFIG[nature]?.label} ──`}>
                                                            {grpsForNature.map(g => (
                                                                <option key={g._id} value={g.name}>{g.parent ? `  └ ${g.name}` : g.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    );
                                                })}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                        {/* Nature badge */}
                                        {formData.group && (() => {
                                            const g = groups.find(x => x.name === formData.group);
                                            if (!g) return null;
                                            const cfg = NATURE_CONFIG[g.nature];
                                            return (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg"
                                                        style={{ background: cfg?.bg, color: cfg?.color }}>
                                                        {cfg?.label}
                                                    </span>
                                                    {g.parent && <span className="text-[10px] text-slate-400">under {g.parent}</span>}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Balance */}
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 block">Opening Balance</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" className="input-premium-modern !pl-9 w-full text-center text-xl font-black bg-white"
                                                    value={formData.opening_balance}
                                                    onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                                                {['DR', 'CR'].map(type => (
                                                    <button key={type} type="button"
                                                        onClick={() => setFormData({ ...formData, balance_type: type })}
                                                        className={`flex-1 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${formData.balance_type === type ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                                                        {type === 'DR' ? 'Debit' : 'Credit'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Description</label>
                                        <textarea className="input-premium-modern w-full !h-24 !pt-4"
                                            placeholder="Optional notes..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                </form>
                            </div>
                            <div className="p-8 border-t border-slate-50 flex gap-4 bg-white">
                                <button type="submit" form="ledger-form" disabled={submitting}
                                    className="btn-glow bg-slate-900 text-white flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> {isEditing ? 'Save Changes' : 'Create Ledger'}</>}
                                </button>
                                <button onClick={() => setShowDrawer(false)}
                                    className="w-16 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all">
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default LedgerMaster;
