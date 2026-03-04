import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './ProductMaster.css'; // Reusing some CSS
import {
    PlusCircle,
    Search,
    Trash2,
    Loader2,
    Wallet,
    AlertCircle,
    ArrowRightCircle,
    ArrowLeftCircle,
    Repeat,
    ArrowRightLeft,
    XCircle
} from 'lucide-react';

const VOUCHER_TYPES = [
    { value: 'RECEIPT', label: 'Receipt (Money In)', icon: <ArrowLeftCircle size={18} color="#10b981" /> },
    { value: 'PAYMENT', label: 'Payment (Money Out)', icon: <ArrowRightCircle size={18} color="#ef4444" /> },
    { value: 'CONTRA', label: 'Contra (Cash/Bank Transfer)', icon: <Repeat size={18} color="#6366f1" /> },
    { value: 'JOURNAL', label: 'Journal (Adjustment)', icon: <ArrowRightLeft size={18} color="#f59e0b" /> }
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
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchData = async () => {
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
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({
            voucher_type: 'RECEIPT',
            voucher_number: 'VCH-' + Date.now().toString().slice(-6),
            date: new Date().toISOString().split('T')[0],
            debit_ledger: '',
            credit_ledger: '',
            amount: '',
            narration: ''
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.debit_ledger === formData.credit_ledger) {
            return setError("Debit and Credit ledgers cannot be the same");
        }
        setSubmitting(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/vouchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
                fetchData();
                setShowDrawer(false);
                resetForm();
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Request failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this voucher? Ledger balances will be reverted.")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/vouchers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if ((await response.json()).success) fetchData();
        } catch (err) { alert("Delete failed"); }
    };

    const filteredVouchers = vouchers.filter(v =>
        v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.voucher_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Voucher Management</h2>
                            <p>Record accounting transactions and cash/bank movements.</p>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> New Voucher
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search vouchers..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-card" style={{ maxWidth: '1000px' }}>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Voucher No</th>
                                    <th>Type</th>
                                    <th>Transaction</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="empty-state">Loading...</td></tr>
                                ) : filteredVouchers.length === 0 ? (
                                    <tr><td colSpan="6" className="empty-state">No vouchers found.</td></tr>
                                ) : filteredVouchers.map((v) => (
                                    <tr key={v._id}>
                                        <td>{new Date(v.date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>{v.voucher_number}</td>
                                        <td>
                                            <span className={`vch-badge vch-${v.voucher_type.toLowerCase()}`}>
                                                {v.voucher_type}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="vch-desc">
                                                <span className="dr-text">Dr: {v.debit_ledger?.name}</span>
                                                <span className="cr-text">Cr: {v.credit_ledger?.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>₹{v.amount}</td>
                                        <td>
                                            <button onClick={() => handleDelete(v._id)} className="action-btn delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Drawer */}
                {showDrawer && (
                    <div className="drawer-overlay">
                        <div className="drawer-backdrop" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-container">
                            <div className="drawer-header">
                                <h3 className="drawer-title">New Voucher Entry</h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                {error && <div className="error-box"><AlertCircle size={16} /> {error}</div>}
                                <form id="voucher-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Voucher Type *</label>
                                        <div className="vch-type-grid">
                                            {VOUCHER_TYPES.map(t => (
                                                <div
                                                    key={t.value}
                                                    className={`vch-type-card ${formData.voucher_type === t.value ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, voucher_type: t.value })}
                                                >
                                                    {t.icon}
                                                    <span>{t.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group mb-4">
                                            <label className="input-label">Voucher No *</label>
                                            <input type="text" required className="input-field" value={formData.voucher_number} onChange={e => setFormData({ ...formData, voucher_number: e.target.value })} />
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="input-label">Date *</label>
                                            <input type="date" required className="input-field" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Debit Account (Receiver) *</label>
                                        <select required className="input-field" value={formData.debit_ledger} onChange={e => setFormData({ ...formData, debit_ledger: e.target.value })}>
                                            <option value="">Select Account</option>
                                            {ledgers.map(l => <option key={l._id} value={l._id}>{l.name} ({l.group.replace(/_/g, ' ')})</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Credit Account (Giver) *</label>
                                        <select required className="input-field" value={formData.credit_ledger} onChange={e => setFormData({ ...formData, credit_ledger: e.target.value })}>
                                            <option value="">Select Account</option>
                                            {ledgers.map(l => <option key={l._id} value={l._id}>{l.name} ({l.group.replace(/_/g, ' ')})</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Amount *</label>
                                        <input type="number" required placeholder="0.00" className="input-field" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })} />
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Narration</label>
                                        <textarea className="input-field" placeholder="Notes about this transaction..." value={formData.narration} onChange={e => setFormData({ ...formData, narration: e.target.value })}></textarea>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button type="submit" form="voucher-form" disabled={submitting} className="btn-primary w-full p-3">
                                    {submitting ? 'Processing...' : 'Save Voucher'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                .vch-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
                .vch-receipt { background: #d1fae5; color: #065f46; }
                .vch-payment { background: #fee2e2; color: #991b1b; }
                .vch-contra { background: #e0e7ff; color: #3730a3; }
                .vch-journal { background: #fef3c7; color: #92400e; }
                .vch-desc { display: flex; flex-direction: column; gap: 2px; }
                .dr-text { font-size: 0.85rem; color: #1e40af; font-weight: 500; }
                .cr-text { font-size: 0.85rem; color: #991b1b; font-weight: 500; }
                .vch-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                .vch-type-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; transition: all 0.2s; }
                .vch-type-card:hover { border-color: #94a3b8; background: #f8fafc; }
                .vch-type-card.selected { border-color: #2563eb; background: #eff6ff; border-width: 2px; }
            `}</style>
        </div>
    );
};

export default VoucherManagement;
