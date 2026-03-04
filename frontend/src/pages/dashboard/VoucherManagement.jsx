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
            const [vouchRes, ledgRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/vouchers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/ledgers`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const vouchData = await vouchRes.json();
            const ledgData = await ledgRes.json();
            if (vouchData.success) setVouchers(vouchData.data);
            if (ledgData.success) setLedgers(ledgData.data);
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
                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Double-Entry Journal</span>
                            </div>
                            <h2>Voucher Management</h2>
                            <p>Manage journal entries, receipts, payments, and fund transfers.</p>
                        </div>
                        <button className="btn-premium-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={20} /> Create Voucher
                        </button>
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input type="text" placeholder="Search by number, type, or account..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 italic">
                            {filteredVouchers.length} Entries
                        </span>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Voucher Reference</th>
                                    <th>Classification</th>
                                    <th>Account Distribution</th>
                                    <th>Entry Date</th>
                                    <th className="text-right">Capital Amount</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                        <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Syncing Journal Entries...</p>
                                    </td></tr>
                                ) : filteredVouchers.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <Wallet size={64} className="text-slate-100 mx-auto mb-4" />
                                        <p className="font-bold text-slate-400">No voucher entries on record.</p>
                                    </td></tr>
                                ) : filteredVouchers.map((v) => {
                                    const style = getVoucherStyle(v.voucher_type);
                                    return (
                                        <tr key={v._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: style.bg, color: style.color }}>
                                                        {style.icon}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 tracking-tight">{v.voucher_number}</div>
                                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Ref: {v._id?.slice(-6).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: style.bg, color: style.color }}>
                                                    {v.voucher_type}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-indigo-50 text-indigo-600 rounded uppercase">DR</span>
                                                        <span className="text-xs font-bold text-slate-700">{v.debit_ledger?.name || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-50 text-rose-600 rounded uppercase">CR</span>
                                                        <span className="text-xs font-bold text-slate-700">{v.credit_ledger?.name || '—'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar size={14} className="text-slate-300" />
                                                    <span className="font-bold text-sm">{new Date(v.date).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <span className="text-lg font-black text-slate-900" style={{ color: style.color }}>
                                                    ₹{parseFloat(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex justify-end">
                                                    <button onClick={() => handleDelete(v._id)} className="action-icon-btn delete"><Trash2 size={18} /></button>
                                                </div>
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
                        <div className="drawer-premium">
                            <div className="drawer-header-premium">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">New Journal Entry</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Balances will reflect across all ledgers</p>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all">
                                    <XCircle size={24} className="text-slate-300" />
                                </button>
                            </div>
                            <div className="drawer-body-premium">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-8">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="voucher-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Voucher Type Selector */}
                                    <div className="form-group-premium">
                                        <label>Transaction Classification</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {VOUCHER_TYPES.map(t => (
                                                <button key={t.value} type="button"
                                                    onClick={() => setFormData({ ...formData, voucher_type: t.value })}
                                                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${formData.voucher_type === t.value ? 'border-indigo-600 bg-indigo-50/50 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}>
                                                    <div className="p-2 rounded-xl" style={{ background: t.bg, color: t.color }}>{t.icon}</div>
                                                    <div>
                                                        <div className={`text-xs font-black uppercase tracking-widest ${formData.voucher_type === t.value ? 'text-indigo-700' : 'text-slate-600'}`}>{t.label}</div>
                                                        <div className="text-[10px] font-bold text-slate-400">{t.sub}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Voucher Reference ID</label>
                                            <input type="text" required className="input-premium" value={formData.voucher_number} onChange={e => setFormData({ ...formData, voucher_number: e.target.value })} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Entry Date</label>
                                            <div className="relative">
                                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                <input type="date" required className="input-premium !pl-12" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="!text-indigo-600">
                                            Debit Account — <span className="italic font-bold text-slate-400">Receiver</span>
                                        </label>
                                        <div className="relative">
                                            <select required className="input-premium appearance-none cursor-pointer" value={formData.debit_ledger} onChange={e => setFormData({ ...formData, debit_ledger: e.target.value })}>
                                                <option value="">Select receiver account...</option>
                                                {ledgers.map(l => <option key={l._id} value={l._id}>{l.name} [{l.group?.replace(/_/g, ' ')}]</option>)}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="!text-rose-600">
                                            Credit Account — <span className="italic font-bold text-slate-400">Giver</span>
                                        </label>
                                        <div className="relative">
                                            <select required className="input-premium appearance-none cursor-pointer" value={formData.credit_ledger} onChange={e => setFormData({ ...formData, credit_ledger: e.target.value })}>
                                                <option value="">Select giver account...</option>
                                                {ledgers.map(l => <option key={l._id} value={l._id}>{l.name} [{l.group?.replace(/_/g, ' ')}]</option>)}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label>Transfer Amount (₹) *</label>
                                        <input type="number" required placeholder="0.00" className="input-premium !text-2xl !font-black !text-indigo-600" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })} />
                                    </div>

                                    <div className="form-group-premium">
                                        <label>Transaction Narration / Memo</label>
                                        <textarea className="input-premium !h-24" placeholder="Describe the purpose of this transaction entry..." value={formData.narration} onChange={e => setFormData({ ...formData, narration: e.target.value })}></textarea>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="voucher-form" disabled={submitting} className="btn-premium-primary flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : <><PlusCircle size={20} /> FINALIZE VOUCHER</>}
                                </button>
                                <button onClick={() => setShowDrawer(false)} className="btn-premium-outline">ABORT</button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default VoucherManagement;
