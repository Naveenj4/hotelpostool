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
    User,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    FileText,
    DollarSign,
    Award
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
                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Customer Master</h2>
                            <p>Manage your restaurant's valued customers.</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> Add Customer
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">
                            Showing {filteredCustomers.length} customers
                        </span>
                    </div>

                    <div className="table-card" style={{ overflowX: 'auto' }}>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Customer Details</th>
                                    <th>Contact Info</th>
                                    <th>Loyalty / Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty-state"><Loader2 className="animate-spin mb-2 mx-auto" /> Loading...</td></tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-state">No customers found.</td></tr>
                                ) : filteredCustomers.map((cust) => (
                                    <tr key={cust._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{cust.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>GST: {cust.gst_number || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} /> {cust.phone || 'N/A'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} /> {cust.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#166534' }}>
                                                <Award size={12} /> {cust.loyalty_points} Points
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>Bal: ₹{cust.opening_balance}</div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${cust.is_active ? 'status-active' : 'status-disabled'}`}>
                                                {cust.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => handleEdit(cust)} className="action-btn edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleToggleStatus(cust)} className={`action-btn ${cust.is_active ? 'delete' : 'restore'}`}>
                                                    {cust.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(cust)} className="action-btn delete">
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
                        <div className="drawer-container" style={{ width: 'min(90vw, 500px)' }}>
                            <div className="drawer-header">
                                <h3 className="drawer-title">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                {error && <div className="error-box"><AlertCircle size={16} /> {error}</div>}
                                <form id="customer-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Customer Name *</label>
                                        <div className="input-with-icon">
                                            <User size={16} className="field-icon" />
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                className="input-field pad-left-icon"
                                                placeholder="e.g. Michael Scofield"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid-2-col">
                                        <div className="form-group mb-4">
                                            <label className="input-label">Phone Number *</label>
                                            <div className="input-with-icon">
                                                <Phone size={16} className="field-icon" />
                                                <input
                                                    type="text"
                                                    required
                                                    className="input-field pad-left-icon"
                                                    placeholder="9000000000"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="input-label">Email Address</label>
                                            <div className="input-with-icon">
                                                <Mail size={16} className="field-icon" />
                                                <input
                                                    type="email"
                                                    className="input-field pad-left-icon"
                                                    placeholder="michael@foxriver.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid-2-col">
                                        <div className="form-group mb-4">
                                            <label className="input-label">GST Number</label>
                                            <div className="input-with-icon">
                                                <FileText size={16} className="field-icon" />
                                                <input
                                                    type="text"
                                                    className="input-field pad-left-icon"
                                                    placeholder="Optional"
                                                    value={formData.gst_number}
                                                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group mb-4">
                                            <label className="input-label">Loyalty Points</label>
                                            <div className="input-with-icon">
                                                <Award size={16} className="field-icon" />
                                                <input
                                                    type="number"
                                                    className="input-field pad-left-icon"
                                                    value={formData.loyalty_points}
                                                    onChange={(e) => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Opening Balance (Dr/Cr)</label>
                                        <div className="input-with-icon">
                                            <DollarSign size={16} className="field-icon" />
                                            <input
                                                type="number"
                                                className="input-field pad-left-icon"
                                                placeholder="0.00"
                                                value={formData.opening_balance}
                                                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Address</label>
                                        <div className="input-with-icon">
                                            <MapPin size={16} className="field-icon" style={{ top: '12px', transform: 'none' }} />
                                            <textarea
                                                className="input-field pad-left-icon"
                                                style={{ height: '80px', paddingTop: '8px' }}
                                                placeholder="Residence address..."
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button type="submit" form="customer-form" disabled={submitting} className="btn-primary w-full p-3">
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Customer' : 'Save Customer')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                .grid-2-col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
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
                .restore {
                    color: #166534;
                    background: #dcfce7;
                }
                @media (max-width: 640px) {
                    .grid-2-col {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default CustomerMaster;
