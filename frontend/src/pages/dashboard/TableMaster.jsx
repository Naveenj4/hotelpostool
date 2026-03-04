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
    AlertCircle,
    Users
} from 'lucide-react';

const TableMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        table_number: '',
        seating_capacity: 4,
        status: 'AVAILABLE'
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

    const fetchTables = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/tables`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTables(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch tables", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/tables/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/tables`;

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

            fetchTables();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (table) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTables();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (table) => {
        if (!window.confirm(`Are you sure you want to delete table "${table.table_number}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchTables();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting table:', err);
            alert('An error occurred while deleting the table.');
        }
    };

    const handleEdit = (table) => {
        setFormData(table);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ table_number: '', seating_capacity: 4, status: 'AVAILABLE' });
        setIsEditing(false);
        setError('');
    };

    const filteredTables = tables.filter(t =>
        t.table_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'AVAILABLE': return { bg: '#dcfce7', text: '#166534' };
            case 'OCCUPIED': return { bg: '#fee2e2', text: '#991b1b' };
            case 'RESERVED': return { bg: '#fef9c3', text: '#854d0e' };
            case 'MAINTENANCE': return { bg: '#f1f5f9', text: '#475569' };
            default: return { bg: '#f1f5f9', text: '#475569' };
        }
    };

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
                            <h2>Table Master</h2>
                            <p>Setup and manage restaurant floor seating.</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> Add Table
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search table numbers..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">
                            Showing {filteredTables.length} tables
                        </span>
                    </div>

                    <div className="table-grid">
                        {loading ? (
                            <div className="empty-state w-full"><Loader2 className="animate-spin mb-2 mx-auto" /> Loading...</div>
                        ) : filteredTables.length === 0 ? (
                            <div className="empty-state w-full">No tables configured.</div>
                        ) : (
                            filteredTables.map(table => (
                                <div key={table._id} className={`table-box ${table.is_active ? '' : 'inactive-box'}`}>
                                    <div className="table-inner">
                                        <div className="table-id">#{table.table_number}</div>
                                        <div className="table-seats">
                                            <Users size={14} /> {table.seating_capacity} Seats
                                        </div>
                                        <div className="status-indicator" style={{
                                            backgroundColor: getStatusStyle(table.status).bg,
                                            color: getStatusStyle(table.status).text
                                        }}>
                                            {table.status}
                                        </div>
                                    </div>
                                    <div className="table-actions">
                                        <button onClick={() => handleEdit(table)} className="action-circle edit"><Edit size={14} /></button>
                                        <button onClick={() => handleToggleStatus(table)} className={`action-circle ${table.is_active ? 'delete' : 'restore'}`}>
                                            {table.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                                        </button>
                                        <button onClick={() => handleDelete(table)} className="action-circle delete"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Drawer */}
                {showDrawer && (
                    <div className="drawer-overlay">
                        <div className="drawer-backdrop" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-container">
                            <div className="drawer-header">
                                <h3 className="drawer-title">{isEditing ? 'Edit Table' : 'Add New Table'}</h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                {error && <div className="error-box"><AlertCircle size={16} /> {error}</div>}
                                <form id="table-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Table Number / Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            placeholder="e.g. T-10 or Balcony-1"
                                            value={formData.table_number}
                                            onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Seating Capacity</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={formData.seating_capacity}
                                            onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Initial Status</label>
                                        <select
                                            className="input-field"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="AVAILABLE">AVAILABLE</option>
                                            <option value="OCCUPIED">OCCUPIED</option>
                                            <option value="RESERVED">RESERVED</option>
                                            <option value="MAINTENANCE">MAINTENANCE</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button type="submit" form="table-form" disabled={submitting} className="btn-primary w-full p-3">
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Table' : 'Save Table')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                .table-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1rem;
                }
                .table-box {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    transition: all 0.2s;
                }
                .table-box:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    transform: translateY(-2px);
                }
                .table-inner {
                    padding: 1.25rem;
                    text-align: center;
                }
                .table-id {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 0.25rem;
                }
                .table-seats {
                    font-size: 0.85rem;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    margin-bottom: 0.75rem;
                }
                .status-indicator {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 999px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.025em;
                }
                .table-actions {
                    display: flex;
                    border-top: 1px solid #f1f5f9;
                    background: #f8fafc;
                }
                .action-circle {
                    flex: 1;
                    padding: 8px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    border-right: 1px solid #f1f5f9;
                }
                .action-circle:last-child { border-right: none; }
                .action-circle.edit:hover { background: #dbeafe; color: #1e40af; }
                .action-circle.delete:hover { background: #fee2e2; color: #b91c1c; }
                .action-circle.restore:hover { background: #dcfce7; color: #166534; }
                .inactive-box {
                    opacity: 0.6;
                    filter: grayscale(0.5);
                }
            `}</style>
        </div>
    );
};

export default TableMaster;
