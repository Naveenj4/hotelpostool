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
    Grid,
    AlertCircle,
    Filter,
    Activity,
    ChevronRight
} from 'lucide-react';

const CategoryMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'FOOD'
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

    const fetchCategories = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch categories", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/categories/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/categories`;

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
                throw new Error(result.error);
            }

            fetchCategories();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (category) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/categories/${category._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCategories();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${category._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchCategories();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err) {
            console.error('Error deleting category:', err);
            alert('An error occurred while deleting the category.');
        }
    };

    const handleEdit = (category) => {
        setFormData(category);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', type: 'FOOD' });
        setIsEditing(false);
        setError('');
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                                <Activity className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Hierarchy Management</span>
                            </div>
                            <h2>Category Creation</h2>
                            <p>Organize your menu into logical groups for better reporting.</p>
                        </div>
                        <button className="btn-premium-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={20} /> Add New Category
                        </button>
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search inventory categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 italic">
                                Scoped Result: {filteredCategories.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Category Entity</th>
                                    <th>Classification</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Querying Archives...</p>
                                        </td>
                                    </tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Grid size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No category definitions found.</p>
                                        </td>
                                    </tr>
                                ) : filteredCategories.map((cat) => (
                                    <tr key={cat._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Grid size={18} />
                                                </div>
                                                <span className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge-premium active" style={{
                                                backgroundColor: cat.type === 'FOOD' ? '#dcfce7' : cat.type === 'BEVERAGE' ? '#dbeafe' : '#f1f5f9',
                                                color: cat.type === 'FOOD' ? '#166534' : cat.type === 'BEVERAGE' ? '#1e40af' : '#475569'
                                            }}>
                                                {cat.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${cat.is_active ? 'active' : 'disabled'}`}>
                                                {cat.is_active ? 'Synchronized' : 'Offline'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(cat)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleToggleStatus(cat)} className="action-icon-btn" style={{ background: cat.is_active ? '#fff7ed' : '#f0fdf4', color: cat.is_active ? '#9a3412' : '#15803d' }}>
                                                    {cat.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                </button>
                                                <button onClick={() => handleDelete(cat)} className="action-icon-btn delete"><Trash2 size={18} /></button>
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
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Category' : 'Architect Category'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Master Entity Definition</p>
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
                                <form id="category-form" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="form-group-premium">
                                        <label>Identity Label *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-premium"
                                            placeholder="e.g. PREMIUM STARTERS"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Functional Classification *</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {['FOOD', 'BEVERAGE', 'OTHER'].map(type => (
                                                <label key={type} className={`cursor-pointer group relative overflow-hidden p-4 rounded-2xl border-2 transition-all block ${formData.type === type ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100 scale-105' : 'border-slate-100 hover:border-indigo-200'}`}>
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        className="hidden"
                                                        value={type}
                                                        checked={formData.type === type}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    />
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-xs font-black uppercase tracking-widest ${formData.type === type ? 'text-indigo-800' : 'text-slate-400'}`}>{type}</span>
                                                        <div className={`mt-2 w-2 h-2 rounded-full ${formData.type === type ? 'bg-indigo-600 scale-150 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-100'}`}></div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="category-form" disabled={submitting} className="btn-premium-primary flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Finalize Modification' : 'Deploy Category')}
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

export default CategoryMaster;
