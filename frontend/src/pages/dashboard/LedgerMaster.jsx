import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
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
    ChevronDown,
    Building2,
    Target,
    BarChart3,
    ArrowUpRight,
    ArrowDownLeft,
    Layers
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

                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Book className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Double-Entry Core</span>
                            </div>
                            <h2>Ledger Master</h2>
                            <p>Architectural accounting heads and financial classifications.</p>
                        </div>
                        <button className="btn-premium-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={20} /> Provision New Account
                        </button>
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search account nomenclature..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 italic">
                                Active Accounts: {filteredLedgers.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Account Nomenclature</th>
                                    <th>Strategic Classification</th>
                                    <th>Opening Capital</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Synchronizing Ledgers...</p>
                                        </td>
                                    </tr>
                                ) : filteredLedgers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Book size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No account heads registered.</p>
                                        </td>
                                    </tr>
                                ) : filteredLedgers.map((ledger) => (
                                    <tr key={ledger._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10 group-hover:bg-indigo-600 transition-all">
                                                    <Target size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{ledger.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5 italic">Financial Heading</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-slate-600 uppercase tracking-tighter leading-none group-hover:text-indigo-600 transition-colors">
                                                    {ledger.group.replace(/_/g, ' ')}
                                                </span>
                                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="w-1/2 h-full bg-indigo-500 rounded-full"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ledger.balance_type === 'DR' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {ledger.balance_type === 'DR' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-800">₹{ledger.opening_balance.toLocaleString()}</div>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${ledger.balance_type === 'DR' ? 'text-blue-600' : 'text-rose-600'}`}>
                                                        {ledger.balance_type === 'DR' ? 'Debit' : 'Credit'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${ledger.is_active ? 'active' : 'disabled'}`}>
                                                {ledger.is_active ? 'COMPLIANT' : 'FROZEN'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(ledger)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleToggleStatus(ledger)} className="action-icon-btn" style={{ background: ledger.is_active ? '#fff7ed' : '#f0fdf4', color: ledger.is_active ? '#9a3412' : '#15803d' }}>
                                                    {ledger.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                </button>
                                                <button onClick={() => handleDelete(ledger)} className="action-icon-btn delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium">
                            <div className="drawer-header-premium">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Account' : 'Architect Account'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Double-Entry Fiscal Registry</p>
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
                                <form id="ledger-form" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="form-group-premium">
                                        <label>Account Nomenclature *</label>
                                        <div className="relative">
                                            <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                required
                                                className="input-premium !pl-12"
                                                placeholder="e.g. AXIS BANK OPERATIONAL"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Accounting Classification Group *</label>
                                        <div className="relative">
                                            <Layers size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                            <select
                                                className="input-premium !pl-12 appearance-none cursor-pointer"
                                                value={formData.group}
                                                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                            >
                                                {LEDGER_GROUPS.map(g => (
                                                    <option key={g.value} value={g.value}>{g.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Opening Capital</label>
                                            <div className="relative">
                                                <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="number"
                                                    className="input-premium !pl-12"
                                                    value={formData.opening_balance}
                                                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Logic Type</label>
                                            <div className="flex gap-2">
                                                {['DR', 'CR'].map(type => (
                                                    <button key={type} type="button" onClick={() => setFormData({ ...formData, balance_type: type })} className={`flex-1 p-3 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${formData.balance_type === type ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 text-slate-400'}`}>
                                                        {type === 'DR' ? 'Debit' : 'Credit'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label>Accounting Narrative (Optional)</label>
                                        <div className="relative">
                                            <Info size={20} className="absolute left-4 top-4 text-slate-300" />
                                            <textarea
                                                className="input-premium !pl-12 !h-24 !pt-4"
                                                placeholder="Additional ledger metadata..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="ledger-form" disabled={submitting} className="btn-premium-primary flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'COMMIT LEDGER' : 'PROVISION ACCOUNT')}
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

export default LedgerMaster;
