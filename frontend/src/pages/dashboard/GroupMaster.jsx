import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle, Search, Edit, Trash2, Loader2, AlertCircle,
    XCircle, CheckCircle2, Layers, ChevronDown, Info,
    TrendingUp, TrendingDown, Package, Wallet, Triangle
} from 'lucide-react';

const NATURE_CONFIG = {
    ASSETS:      { label: 'Assets',      color: '#6366f1', bg: '#eef2ff', icon: <Package size={14} /> },
    LIABILITIES: { label: 'Liabilities', color: '#f59e0b', bg: '#fffbeb', icon: <TrendingDown size={14} /> },
    INCOME:      { label: 'Income',      color: '#10b981', bg: '#d1fae5', icon: <TrendingUp size={14} /> },
    EXPENSES:    { label: 'Expenses',    color: '#ef4444', bg: '#fee2e2', icon: <Wallet size={14} /> }
};

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const GroupMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterNature, setFilterNature] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '', parent: '', nature: 'ASSETS', description: ''
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/ledger-groups`, { headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) setGroups(data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchGroups(); }, []);

    const resetForm = () => {
        setFormData({ name: '', parent: '', nature: 'ASSETS', description: '' });
        setIsEditing(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const url = isEditing ? `${API}/ledger-groups/${formData._id}` : `${API}/ledger-groups`;
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error || result.message);
            fetchGroups();
            setShowDrawer(false);
            resetForm();
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (group) => {
        if (group.is_system) return alert('System groups cannot be deleted.');
        if (!window.confirm(`Delete group "${group.name}"?`)) return;
        try {
            const res = await fetch(`${API}/ledger-groups/${group._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) fetchGroups();
            else alert(data.error);
        } catch (err) { alert('Error deleting.'); }
    };

    const handleEdit = (group) => {
        setFormData({ ...group });
        setIsEditing(true);
        setShowDrawer(true);
    };

    // Build grouped structure for display
    const primaryGroups = groups.filter(g => !g.parent);
    const filteredGroups = groups.filter(g => {
        const nm = g.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const nt = filterNature === 'ALL' || g.nature === filterNature;
        return nm && nt;
    });

    // Group by nature for the summary cards
    const natureCounts = groups.reduce((acc, g) => {
        acc[g.nature] = (acc[g.nature] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Group Master"
                    actions={
                        <button className="btn-premium-primary !py-2 !px-6" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} />
                            <span className="text-[10px] uppercase font-black">New Group</span>
                        </button>
                    }
                />

                <div className="master-content-layout fade-in p-6 lg:p-10 max-w-[1600px] mx-auto w-full">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {Object.entries(NATURE_CONFIG).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => setFilterNature(filterNature === key ? 'ALL' : key)}
                                className={`bento-card p-6 text-left transition-all border-2 ${filterNature === key ? 'border-slate-900' : 'border-transparent'}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                                        style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.icon}
                                    </div>
                                    <span className="text-3xl font-black text-slate-900">{natureCounts[key] || 0}</span>
                                </div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{cfg.label}</div>
                                <div className="text-[10px] text-slate-300 mt-1">Groups configured</div>
                            </button>
                        ))}
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bento-card p-4">
                        <div className="relative flex-1 group">
                            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input type="text" placeholder="Search groups..." className="input-premium-modern !pl-14 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3">
                            {['ALL', 'ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'].map(n => (
                                <button key={n} onClick={() => setFilterNature(n)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterNature === n ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Groups Table */}
                    <div className="bento-card p-0 overflow-hidden shadow-2xl">
                        <table className="modern-table-premium">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                                    <th className="px-10 py-6 text-left">Group Name</th>
                                    <th className="px-6 py-6 text-left">Parent Group</th>
                                    <th className="px-6 py-6 text-left">Nature</th>
                                    <th className="px-6 py-6 text-left">Type</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-32">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-6" size={48} />
                                        <p className="font-black text-slate-300 uppercase tracking-[0.3em] text-xs">Loading Groups...</p>
                                    </td></tr>
                                ) : filteredGroups.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-32 opacity-30">
                                        <Layers size={80} className="mx-auto mb-8 text-indigo-100" />
                                        <p className="font-black uppercase tracking-[0.4em] text-sm">No Groups Found</p>
                                    </td></tr>
                                ) : filteredGroups.map(group => {
                                    const cfg = NATURE_CONFIG[group.nature] || NATURE_CONFIG.ASSETS;
                                    return (
                                        <tr key={group._id} className="group/row">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover/row:scale-110"
                                                        style={{ background: cfg.bg, color: cfg.color }}>
                                                        <Layers size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 text-base">{group.name}</div>
                                                        {group.description && <div className="text-[10px] text-slate-400 mt-0.5 max-w-[220px] truncate">{group.description}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {group.parent ? (
                                                    <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[11px] font-bold text-slate-500 border border-slate-100">
                                                        {group.parent}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Primary</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                    style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                {group.is_system ? (
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">System</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">Custom</span>
                                                )}
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(group)}
                                                        className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                                                        <Edit size={16} />
                                                    </button>
                                                    {!group.is_system && (
                                                        <button onClick={() => handleDelete(group)}
                                                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Drawer */}
                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[1000] flex flex-col">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                            <Layers size={20} />
                                        </div>
                                        <span className="metric-pill-modern">{isEditing ? 'EDIT GROUP' : 'NEW GROUP'}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {isEditing ? 'Modify Account Group' : 'Create Account Group'}
                                    </h3>
                                </div>
                                <button onClick={() => setShowDrawer(false)}
                                    className="w-12 h-12 rounded-2xl hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all bg-slate-100 text-slate-400">
                                    <XCircle size={28} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="group-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Group Name */}
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Group Name *</label>
                                        <input
                                            required
                                            className="input-premium-modern w-full font-bold"
                                            placeholder="e.g. Sundry Debtors"
                                            value={formData.name}
                                            disabled={isEditing && formData.is_system}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        {isEditing && formData.is_system && (
                                            <p className="text-[10px] text-amber-500 mt-2 font-bold">⚠ System group names cannot be changed.</p>
                                        )}
                                    </div>

                                    {/* Nature */}
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Nature *</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(NATURE_CONFIG).map(([key, cfg]) => (
                                                <button key={key} type="button"
                                                    onClick={() => setFormData({ ...formData, nature: key })}
                                                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${formData.nature === key ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.bg, color: cfg.color }}>
                                                        {cfg.icon}
                                                    </div>
                                                    <span className="text-xs font-black uppercase text-slate-600">{cfg.label}</span>
                                                    {formData.nature === key && <CheckCircle2 size={16} className="ml-auto text-slate-900" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Parent Group */}
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Parent Group (optional)</label>
                                        <div className="relative">
                                            <select
                                                className="input-premium-modern w-full appearance-none cursor-pointer"
                                                value={formData.parent || ''}
                                                onChange={e => setFormData({ ...formData, parent: e.target.value || null })}
                                            >
                                                <option value="">-- Primary Group (no parent) --</option>
                                                {primaryGroups
                                                    .filter(g => g.nature === formData.nature)
                                                    .map(g => <option key={g._id} value={g.name}>{g.name}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2">Leave blank to create a primary (top-level) group</p>
                                    </div>

                                    {/* Description */}
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Description</label>
                                        <textarea
                                            className="input-premium-modern w-full !h-24 !pt-4"
                                            placeholder="Optional description..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="p-8 border-t border-slate-50 flex gap-4">
                                <button type="submit" form="group-form" disabled={submitting}
                                    className="btn-glow bg-slate-900 text-white flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> {isEditing ? 'Save Changes' : 'Create Group'}</>}
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

export default GroupMaster;
