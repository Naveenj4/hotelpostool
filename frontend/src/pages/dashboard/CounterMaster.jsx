import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './ProductMaster.css'; // Reusing ProductMaster styles for consistency
import {
    PlusCircle,
    Search,
    Edit,
    Loader2,
    Store,
    AlertCircle,
    XCircle
} from 'lucide-react';

const CounterMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [counters, setCounters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'BILLING'
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

    const fetchCounters = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/counters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCounters(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch counters", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounters();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/counters/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/counters`;

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

            fetchCounters();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (counter) => {
        setFormData(counter);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', code: '', type: 'BILLING' });
        setIsEditing(false);
        setError('');
    };

    const filteredCounters = counters.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
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
                            <h2>Counter Master</h2>
                            <p>Manage billing counters and kiosks.</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> Add Counter
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search counters..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">
                            Showing {filteredCounters.length} counters
                        </span>
                    </div>

                    <div className="table-card">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Counter Name</th>
                                    <th>Code</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty-state"><Loader2 className="animate-spin mb-2 mx-auto" /> Loading...</td></tr>
                                ) : filteredCounters.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-state">No counters found.</td></tr>
                                ) : filteredCounters.map((counter) => (
                                    <tr key={counter._id}>
                                        <td style={{ fontWeight: 600 }}>{counter.name}</td>
                                        <td><span className="count-badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>{counter.code}</span></td>
                                        <td>
                                            <span className="type-badge" style={{
                                                backgroundColor: counter.type === 'BILLING' ? '#e0e7ff' : '#fce7f3',
                                                color: counter.type === 'BILLING' ? '#3730a3' : '#9d174d'
                                            }}>
                                                {counter.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${counter.is_active ? 'status-active' : 'status-disabled'}`}>
                                                {counter.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => handleEdit(counter)} className="action-btn edit">
                                                    <Edit size={16} />
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
                                <h3 className="drawer-title">{isEditing ? 'Edit Counter' : 'Add New Counter'}</h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                {error && <div className="error-box"><AlertCircle size={16} /> {error}</div>}
                                <form id="counter-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Counter Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="input-field"
                                            placeholder="e.g. Main Counter"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Counter Code *</label>
                                        <div className="input-relative">
                                            <Store size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                name="code"
                                                required
                                                className="input-field pad-left uppercase"
                                                placeholder="e.g. C01"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Type *</label>
                                        <div className="radio-group">
                                            {['BILLING', 'SELF_SERVICE', 'TAKEAWAY'].map(type => (
                                                <label key={type} className={`radio-option ${formData.type === type ? 'selected-stock' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value={type}
                                                        checked={formData.type === type}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    />
                                                    {type.replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button type="submit" form="counter-form" disabled={submitting} className="btn-primary w-full p-3">
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Counter' : 'Save Counter')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CounterMaster;
