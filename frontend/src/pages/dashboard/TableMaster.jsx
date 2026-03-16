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
    Users,
    Activity,
    Layers
} from 'lucide-react';

const TableMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [captains, setCaptains] = useState([]);
    const [waiters, setWaiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        table_number: '',
        seating_capacity: 4,
        captain: '',
        waiter: '',
        table_type: 'G Floor',
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

            const [tableRes, typeRes, captRes, waitRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/tables`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/table-types`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/captains`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/waiters`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const tableData = await tableRes.json();
            const typeData = await typeRes.json();
            const captData = await captRes.json();
            const waitData = await waitRes.json();

            if (tableData.success) setTables(tableData.data);
            if (typeData.success) setTableTypes(typeData.data);
            if (captData.success) setCaptains(captData.data);
            if (waitData.success) setWaiters(waitData.data);

        } catch (err) {
            console.error("Failed to fetch data", err);
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
        setFormData({ table_number: '', seating_capacity: 4, captain: '', waiter: '', table_type: 'G Floor', status: 'AVAILABLE' });
        setIsEditing(false);
        setError('');
    };

    const filteredTables = tables.filter(t =>
        t.table_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'AVAILABLE': return { bg: '#dcfce7', text: '#166534', label: 'OPTIMAL' };
            case 'OCCUPIED': return { bg: '#fee2e2', text: '#991b1b', label: 'ENGAGED' };
            case 'RESERVED': return { bg: '#fef9c3', text: '#854d0e', label: 'COMMITTED' };
            case 'MAINTENANCE': return { bg: '#f1f5f9', text: '#475569', label: 'OFFLINE' };
            default: return { bg: '#f1f5f9', text: '#475569', label: 'UNKNOWN' };
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

                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Layers className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Floor Logic Architect</span>
                            </div>
                            <h2>Table Creation</h2>
                            <p>Spatial configuration and seating capacity management.</p>
                        </div>
                        <button className="btn-premium-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={20} /> Add New Table
                        </button>
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search spatial identifiers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Floor Capacity</span>
                                <span className="text-xl font-black text-slate-800">{filteredTables.reduce((acc, t) => acc + t.seating_capacity, 0)} <span className="text-xs text-slate-300">Guests</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {loading ? (
                            Array(10).fill(0).map((_, i) => (
                                <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[2rem]"></div>
                            ))
                        ) : filteredTables.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <Grid size={80} className="text-slate-100 mx-auto mb-6" />
                                <p className="text-xl font-black text-slate-300 uppercase tracking-[0.2em]">Floor Void Detected</p>
                            </div>
                        ) : filteredTables.map(table => (
                            <div key={table._id} className={`group relative bg-white rounded-[2.5rem] border-2 transition-all p-2 ${table.is_active ? 'border-slate-50 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-2' : 'border-slate-100 opacity-50 grayscale'}`}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover:bg-indigo-600 transition-colors">
                                            <span className="text-xl font-black">{table.table_number.charAt(0)}</span>
                                        </div>
                                        <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-100">{table.table_type || 'G Floor'}</span>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">{table.table_number}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                                            <Users size={14} />
                                            <span className="text-xs font-bold uppercase tracking-widest">{table.seating_capacity} Persons</span>
                                        </div>
                                    </div>

                                    {(table.captain || table.waiter) && (
                                        <div className="mb-4 flex flex-col gap-1">
                                            {table.captain && <div className="text-xs font-bold text-slate-500 uppercase">C: <span className="text-slate-700">{table.captain}</span></div>}
                                            {table.waiter && <div className="text-xs font-bold text-slate-500 uppercase">W: <span className="text-slate-700">{table.waiter}</span></div>}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em]" style={{
                                            backgroundColor: getStatusStyle(table.status).bg,
                                            color: getStatusStyle(table.status).text
                                        }}>
                                            {getStatusStyle(table.status).label}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 rounded-[2rem] p-2 mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(table)} className="action-icon-btn edit flex-1 !h-12"><Edit size={18} /></button>
                                    <button onClick={() => handleToggleStatus(table)} className="action-icon-btn flex-1 !h-12" style={{ background: '#fff', border: '1px solid #f1f5f9', color: table.is_active ? '#9a3412' : '#15803d' }}>
                                        {table.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                    </button>
                                    <button onClick={() => handleDelete(table)} className="action-icon-btn delete flex-1 !h-12"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium">
                            <div className="drawer-header-premium">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Spatial Unit' : 'Configure Spatial Unit'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Floor Master Definition</p>
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
                                <form id="table-form" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Table Name *</label>
                                            <input
                                                type="text"
                                                required
                                                className="input-premium"
                                                placeholder="e.g. G1"
                                                value={formData.table_number}
                                                onChange={(e) => setFormData({ ...formData, table_number: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Persons</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                value={formData.seating_capacity}
                                                onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Captain</label>
                                            <select
                                                className="input-premium"
                                                value={formData.captain}
                                                onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                                            >
                                                <option value="">-- Select Captain --</option>
                                                {captains.map(c => (
                                                    <option key={c._id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Waiter</label>
                                            <select
                                                className="input-premium"
                                                value={formData.waiter}
                                                onChange={(e) => setFormData({ ...formData, waiter: e.target.value })}
                                            >
                                                <option value="">-- Select Waiter --</option>
                                                {waiters.map(w => (
                                                    <option key={w._id} value={w.name}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Table Type</label>
                                        <div className="relative">
                                            <Layers size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <select
                                                className="input-premium !pl-12 !appearance-none"
                                                value={formData.table_type}
                                                onChange={(e) => setFormData({ ...formData, table_type: e.target.value })}
                                            >
                                                <option value="">-- Select Table Type --</option>
                                                {tableTypes.map(type => (
                                                    <option key={type._id} value={type.name}>{type.name}</option>
                                                ))}
                                                {tableTypes.length === 0 && (
                                                    <option disabled>No types yet — create in Table Type Master</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group-premium hidden">
                                        <label>Operational Status</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map(st => (
                                                <button key={st} type="button" onClick={() => setFormData({ ...formData, status: st })} className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.status === st ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 text-slate-400'}`}>
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="table-form" disabled={submitting} className="btn-premium-primary flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Commit Configuration' : 'Launch Unit')}
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

export default TableMaster;
