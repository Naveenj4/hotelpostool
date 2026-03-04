import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './ProductMaster.css'; // Reusing ProductMaster styles
import {
    PlusCircle,
    Search,
    Edit,
    CheckCircle2,
    XCircle,
    Trash2,
    Loader2,
    Book,
    AlertCircle,
    DollarSign,
    Info,
    ChevronDown
} from 'lucide-react';

const LEDGER_GROUPS = [
    { value: 'SUNDRY_DEBTORS', label: 'Sundry Debtors (Customers)' },
    { value: 'SUNDRY_CREDITORS', label: 'Sundry Creditors (Suppliers)' },
    { value: 'CASH_IN_HAND', label: 'Cash In Hand' },
    { value: 'BANK_ACCOUNTS', label: 'Bank Accounts' },
    { value: 'INDIRECT_EXPENSES', label: 'Indirect Expenses' },
    { value: 'DIRECT_EXPENSES', label: 'Direct Expenses' },
    { value: 'INDIRECT_INCOMES', label: 'Indirect Incomes' },
    { value: 'DIRECT_INCOMES', label: 'Direct Incomes' },
    { value: 'SALES_ACCOUNTS', label: 'Sales Accounts' },
    { value: 'PURCHASE_ACCOUNTS', label: 'Purchase Accounts' },
    { value: 'DUTIES_AND_TAXES', label: 'Duties & Taxes' }
];

const LedgerMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        group: 'INDIRECT_EXPENSES',
        opening_balance: 0,
        balance_type: 'DR',
        description: ''
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

    const fetchLedgers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/ledgers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLedgers(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch ledgers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedgers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/ledgers/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/ledgers`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || result.message);
            }

            fetchLedgers();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (ledger) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/ledgers/${ledger._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchLedgers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (ledger) => {
        if (!window.confirm(`Are you sure you want to delete ledger "${ledger.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/ledgers/${ledger._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchLedgers();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting ledger:', err);
            alert('An error occurred while deleting the ledger.');
        }
    };

    const handleEdit = (ledger) => {
        setFormData(ledger);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            group: 'INDIRECT_EXPENSES',
            opening_balance: 0,
            balance_type: 'DR',
            description: ''
        });
        setIsEditing(false);
        setError('');
    };

    const filteredLedgers = ledgers.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Ledger Master</h2>
                            <p>Manage accounts, expenses, and income headings.</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> Add Ledger
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search ledgers..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">
                            Showing {filteredLedgers.length} ledgers
                        </span>
                    </div>

                    <div className="table-card">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Ledger Name</th>
                                    <th>Group</th>
                                    <th>Opening Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty-state"><Loader2 className="animate-spin mb-2 mx-auto" /> Loading...</td></tr>
                                ) : filteredLedgers.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-state">No ledgers found.</td></tr>
                                ) : filteredLedgers.map((ledger) => (
                                    <tr key={ledger._id}>
                                        <td style={{ fontWeight: 600 }}>{ledger.name}</td>
                                        <td>
                                            <span className="group-badge">{ledger.group.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ fontWeight: 600 }}>₹{ledger.opening_balance}</span>
                                                <span style={{ fontSize: '0.7rem', color: ledger.balance_type === 'DR' ? '#1e40af' : '#b91c1c' }}>
                                                    ({ledger.balance_type})
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${ledger.is_active ? 'status-active' : 'status-disabled'}`}>
                                                {ledger.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => handleEdit(ledger)} className="action-btn edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleToggleStatus(ledger)} className={`action-btn ${ledger.is_active ? 'delete' : 'restore'}`}>
                                                    {ledger.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(ledger)} className="action-btn delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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
                                <h3 className="drawer-title">
                                    <Book size={20} style={{ display: 'inline', marginRight: '8px' }} />
                                    {isEditing ? 'Edit Ledger' : 'Add New Ledger'}
                                </h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                {error && <div className="error-box"><AlertCircle size={16} /> {error}</div>}
                                <form id="ledger-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Ledger Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            placeholder="e.g. Electricity Bill or Axis Bank"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-4" style={{ position: 'relative' }}>
                                        <label className="input-label">Ledger Group *</label>
                                        <select
                                            className="input-field"
                                            value={formData.group}
                                            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                        >
                                            {LEDGER_GROUPS.map(g => (
                                                <option key={g.value} value={g.value}>{g.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem' }}>
                                        <div className="form-group mb-4">
                                            <label className="input-label">Opening Balance</label>
                                            <div className="input-with-icon">
                                                <DollarSign size={16} className="field-icon" />
                                                <input
                                                    type="number"
                                                    className="input-field pad-left-icon"
                                                    value={formData.opening_balance}
                                                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="input-label">Type</label>
                                            <select
                                                className="input-field"
                                                value={formData.balance_type}
                                                onChange={(e) => setFormData({ ...formData, balance_type: e.target.value })}
                                            >
                                                <option value="DR">DR</option>
                                                <option value="CR">CR</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Description (Optional)</label>
                                        <div className="input-with-icon">
                                            <Info size={16} className="field-icon" style={{ top: '12px', transform: 'none' }} />
                                            <textarea
                                                className="input-field pad-left-icon"
                                                style={{ height: '80px', paddingTop: '8px' }}
                                                placeholder="Additional notes..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button type="submit" form="ledger-form" disabled={submitting} className="btn-primary w-full p-3">
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Ledger' : 'Save Ledger')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                .group-badge {
                    padding: 2px 8px;
                    background: #f1f5f9;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    color: #475569;
                    font-weight: 500;
                    text-transform: capitalize;
                }
                .input-with-icon { position: relative; }
                .field-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .pad-left-icon { padding-left: 38px !important; }
            `}</style>
        </div>
    );
};

export default LedgerMaster;
