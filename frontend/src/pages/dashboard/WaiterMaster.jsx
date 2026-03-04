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
    Pocket,
    AlertCircle,
    Phone,
    UserCircle,
    Smartphone,
    Users
} from 'lucide-react';

const WaiterMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [waiters, setWaiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
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

    const fetchWaiters = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/waiters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setWaiters(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch waiters", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWaiters();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/waiters/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/waiters`;

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

            fetchWaiters();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (waiter) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/waiters/${waiter._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchWaiters();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (waiter) => {
        if (!window.confirm(`Are you sure you want to delete waiter "${waiter.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/waiters/${waiter._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchWaiters();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting waiter:', err);
            alert('An error occurred while deleting the waiter.');
        }
    };

    const handleEdit = (waiter) => {
        setFormData(waiter);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '' });
        setIsEditing(false);
        setError('');
    };

    const filteredWaiters = waiters.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.phone?.includes(searchTerm)
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
                                <Users className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Service Force Matrix</span>
                            </div>
                            <h2>Waiter Master</h2>
                            <p>Manage serving personnel and floor service logistics.</p>
                        </div>
                        <button className="btn-premium-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={20} /> Register New Waiter
                        </button>
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search service personnel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 italic">
                                Scoped Result: {filteredWaiters.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Service Identity</th>
                                    <th>Communication Ref</th>
                                    <th>Registry Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Personnel Files...</p>
                                        </td>
                                    </tr>
                                ) : filteredWaiters.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <UserCircle size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No personnel records found.</p>
                                        </td>
                                    </tr>
                                ) : filteredWaiters.map((waiter) => (
                                    <tr key={waiter._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {waiter.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{waiter.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5 italic">Service Personnel</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {waiter.phone ? (
                                                <div className="flex items-center gap-2 text-slate-600 font-black tracking-widest">
                                                    <Smartphone size={14} className="text-slate-300" />
                                                    {waiter.phone}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-200 tracking-widest">NO COMMS REGISTERED</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${waiter.is_active ? 'active' : 'disabled'}`}>
                                                {waiter.is_active ? 'VERIFIED' : 'DEACTIVATED'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(waiter)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleToggleStatus(waiter)} className="action-icon-btn" style={{ background: waiter.is_active ? '#fff7ed' : '#f0fdf4', color: waiter.is_active ? '#9a3412' : '#15803d' }}>
                                                    {waiter.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                </button>
                                                <button onClick={() => handleDelete(waiter)} className="action-icon-btn delete"><Trash2 size={18} /></button>
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
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Personnel' : 'Architect Personnel'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Service Force Registry</p>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all">
                                    <XCircle size={24} className="text-slate-300" />
                                </button>
                            </div>
                            <div className="drawer-body-premium">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-8 animate-in fade-in duration-300">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="waiter-form" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="form-group-premium">
                                        <label>Personnel Identifier Label *</label>
                                        <div className="relative">
                                            <UserCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                required
                                                className="input-premium !pl-12"
                                                placeholder="e.g. RAMESH"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Secure Communication Ref</label>
                                        <div className="relative">
                                            <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                className="input-premium !pl-12"
                                                placeholder="10-digit primary contact"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="waiter-form" disabled={submitting} className="btn-premium-primary flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'COMMIT PERSONNEL' : 'DEPLOY PERSONNEL')}
                                </button>
                                <button onClick={() => setShowDrawer(false)} className="btn-premium-outline">Discard</button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default WaiterMaster;
