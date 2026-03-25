import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    PlusCircle, Search, Trash2, Loader2, Wallet,
    AlertCircle, ArrowRightCircle, ArrowLeftCircle,
    Repeat, ArrowRightLeft, XCircle, Calendar,
    FileText, Filter, ChevronDown
} from 'lucide-react';
import './Dashboard.css';

const VOUCHER_TYPES = [
    { value: 'RECEIPT', label: 'Receipt', sub: 'Money In', icon: <ArrowLeftCircle size={20} />, color: '#10b981', bg: '#d1fae5' },
    { value: 'PAYMENT', label: 'Payment', sub: 'Money Out', icon: <ArrowRightCircle size={20} />, color: '#ef4444', bg: '#fee2e2' },
    { value: 'CONTRA', label: 'Contra', sub: 'Fund Transfer', icon: <Repeat size={20} />, color: '#6366f1', bg: '#e0e7ff' },
    { value: 'JOURNAL', label: 'Journal', sub: 'Adjustment', icon: <ArrowRightLeft size={20} />, color: '#f59e0b', bg: '#fef3c7' }
];

const VoucherManagement = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [vouchers, setVouchers] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [ledgerGroups, setLedgerGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [formData, setFormData] = useState({
        voucher_type: 'RECEIPT',
        voucher_number: '',
        date: new Date().toISOString().split('T')[0],
        debit_ledger: '',
        credit_ledger: '',
        amount: '',
        narration: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const [vouchRes, ledgRes, grpRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/vouchers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/ledgers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/ledger-groups`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const vouchData = await vouchRes.json();
            const ledgData = await ledgRes.json();
            const grpData = await grpRes.json();
            if (vouchData.success) setVouchers(vouchData.data);
            if (ledgData.success) setLedgers(ledgData.data);
            if (grpData.success) setLedgerGroups(grpData.data);
        } catch (err) { console.error("Failed to fetch data", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setFormData({
            voucher_type: 'RECEIPT',
            voucher_number: 'VCH-' + Date.now().toString().slice(-6),
            date: new Date().toISOString().split('T')[0],
            debit_ledger: '', credit_ledger: '', amount: '', narration: ''
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.debit_ledger || !formData.credit_ledger) return setError("Please select both Debit and Credit accounts.");
        if (formData.debit_ledger === formData.credit_ledger) return setError("Debit and Credit accounts cannot be the same.");
        setSubmitting(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/vouchers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) { fetchData(); setShowDrawer(false); resetForm(); }
            else setError(result.error || result.message);
        } catch (err) { setError("Connection failed"); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this voucher? This will revert the account balances.")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/vouchers/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) fetchData();
            else alert(result.message || "Delete failed");
        } catch (err) { alert("Delete failed"); }
    };

    const filteredVouchers = vouchers.filter(v =>
        v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.voucher_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.debit_ledger?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.credit_ledger?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getVoucherStyle = (type) => {
        const t = VOUCHER_TYPES.find(x => x.value === type);
        return t || VOUCHER_TYPES[0];
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="master-content-layout fade-in p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    <div className="master-header-premium-refined flex-col md:flex-row mb-12">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                                    <Wallet size={20} />
                                </div>
                                <span className="metric-pill-modern">Journal Ledger</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Voucher Management</h2>
                            <p className="text-slate-500 font-bold mt-2 text-lg">Orchestrate journal entries, receipts, payments, and distributed fund transfers.</p>
                        </div>
                        <button className="btn-glow bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.1em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center gap-4 group" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-500" /> Create Transaction
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bento-card p-4">
                        <div className="relative flex-1 group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input type="text" placeholder="Search entries by ID, account or classification..." className="input-premium-modern !pl-16 w-full text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="metric-pill-modern bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {filteredVouchers.length} Total Manifests
                            </span>
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer shadow-sm"><Filter size={20} /></div>
                        </div>
                    </div>

                    <div className="bento-card p-0 overflow-hidden shadow-2xl">
                        <table className="modern-table-premium">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                                    <th className="px-10 py-6 text-left">Reference Vector</th>
                                    <th className="px-6 py-6 text-left">classification</th>
                                    <th className="px-6 py-6 text-left">Asset distribution</th>
                                    <th className="px-6 py-6 text-left">timestamp</th>
                                    <th className="px-6 py-6 text-right">Magnitude</th>
                                    <th className="px-6 py-6 text-right">Audit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-32">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-6" size={64} />
                                        <p className="font-black text-slate-300 uppercase tracking-[0.3em] text-xs">Syncing Ledger Assets...</p>
                                    </td></tr>
                                ) : filteredVouchers.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-32 opacity-30">
                                        <Wallet size={100} className="mx-auto mb-10 text-indigo-100" />
                                        <p className="font-black uppercase tracking-[0.4em] text-sm">Clear Horizon: No Manifests</p>
                                    </td></tr>
                                ) : filteredVouchers.map((v) => {
                                    const style = getVoucherStyle(v.voucher_type);
                                    return (
                                        <tr key={v._id} className="group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ background: style.bg, color: style.color }}>
                                                        {style.icon}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 text-lg tracking-tight">{v.voucher_number}</div>
                                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">ID: {v._id?.slice(-8).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border" style={{ background: `${style.color}08`, color: style.color, borderColor: `${style.color}20` }}>
                                                    {v.voucher_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 flex items-center justify-center text-[10px] font-black bg-indigo-50 text-indigo-600 rounded-xl uppercase shadow-sm">DR</span>
                                                        <span className="text-sm font-black text-slate-700 tracking-tight">{v.debit_ledger?.name || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 flex items-center justify-center text-[10px] font-black bg-rose-50 text-rose-600 rounded-xl uppercase shadow-sm">CR</span>
                                                        <span className="text-sm font-black text-slate-700 tracking-tight">{v.credit_ledger?.name || '—'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3 text-slate-500 font-bold">
                                                    <Calendar size={18} className="text-indigo-200" />
                                                    {new Date(v.date).toLocaleDateString('en-GB')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="text-2xl font-black text-slate-900 tracking-tighter" style={{ color: style.color }}>
                                                    ₹{parseFloat(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <button onClick={() => handleDelete(v._id)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all ml-auto shadow-sm group-hover:scale-105">
                                                    <Trash2 size={22} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Voucher Creation Drawer */}
                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[1000] flex flex-col transform transition-transform duration-500 ease-out p-0 border-l border-slate-50">
                            <div className="p-10 border-b border-slate-50 bg-slate-50/20 backdrop-blur-md flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <Repeat size={20} />
                                        </div>
                                        <span className="metric-pill-modern">Journal Manifest</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">New Ledger Entry</h3>
                                    <p className="text-xs font-black text-slate-300 mt-2 uppercase tracking-[0.2em]">Double-entry asset recalibration</p>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-14 h-14 rounded-2xl hover:bg-white hover:text-rose-500 hover:scale-110 flex items-center justify-center transition-all bg-slate-100 text-slate-400 group">
                                    <XCircle size={32} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-600 font-bold text-sm animate-bounce mb-10">
                                        <AlertCircle size={24} /> {error}
                                    </div>
                                )}
                                <form id="voucher-form" onSubmit={handleSubmit} className="space-y-10">
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 block">Classification Protocol</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {VOUCHER_TYPES.map(t => (
                                                <button key={t.value} type="button"
                                                    onClick={() => setFormData({ ...formData, voucher_type: t.value })}
                                                    className={`p-6 rounded-[2rem] border-2 flex flex-col items-center text-center gap-4 transition-all group ${formData.voucher_type === t.value ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 hover:bg-slate-50'}`}>
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style={{ background: t.bg, color: t.color }}>{t.icon}</div>
                                                    <div>
                                                        <div className={`text-xs font-black uppercase tracking-widest ${formData.voucher_type === t.value ? 'text-indigo-700' : 'text-slate-600'}`}>{t.label}</div>
                                                        <div className="text-[9px] font-black text-slate-400 mt-1 uppercase opacity-50">{t.sub}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="form-group-premium">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 block">Ref ID</label>
                                            <input type="text" required className="input-premium-modern w-full" value={formData.voucher_number} onChange={e => setFormData({ ...formData, voucher_number: e.target.value })} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 block">Staged Date</label>
                                            <div className="relative">
                                                <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                <input type="date" required className="input-premium-modern !pl-12 w-full" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="form-group-premium">
                                            <label className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-3 block italic">Absorption Sector (Debit)</label>
                                            <div className="relative">
                                                <select required className="input-premium-modern appearance-none cursor-pointer w-full !text-indigo-600 border-indigo-100 bg-indigo-50/10" value={formData.debit_ledger} onChange={e => setFormData({ ...formData, debit_ledger: e.target.value })}>
                                                    <option value="">Select receiver...</option>
                                                    {(() => {
                                                        const grouped = {};
                                                        ledgers.forEach(l => { if(!grouped[l.group]) grouped[l.group]=[]; grouped[l.group].push(l); });
                                                        return Object.entries(grouped).map(([grp, items]) => (
                                                            <optgroup key={grp} label={grp}>
                                                                {items.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                                            </optgroup>
                                                        ));
                                                    })()}
                                                </select>
                                                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="form-group-premium">
                                            <label className="text-[10px] font-black uppercase text-rose-400 tracking-[0.2em] mb-3 block italic">Origin Sector (Credit)</label>
                                            <div className="relative">
                                                <select required className="input-premium-modern appearance-none cursor-pointer w-full !text-rose-600 border-rose-100 bg-rose-50/10" value={formData.credit_ledger} onChange={e => setFormData({ ...formData, credit_ledger: e.target.value })}>
                                                    <option value="">Select originator...</option>
                                                    {(() => {
                                                        const grouped = {};
                                                        ledgers.forEach(l => { if(!grouped[l.group]) grouped[l.group]=[]; grouped[l.group].push(l); });
                                                        return Object.entries(grouped).map(([grp, items]) => (
                                                            <optgroup key={grp} label={grp}>
                                                                 {items.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                                            </optgroup>
                                                        ));
                                                    })()}
                                                </select>
                                                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-200 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-premium bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl">
                                        <label className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.3em] mb-5 block">Quantified Magnitude</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 text-4xl font-black italic">₹</span>
                                            <input type="number" required placeholder="0.00" className="input-premium-modern w-full !pl-16 !bg-transparent !border-none !text-6xl !font-black !text-white !p-0 placeholder:text-white/10" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })} />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 block">Transactional Narratives</label>
                                        <textarea className="input-premium-modern !h-32 w-full !py-6 font-bold" placeholder="Contextual audit data..." value={formData.narration} onChange={e => setFormData({ ...formData, narration: e.target.value })}></textarea>
                                    </div>
                                </form>
                            </div>
                            <div className="p-10 border-t border-slate-50 flex gap-6 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                                <button type="submit" form="voucher-form" disabled={submitting} className="btn-glow bg-slate-900 text-white flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-indigo-600 active:scale-95 transition-all">
                                    {submitting ? <Loader2 className="animate-spin" /> : <><PlusCircle size={24} /> Finalise entry</>}
                                </button>
                                <button onClick={() => setShowDrawer(false)} className="w-20 rounded-[2rem] border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all">
                                    <XCircle size={28} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default VoucherManagement;
