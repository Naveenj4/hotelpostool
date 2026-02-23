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
    Grid,
    AlertCircle
} from 'lucide-react';

const CategoryMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
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
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState);
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
            fetchCategories(); // Refresh list to show updated status
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
                fetchCategories(); // Refresh list to show updated categories
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
            <Sidebar isCollapsed={isCollapsed} />
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Category Master</h2>
                            <p>Manage product categories for your menu.</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> Add Category
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">
                            Showing {filteredCategories.length} categories
                        </span>
                    </div>

                    <div className="table-card">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="empty-state"><Loader2 className="animate-spin mb-2 mx-auto" /> Loading...</td></tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr><td colSpan="4" className="empty-state">No categories found.</td></tr>
                                ) : filteredCategories.map((cat) => (
                                    <tr key={cat._id}>
                                        <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                        <td>
                                            <span className="type-badge" style={{
                                                backgroundColor: cat.type === 'FOOD' ? '#dcfce7' : '#dbeafe',
                                                color: cat.type === 'FOOD' ? '#166534' : '#1e40af'
                                            }}>
                                                {cat.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${cat.is_active ? 'status-active' : 'status-disabled'}`}>
                                                {cat.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => handleEdit(cat)} className="action-btn edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleToggleStatus(cat)} className={`action-btn ${cat.is_active ? 'delete' : 'restore'}`}>
                                                    {cat.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(cat)} className="action-btn delete">
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
                                <h3 className="drawer-title">{isEditing ? 'Edit Category' : 'Add New Category'}</h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                {error && <div className="error-box"><AlertCircle size={16} /> {error}</div>}
                                <form id="category-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Category Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="input-field"
                                            placeholder="e.g. Starters"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Type *</label>
                                        <div className="radio-group">
                                            {['FOOD', 'BEVERAGE', 'OTHER'].map(type => (
                                                <label key={type} className={`radio-option ${formData.type === type ? 'selected-stock' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value={type}
                                                        checked={formData.type === type}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    />
                                                    {type}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button type="submit" form="category-form" disabled={submitting} className="btn-primary w-full p-3">
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Category' : 'Save Category')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CategoryMaster;
