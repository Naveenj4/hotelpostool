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
    Pocket,
    AlertCircle,
    Phone,
    UserCircle
} from 'lucide-react';

const CaptainMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [captains, setCaptains] = useState([]);
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

    const fetchCaptains = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/captains`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCaptains(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch captains", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCaptains();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/captains/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/captains`;

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

            fetchCaptains();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (captain) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/captains/${captain._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCaptains();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (captain) => {
        if (!window.confirm(`Are you sure you want to delete captain "${captain.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/captains/${captain._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchCaptains();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting captain:', err);
            alert('An error occurred while deleting the captain.');
        }
    };

    const handleEdit = (captain) => {
        setFormData(captain);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '' });
        setIsEditing(false);
        setError('');
    };

    const filteredCaptains = captains.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
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
                            <h2>Captain Master</h2>
                            <p>Manage order captains for service tracking.</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> Add Captain
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search captains..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">
                            Showing {filteredCaptains.length} captains
                        </span>
                    </div>

                    <div className="table-card" style={{ maxWidth: '800px' }}>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th>Captain Name</th>
                                    <th>Phone Number</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty-state"><Loader2 className="animate-spin mb-2 mx-auto" /> Loading...</td></tr>
                                ) : filteredCaptains.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-state">No captains found.</td></tr>
                                ) : filteredCaptains.map((cap, index) => (
                                    <tr key={cap._id}>
                                        <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{index + 1}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="captain-avatar">{cap.name.charAt(0).toUpperCase()}</div>
                                                {cap.name}
                                            </div>
                                        </td>
                                        <td>
                                            {cap.phone ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Phone size={14} color="#64748b" /> {cap.phone}
                                                </div>
                                            ) : 'No Number'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${cap.is_active ? 'status-active' : 'status-disabled'}`}>
                                                {cap.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => handleEdit(cap)} className="action-btn edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleToggleStatus(cap)} className={`action-btn ${cap.is_active ? 'delete' : 'restore'}`}>
                                                    {cap.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(cap)} className="action-btn delete">
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
                                    <Pocket size={20} style={{ display: 'inline', marginRight: '8px' }} />
                                    {isEditing ? 'Edit Captain' : 'Add New Captain'}
                                </h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                {error && <div className="error-box"><AlertCircle size={16} /> {error}</div>}
                                <form id="captain-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Captain Name *</label>
                                        <div className="input-with-icon">
                                            <UserCircle size={16} className="field-icon" />
                                            <input
                                                type="text"
                                                required
                                                className="input-field pad-left-icon"
                                                placeholder="e.g. Rahul Sharma"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Phone Number (Optional)</label>
                                        <div className="input-with-icon">
                                            <Phone size={16} className="field-icon" />
                                            <input
                                                type="text"
                                                className="input-field pad-left-icon"
                                                placeholder="10-digit mobile"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button type="submit" form="captain-form" disabled={submitting} className="btn-primary w-full p-3">
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Captain' : 'Save Captain')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                .captain-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }
                .input-with-icon {
                    position: relative;
                }
                .field-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .pad-left-icon {
                    padding-left: 38px !important;
                }
            `}</style>
        </div>
    );
};

export default CaptainMaster;
