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

    const filteredLedgers = ledgers.filter(l => {
        const nameMatch = l?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
        const groupMatch = l?.group?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
        return nameMatch || groupMatch;
    });

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Ledger Creation"
                    actions={
                        <button className="btn-premium-primary !py-2 !px-6" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} /> 
                            <span className="text-[10px] uppercase font-black">Provision Account</span>
                        </button>
                    }
                />
                <div className="master-content-layout fade-in p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    {/* Header relocated */}


                    <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bento-card p-4">
                        <div className="relative flex-1 group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input type="text" placeholder="Search account nomenclature or classification..." className="input-premium-modern !pl-16 w-full text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="metric-pill-modern bg-indigo-50 text-indigo-600 border border-indigo-100 px-6 py-3">
                                {filteredLedgers.length} Active Vectors
                            </span>
                        </div>
                    </div>

                    <div className="bento-card p-0 overflow-hidden shadow-2xl">
                        <table className="modern-table-premium">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                                    <th className="px-10 py-6 text-left">Account Metadata</th>
                                    <th className="px-6 py-6 text-left">Strategic grouping</th>
                                    <th className="px-6 py-6 text-left">Fiscal Origin</th>
                                    <th className="px-6 py-6 text-left">Integrity</th>
                                    <th className="px-10 py-6 text-right">Audit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-32">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-6" size={64} />
                                        <p className="font-black text-slate-300 uppercase tracking-[0.3em] text-xs">Syncing Ledger Infrastructure...</p>
                                    </td></tr>
                                ) : filteredLedgers.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-32 opacity-30">
                                        <Book size={100} className="mx-auto mb-10 text-indigo-100" />
                                        <p className="font-black uppercase tracking-[0.4em] text-sm">Registry Clear: No Nodes Found</p>
                                    </td></tr>
                                ) : filteredLedgers.map((ledger) => (
                                    <tr key={ledger._id} className="group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-hover:bg-indigo-600">
                                                    <Target size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{ledger?.name || 'Unnamed Ledger'}</div>
                                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded w-fit">Ref: {ledger?._id ? String(ledger._id).slice(-6).toUpperCase() : 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="space-y-2">
                                                <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50/50 text-indigo-600 border border-indigo-100">
                                                    {(ledger?.group || '').replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${ledger?.balance_type === 'DR' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {ledger?.balance_type === 'DR' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-slate-900 tracking-tighter">₹{(ledger?.opening_balance || 0).toLocaleString()}</div>
                                                    <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-0.5 ${ledger?.balance_type === 'DR' ? 'text-indigo-400' : 'text-rose-400'}`}>
                                                        {ledger?.balance_type === 'DR' ? 'DEBIT ORIGIN' : 'CREDIT ORIGIN'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-colors ${ledger.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {ledger.is_active ? 'Active' : 'Frozen'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(ledger)} className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                                                    <Edit size={20} />
                                                </button>
                                                <button onClick={() => handleToggleStatus(ledger)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${ledger.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                                                    {ledger.is_active ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                                                </button>
                                                <button onClick={() => handleDelete(ledger)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
                                                    <Trash2 size={20} />
                                                </button>
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
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[1000] flex flex-col transform transition-transform duration-500 ease-out p-0 border-l border-slate-50">
                            <div className="p-10 border-b border-slate-50 bg-slate-50/20 backdrop-blur-md flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-100">
                                            <Target size={20} />
                                        </div>
                                        <span className="metric-pill-modern">{isEditing ? 'RECALIBRATION' : 'PROVISIONING'}</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{isEditing ? 'Modify Account' : 'Architect Account'}</h3>
                                    <p className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-[0.2em]">Double-entry asset orchestration</p>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-14 h-14 rounded-2xl hover:bg-white hover:text-rose-500 hover:scale-110 flex items-center justify-center transition-all bg-slate-100 text-slate-400 group">
                                    <XCircle size={32} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-10">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-600 font-bold text-sm animate-bounce mb-10">
                                        <AlertCircle size={24} /> {error}
                                    </div>
                                )}
                                <form id="ledger-form" onSubmit={handleSubmit} className="space-y-10">
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 block">Account Nomenclature</label>
                                        <div className="relative group">
                                            <Building2 size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                className="input-premium-modern !pl-16 w-full text-xl font-black uppercase"
                                                placeholder="ENTER ACCOUNT NAME..."
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 block">Strategic classification</label>
                                        <div className="relative group">
                                            <Layers size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                                            <select
                                                className="input-premium-modern !pl-16 w-full appearance-none cursor-pointer text-lg font-bold"
                                                value={formData.group}
                                                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                            >
                                                {LEDGER_GROUPS.map(g => (
                                                    <option key={g.value} value={g.value}>{g.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                                        <div className="form-group-premium">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 block text-center">Opening Capital</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    className="input-premium-modern !pl-10 w-full text-center text-2xl font-black bg-white"
                                                    value={formData.opening_balance}
                                                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group-premium">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 block text-center">Logic mode</label>
                                            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200">
                                                {['DR', 'CR'].map(type => (
                                                    <button key={type} type="button"
                                                        onClick={() => setFormData({ ...formData, balance_type: type })}
                                                        className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.balance_type === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                        {type === 'DR' ? 'Debit' : 'Credit'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 block">Accounting Narratives</label>
                                        <div className="relative group">
                                            <Info size={24} className="absolute left-6 top-6 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <textarea
                                                className="input-premium-modern !pl-16 w-full !h-32 !pt-6 text-lg font-bold"
                                                placeholder="CONTEXTUAL METADATA..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-10 border-t border-slate-50 flex gap-6 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                                <button type="submit" form="ledger-form" disabled={submitting} className="btn-glow bg-slate-900 text-white flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-indigo-600 active:scale-95 transition-all">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? <><Edit size={24} /> COMMIT CHANGES</> : <><CheckCircle2 size={24} /> PROVISION ACCOUNT</>)}
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

export default LedgerMaster;
