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
    User,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    FileText,
    DollarSign,
    Award,
    Contact,
    Activity,
    ChevronRight,
    Star
} from 'lucide-react';

const CustomerMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gst_number: '',
        opening_balance: 0,
        loyalty_points: 0
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

    const fetchCustomers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCustomers(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch customers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/customers/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/customers`;

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

            fetchCustomers();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (customer) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/customers/${customer._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (customer) => {
        if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/${customer._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchCustomers();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert('An error occurred while deleting the customer.');
        }
    };

    const handleEdit = (customer) => {
        setFormData(customer);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            gst_number: '',
            opening_balance: 0,
            loyalty_points: 0
        });
        setIsEditing(false);
        setError('');
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase())
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
                                <Contact className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">CRM Ecosystem</span>
                            </div>
                            <h2>Customer Master</h2>
                            <p>Manage demographic data and loyalty relationships.</p>
                        </div>
                        <button className="btn-premium-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={20} /> Onboard Customer
                        </button>
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search client registry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Registry</span>
                                <span className="text-xl font-black text-slate-800">{filteredCustomers.length} <span className="text-xs text-slate-300">Profiles</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Corporate Entity</th>
                                    <th>Contact Data</th>
                                    <th>Capital & Loyalty</th>
                                    <th>Registry Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing CRM Database...</p>
                                        </td>
                                    </tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Contact size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">Registry is currently void.</p>
                                        </td>
                                    </tr>
                                ) : filteredCustomers.map((cust) => (
                                    <tr key={cust._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {cust.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{cust.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5"><ChevronRight size={10} className="text-indigo-300" /> GST: {cust.gst_number || 'UNAVAILABLE'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-tighter">
                                                    <Phone size={14} className="text-slate-300" /> {cust.phone || 'NO REF'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Mail size={14} className="text-slate-300" /> {cust.email || 'NO_MAIL@RECORD'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 w-fit">
                                                    <Star size={12} className="fill-emerald-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{cust.loyalty_points} Pts</span>
                                                </div>
                                                <span className="text-xs font-black text-rose-500 uppercase tracking-widest mt-1">Bal: ₹{cust.opening_balance.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${cust.is_active ? 'active' : 'disabled'}`}>
                                                {cust.is_active ? 'Verified' : 'Deactivated'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(cust)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleToggleStatus(cust)} className="action-icon-btn" style={{ background: cust.is_active ? '#fff7ed' : '#f0fdf4', color: cust.is_active ? '#9a3412' : '#15803d' }}>
                                                    {cust.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                </button>
                                                <button onClick={() => handleDelete(cust)} className="action-icon-btn delete"><Trash2 size={18} /></button>
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
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium !max-w-[800px]">
                            <div className="drawer-header-premium !bg-slate-900 !text-white !border-none">
                                <div>
                                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase">{isEditing ? 'Modify Profile' : 'Onboard Profile'}</h3>
                                    <p className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-widest italic">Institutional CRM Registry</p>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                    <XCircle size={28} />
                                </button>
                            </div>
                            <div className="drawer-body-premium !bg-slate-50">
                                {error && (
                                    <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-700 font-black text-sm mb-10 shadow-xl shadow-rose-100/50">
                                        <div className="p-3 bg-rose-600 text-white rounded-2xl"><AlertCircle size={24} /></div>
                                        {error}
                                    </div>
                                )}

                                <form id="customer-form" onSubmit={handleSubmit} className="space-y-10 pb-10">
                                    <div className="premium-card bg-white p-10 rounded-[3rem] premium-shadow border border-slate-100">
                                        <div className="flex items-center gap-3 mb-8">
                                            <User className="text-indigo-600" size={24} />
                                            <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Primary Identity</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="form-group-premium col-span-full">
                                                <label>Global Personnel Label *</label>
                                                <input type="text" name="name" required className="input-premium !text-xl" placeholder="e.g. MICHAEL SCOFIELD" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Phone Architecture *</label>
                                                <div className="relative">
                                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="text" required className="input-premium !pl-12" placeholder="Primary link" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Mail Protocol</label>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="email" className="input-premium !pl-12" placeholder="Contact address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="premium-card bg-white p-10 rounded-[3rem] premium-shadow border border-slate-100">
                                            <div className="flex items-center gap-3 mb-8">
                                                <Activity className="text-indigo-600" size={24} />
                                                <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Financial Matrix</h4>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="form-group-premium">
                                                    <label>Opening Capital Balance (Dr/Cr)</label>
                                                    <div className="relative">
                                                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                        <input type="number" className="input-premium !pl-12" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Loyalty Points Weight</label>
                                                    <div className="relative">
                                                        <Award size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                        <input type="number" className="input-premium !pl-12" value={formData.loyalty_points} onChange={(e) => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) || 0 })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="premium-card bg-white p-10 rounded-[3rem] premium-shadow border border-slate-100">
                                            <div className="flex items-center gap-3 mb-8">
                                                <FileText className="text-indigo-600" size={24} />
                                                <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Legal Meta</h4>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="form-group-premium">
                                                    <label>GST Identification Reference</label>
                                                    <input type="text" className="input-premium uppercase" placeholder="GSTN-XXXX" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Geospatial Location (Address)</label>
                                                    <div className="relative">
                                                        <MapPin size={18} className="absolute left-4 top-4 text-slate-300" />
                                                        <textarea className="input-premium !pl-12 !h-24 !pt-4" placeholder="Full residential/corporate ref..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium !bg-slate-900 !border-white/5 !pb-10">
                                <button type="submit" form="customer-form" disabled={submitting} className="btn-premium-primary !bg-white !text-slate-900 !flex-1 !justify-center !py-6 !text-lg !rounded-[2.5rem] !shadow-none hover:!bg-indigo-500 hover:!text-white transition-all transform hover:scale-[0.98]">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'COMMIT MODIFICATIONS' : 'INITIALIZE PROFILE')}
                                </button>
                                <button onClick={() => setShowDrawer(false)} className="px-10 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-widest rounded-[2.5rem] border border-white/10 transition-all">TERMINATE</button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default CustomerMaster;
