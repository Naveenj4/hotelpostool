import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';
import { 
    Save, X, Calendar, User, Phone, Mail, Hash, CreditCard, 
    MapPin, Building, Briefcase, ChevronLeft, Layers, 
    ChevronDown, Search, PlusCircle, Edit, Trash2, 
    Loader2, AlertCircle, CheckCircle2, XCircle, ChevronRight,
    ArrowRight, Globe, Info, Clock
} from 'lucide-react';
import './LedgerCreationForm.css';
import { STANDARD_GROUPS, getNatureForGroup } from '../../utils/standardGroups';

const API = import.meta.env.VITE_API_URL;
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

export default function LedgerMaster() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const initialFormState = {
        name: '',
        phone: '',
        email: '',
        gstin: '',
        pan_number: '',
        party_category: '',
        registration_type: 'Regular',
        state: '',
        billing_address: '',
        shipping_address: '',
        same_as_billing: true,
        opening_balance: '',
        balance_type: 'DR',
        due_days: '',
        credit_limit: '',
        contact_person: '',
        dob: '',
        bank_account_number: '',
        ifsc_code: '',
        bank_name: '',
        branch: '',
        account_holder_name: '',
        group: 'Sundry Debtors'
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchLedgers = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/ledgers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setLedgers(data.data);
        } catch (err) {
            console.error("Failed to fetch ledgers", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API}/ledger-groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setGroups(data.data);
        } catch (err) {
            console.error("Failed to fetch groups", err);
        }
    };

    useEffect(() => {
        fetchLedgers();
        fetchGroups();
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const upd = { ...prev, [name]: type === 'checkbox' ? checked : value };
            if (name === 'same_as_billing') {
                if (checked) upd.shipping_address = upd.billing_address;
            }
            if (name === 'billing_address' && upd.same_as_billing) {
                upd.shipping_address = value;
            }
            return upd;
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const token = getToken();
            const url = isEditing ? `${API}/ledgers/${formData._id}` : `${API}/ledgers`;
            const method = isEditing ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowDrawer(false);
                resetForm();
                fetchLedgers();
            } else {
                setError(data.error || 'Failed to save ledger');
            }
        } catch (err) {
            setError('Failed to save data. ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (ledger) => {
        setFormData(ledger);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ledger?")) return;
        try {
            const token = getToken();
            const res = await fetch(`${API}/ledgers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) fetchLedgers();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setError('');
    };

    const filteredLedgers = ledgers.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.group || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <button className="btn-premium-primary !py-2 !px-6" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} /> 
                            <span className="text-[10px] uppercase font-black">Register New Ledger</span>
                        </button>
                    }
                />

                <div className="master-content-layout fade-in">
                    <div className="toolbar-premium">
                        <div className="search-premium" style={{ width: '400px' }}>
                            <Search size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by name, group, or phone..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                {filteredLedgers.length} Accounts Found
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Ledger Account</th>
                                    <th>Classification</th>
                                    <th>Financial Pulse</th>
                                    <th>Communication</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                        <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Syncing Global Ledgers...</p>
                                    </td></tr>
                                ) : filteredLedgers.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Briefcase className="text-slate-200" size={32} />
                                        </div>
                                        <p className="font-bold text-slate-400">No ledger entries matching your search.</p>
                                    </td></tr>
                                ) : filteredLedgers.map((ledger) => (
                                    <tr key={ledger._id} className="group cursor-default hover:bg-indigo-50/10 transition-all">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    {ledger.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{ledger.name}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Hash size={10} className="text-indigo-200" /> {ledger._id.slice(-6)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    <Layers size={12} className="text-slate-300" /> {ledger.group}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 inline-block px-2 py-0.5 rounded-lg border border-slate-100">
                                                    {ledger.party_category || 'General'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <div className={`text-sm font-black ${ledger.balance_type === 'DR' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    ₹{(ledger.opening_balance || 0).toLocaleString()} <span className="text-[10px] opacity-70">{ledger.balance_type}</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Limit: ₹{(ledger.credit_limit || 0).toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    <Phone size={12} className="text-slate-300" /> {ledger.phone || '—'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Mail size={12} className="text-slate-300" /> {ledger.email || '—'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(ledger)} className="action-icon-btn edit shadow-sm scale-90"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(ledger._id)} className="action-icon-btn delete shadow-sm scale-90"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <div className="fullpage-form-overlay">
                        <div className="fullpage-form-header">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                    <Building size={18} />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest block">Account Architect</span>
                                    <h2 className="text-xl font-black text-slate-800">{isEditing ? 'Modify Account Details' : 'Architect New Ledger'}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="submit" form="ledger-form" disabled={saving} className="btn-premium-primary !py-2 !px-6">
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? 'Save Changes' : 'Create Ledger')}
                                </button>
                                <button onClick={() => setShowDrawer(false)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all border border-slate-200">
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="fullpage-form-body">
                            {error && (
                                <div className="mx-auto max-w-[900px] bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 font-medium text-sm mb-6 shadow-sm">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}

                            <form id="ledger-form" onSubmit={handleSave} className="mx-auto max-w-[900px] flex flex-col gap-8 pb-32">
                                {/* SECTION 1 — Identity */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><User size={16} /></div>
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">1. Identity & Compliance</h4>
                                    </div>
                                    <div className="p-8 flex flex-col gap-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="form-group-premium col-span-1 md:col-span-2 !mb-0">
                                                <label>Ledger Name <span className="text-rose-500">*</span></label>
                                                <div className="relative group">
                                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input type="text" name="name" required className="input-premium-modern with-icon-left !pl-12 w-full font-bold uppercase" placeholder="e.g. ACME SOLUTIONS PVT LTD" value={formData.name} onChange={handleChange} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium !mb-0"><label>Phone Number</label><div className="relative group"><Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" /><input type="text" name="phone" className="input-premium-modern with-icon-left !pl-11 w-full font-semibold" placeholder="+91" value={formData.phone} onChange={handleChange} /></div></div>
                                            <div className="form-group-premium !mb-0"><label>Email Protocol</label><div className="relative group"><Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" /><input type="email" name="email" className="input-premium-modern with-icon-left !pl-11 w-full font-semibold" placeholder="office@domain.com" value={formData.email} onChange={handleChange} /></div></div>
                                            <div className="form-group-premium !mb-0"><label>GSTIN Identifier</label><div className="relative group"><Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" /><input type="text" name="gstin" className="input-premium-modern with-icon-left !pl-11 w-full font-semibold uppercase" placeholder="27AAAAA0000A1Z5" value={formData.gstin} onChange={handleChange} /></div></div>
                                            <div className="form-group-premium !mb-0"><label>PAN Certificate</label><div className="relative group"><CreditCard size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" /><input type="text" name="pan_number" className="input-premium-modern with-icon-left !pl-11 w-full font-semibold uppercase" placeholder="ABCDE1234F" value={formData.pan_number} onChange={handleChange} /></div></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                            <div className="form-group-premium !mb-0"><label>Registration Type</label><select name="registration_type" className="input-premium-modern w-full font-bold text-slate-700" value={formData.registration_type} onChange={handleChange}><option value="Regular">Regular</option><option value="Composition">Composition</option><option value="Unregistered">Unregistered</option><option value="Consumer">Consumer</option></select></div>
                                            <div className="form-group-premium !mb-0"><label>State Jurisdiction</label><input type="text" name="state" className="input-premium-modern w-full font-bold" placeholder="e.g. Maharashtra" value={formData.state} onChange={handleChange} /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2 — Classification + Financial */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Layers size={16} /></div>
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">2. Classification</h4>
                                        </div>
                                        <div className="p-8 flex flex-col gap-6 flex-1">
                                            <div className="form-group-premium !mb-0">
                                                <label>Parent Group <span className="text-rose-500">*</span></label>
                                                <div className="relative group">
                                                    <select name="group" required className="input-premium-modern w-full font-bold text-slate-700 !pl-4" value={formData.group} onChange={handleChange}>
                                                        <option value="" disabled>-- Select Group --</option>
                                                        {(() => {
                                                            const grouped = {};
                                                            Object.entries(STANDARD_GROUPS).forEach(([nat, gList]) => {
                                                                if (!grouped[nat]) grouped[nat] = new Set();
                                                                gList.forEach(g => grouped[nat].add(g));
                                                            });
                                                            if (groups && groups.length > 0) {
                                                                groups.forEach(g => {
                                                                    const nat = g.nature || getNatureForGroup(g.name) || 'ASSETS';
                                                                    if (!grouped[nat]) grouped[nat] = new Set();
                                                                    grouped[nat].add(g.name);
                                                                });
                                                            }
                                                            return Object.entries(grouped).map(([nature, gSet]) => (
                                                                <optgroup key={nature} label={`── ${nature.toUpperCase()} ──`}>
                                                                    {Array.from(gSet).sort().map(g => <option key={g} value={g}>{g}</option>)}
                                                                </optgroup>
                                                            ));
                                                        })()}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-group-premium !mb-0">
                                                <label>Industry Category</label>
                                                <input type="text" name="party_category" className="input-premium-modern w-full font-bold" placeholder="e.g. Retailer" value={formData.party_category} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><CreditCard size={16} /></div>
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">3. Opening Financials</h4>
                                        </div>
                                        <div className="p-8 flex flex-col gap-6 flex-1">
                                            <div className="form-group-premium !mb-0">
                                                <label>Opening Balance</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                    <input type="number" name="opening_balance" className="input-premium-modern !pl-8 w-full font-bold text-slate-700" placeholder="0.00" value={formData.opening_balance} onChange={handleChange} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium !mb-0">
                                                <label>Balance Nature</label>
                                                <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, balance_type: 'DR' }))} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-black transition-all ${formData.balance_type === 'DR' ? 'bg-white text-rose-600 shadow border border-rose-100' : 'text-slate-400'}`}>DR (COLLECT)</button>
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, balance_type: 'CR' }))} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-black transition-all ${formData.balance_type === 'CR' ? 'bg-white text-emerald-600 shadow border border-emerald-100' : 'text-slate-400'}`}>CR (PAYABLE)</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3 — Address Map */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><MapPin size={16} /></div>
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">4. Geospatial Intelligence</h4>
                                    </div>
                                    <div className="p-8 flex flex-col gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing Address</label>
                                            <textarea name="billing_address" rows={2} className="input-premium-modern w-full font-bold" placeholder="Complete site address..." value={formData.billing_address} onChange={handleChange} />
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input type="checkbox" name="same_as_billing" className="sr-only peer" checked={formData.same_as_billing} onChange={handleChange} />
                                                <div className="w-5 h-5 border-2 border-slate-300 rounded-lg group-hover:border-indigo-400 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-all">
                                                    <CreditCard size={12} className={`text-white ${formData.same_as_billing ? 'opacity-100' : 'opacity-0'}`} />
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Mirror billing to shipping</span>
                                        </label>
                                        {!formData.same_as_billing && (
                                            <div className="flex flex-col gap-2 fade-in">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shipping Destination</label>
                                                <textarea name="shipping_address" rows={2} className="input-premium-modern w-full font-bold" placeholder="Where goods are sent..." value={formData.shipping_address} onChange={handleChange} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SECTION 4 — Bank details */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Building size={16} /></div>
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">5. Financial Settlement Protocol</h4>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="form-group-premium !mb-0"><label>Bank Name</label><input type="text" name="bank_name" className="input-premium-modern w-full font-bold" placeholder="e.g. HDFC BANK" value={formData.bank_name} onChange={handleChange} /></div>
                                        <div className="form-group-premium !mb-0"><label>A/C Holder Name</label><input type="text" name="account_holder_name" className="input-premium-modern w-full font-bold" placeholder="ENTITY NAME" value={formData.account_holder_name} onChange={handleChange} /></div>
                                        <div className="form-group-premium !mb-0"><label>Account Number</label><input type="text" name="bank_account_number" className="input-premium-modern w-full font-bold" placeholder="000000000000" value={formData.bank_account_number} onChange={handleChange} /></div>
                                        <div className="form-group-premium !mb-0"><label>IFSC Code</label><input type="text" name="ifsc_code" className="input-premium-modern w-full font-bold uppercase" placeholder="HDFC0001234" value={formData.ifsc_code} onChange={handleChange} /></div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="fullpage-form-footer">
                            <button onClick={() => setShowDrawer(false)} className="btn-premium-outline">Cancel</button>
                            <button type="submit" form="ledger-form" disabled={saving} className="btn-premium-primary">
                                {saving ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? 'Commit Changes' : 'Register Ledger')}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
