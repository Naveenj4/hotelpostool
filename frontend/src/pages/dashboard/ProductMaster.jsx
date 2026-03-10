import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle,
    Search,
    Edit,
    Trash,
    CheckCircle2,
    XCircle,
    Package,
    AlertCircle,
    Loader2,
    Plus,
    Trash2,
    Clock,
    Layers,
    ShoppingCart,
    Tag,
    Image as ImageIcon,
    Check,
    Download,
    Upload,
    Activity,
    ChevronRight,
    ArrowRight,
    Eye,
    EyeOff
} from 'lucide-react';
import { TableSkeleton } from '../../components/Skeleton';

const ProductMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const fileInputRef = useRef(null);

    const initialFormState = {
        code: '',
        barcode: '',
        name: '',
        short_name: '',
        print_name: '',
        category: '',
        brand: '',
        food_type: 'NONE',
        item_nature: 'GOOD',
        product_type: 'BUY_SELL',
        purchase_price: 0,
        cost_price: 0,
        selling_price: 0,
        mrp: 0,
        gst_sales: 0,
        gst_purchase: 0,
        hsn_code: '',
        opening_stock: 0,
        stock_value: 0,
        min_stock: 0,
        max_stock: 0,
        reorder_level: 0,
        urgent_order_level: 0,
        available_timings: [
            { label: 'Morning', start_time: '08:00', end_time: '12:00', enabled: true },
            { label: 'Afternoon', start_time: '12:00', end_time: '16:00', enabled: true },
            { label: 'Evening', start_time: '16:00', end_time: '23:00', enabled: true }
        ],
        addons: [],
        variations: [],
        serve_types: {
            dine_in: true,
            delivery: true,
            parcel: true,
            order: true
        },
        image: '',
        is_active: true
    };

    const [formData, setFormData] = useState(initialFormState);

    const getBaseUrl = () => {
        const fullUrl = import.meta.env.VITE_API_URL;
        return fullUrl.replace('/api', '');
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [prodRes, catRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/products`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/categories`, { headers })
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();

            if (prodData.success) setProducts(prodData.data);
            if (catData.success) setCategories(catData.data);

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportCSV = () => {
        if (!products.length) return;
        const headers = Object.keys(products[0]).filter(k => typeof products[0][k] !== 'object').join(',');
        const rows = products.map(p => Object.keys(p).filter(k => typeof p[k] !== 'object').map(k => p[k]).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Enterprise_Product_Master.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCSVImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            const items = lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim());
                return obj;
            }).filter(i => i.name);

            try {
                const savedUser = localStorage.getItem('user');
                const { token } = JSON.parse(savedUser);
                await Promise.all(items.map(item =>
                    fetch(`${import.meta.env.VITE_API_URL}/products`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ ...initialFormState, ...item })
                    })
                ));
                fetchData();
            } catch (err) { alert("Import failed: " + err.message); }
            finally { setLoading(false); }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        const value = (parseFloat(formData.purchase_price) || 0) * (parseFloat(formData.opening_stock) || 0);
        setFormData(prev => ({ ...prev, stock_value: value.toFixed(2) }));
    }, [formData.purchase_price, formData.opening_stock]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleServeTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            serve_types: { ...prev.serve_types, [type]: !prev.serve_types[type] }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/products/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/products`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            fetchData();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fData = new FormData();
        fData.append('image', file);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fData
            });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, image: result.data }));
            } else {
                throw new Error(result.message || 'Unknown upload error');
            }
        } catch (err) {
            console.error("Upload Error:", err);
            setError('Upload failed: ' + err.message);
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (product) => {
        setFormData({ ...initialFormState, ...product, serve_types: product.serve_types || initialFormState.serve_types });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this master item?")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setError('');
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Global Item Registry</span>
                            </div>
                            <h2>Inventory Master</h2>
                            <p>Configure SKU details, pricing matrix, and replenishment rules.</p>
                        </div>
                        <div className="flex gap-3">
                            <label className="btn-premium-outline cursor-pointer border-dashed">
                                <Upload size={18} />
                                <span className="text-xs uppercase font-black">Bulk Deployment</span>
                                <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                            </label>
                            <button className="btn-premium-outline" onClick={exportCSV}>
                                <Download size={18} />
                                <span className="text-xs uppercase font-black">Archive Export</span>
                            </button>
                            <button className="btn-premium-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                                <PlusCircle size={20} /> Add Master Item
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search inventory repository..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Registry</span>
                                <span className="text-xl font-black text-slate-800">{filteredProducts.length} <span className="text-xs text-slate-300">Units</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Inventory Essence</th>
                                    <th>Classification</th>
                                    <th>Pricing Matrix</th>
                                    <th>Stock Delta</th>
                                    <th>Food Meta</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Data Cluster...</p>
                                        </td>
                                    </tr>
                                ) : filteredProducts.map(p => (
                                    <tr key={p._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {p.image ? (
                                                        <img src={`${getBaseUrl()}${p.image}`} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:shadow-md transition-all group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-all">
                                                            <Package size={24} />
                                                        </div>
                                                    )}
                                                    {p.current_stock <= p.reorder_level && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-slate-800 leading-[1.1] uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{p.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5"><ChevronRight size={10} className="text-indigo-300" /> ID: {p.code || 'NULL'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge-premium active" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{p.category}</span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-400">SALE</span>
                                                <span className="text-lg font-black text-indigo-600 leading-none">₹{p.selling_price.toLocaleString()}</span>
                                                <span className="text-[10px] font-bold text-rose-300 mt-1">COST: ₹{p.purchase_price}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`p-2 rounded-xl border flex flex-col items-center justify-center min-w-[70px] ${p.current_stock > p.reorder_level ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'}`}>
                                                <span className={`text-xl font-black ${p.current_stock > p.reorder_level ? 'text-emerald-700' : 'text-rose-700'}`}>{p.current_stock}</span>
                                                <span className="text-[8px] font-black uppercase text-slate-400">In Reserve</span>
                                            </div>
                                        </td>
                                        <td>
                                            {p.food_type !== 'NONE' ? (
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${p.food_type === 'VEG' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${p.food_type === 'VEG' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.5)]'}`}></div>
                                                    {p.food_type.replace('_', ' ')}
                                                </div>
                                            ) : <span className="text-slate-200">N/A</span>}
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${p.is_active ? 'active' : 'disabled'}`}>
                                                {p.is_active ? 'Online' : 'Halted'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(p)} className="action-icon-btn edit shadow-sm"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(p._id)} className="action-icon-btn delete shadow-sm"><Trash size={18} /></button>
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
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] animate-in fade-in transition-all" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium !max-w-[1000px]">
                            <div className="drawer-header">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                                            <Package size={14} />
                                        </div>
                                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Item Architect</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">{isEditing ? 'Reconfigure Master' : 'Create New SKU'}</h3>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all">
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div className="drawer-body">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 font-medium text-sm mb-6 shadow-sm">
                                        <AlertCircle size={20} />
                                        {error}
                                    </div>
                                )}

                                <form id="product-form" onSubmit={handleSubmit} className="space-y-8 pb-10">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                            <Layers className="text-indigo-600" size={20} />
                                            <h4 className="text-lg font-bold text-slate-800">Physical Identity</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="form-group-premium col-span-2">
                                                <label>Global Item Label *</label>
                                                <input type="text" name="name" required className="input-premium" placeholder="e.g. ORGANIC TRUFFLE OIL" value={formData.name} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Registry ID</label>
                                                <input type="text" name="code" className="input-premium" placeholder="ITM-99" value={formData.code} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Classification *</label>
                                                <select name="category" required className="input-premium" value={formData.category} onChange={handleInputChange}>
                                                    <option value="">Select Domain</option>
                                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                            <div className="form-group-premium">
                                                <label>Print Identity</label>
                                                <input type="text" name="print_name" className="input-premium" placeholder="Short Name for Bills" value={formData.print_name} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Food Classification</label>
                                                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                                    {['VEG', 'NON_VEG', 'NONE'].map(type => (
                                                        <button key={type} type="button" onClick={() => setFormData(p => ({ ...p, food_type: type }))} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${formData.food_type === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{type.replace('_', ' ')}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Item Nature</label>
                                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                                    {['GOOD', 'SERVICE'].map(n => (
                                                        <button key={n} type="button" onClick={() => setFormData(p => ({ ...p, item_nature: n }))} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${formData.item_nature === n ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{n}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <Tag className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Pricing Matrix</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                {formData.item_nature !== 'SERVICE' && (
                                                    <div className="form-group-premium">
                                                        <label>Procurement Rate</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                            <input type="number" name="purchase_price" className="input-premium !pl-8" value={formData.purchase_price} onChange={handleInputChange} />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`form-group-premium ${formData.item_nature === 'SERVICE' ? 'col-span-2' : ''}`}>
                                                    <label>External MRP</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                        <input type="number" name="mrp" className="input-premium !pl-8" value={formData.mrp} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium col-span-2">
                                                    <label className="!text-indigo-600">Enterprise Sales Value *</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-lg">₹</span>
                                                        <input type="number" name="selling_price" required className="input-premium !pl-8 !text-xl !py-2 !bg-indigo-50/50 !border-indigo-200 !text-indigo-900" value={formData.selling_price} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Tax Bracket (GST%)</label>
                                                    <input type="number" name="gst_sales" className="input-premium" value={formData.gst_sales} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Audit HSN Ref</label>
                                                    <input type="text" name="hsn_code" className="input-premium" placeholder="HSN-000" value={formData.hsn_code} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <ShoppingCart className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Reserve Logistics</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                {formData.item_nature !== 'SERVICE' && (
                                                    <div className="form-group-premium">
                                                        <label>Opening Inventory</label>
                                                        <input type="number" name="opening_stock" className="input-premium" value={formData.opening_stock} onChange={handleInputChange} />
                                                    </div>
                                                )}
                                                <div className={`form-group-premium ${formData.item_nature === 'SERVICE' ? 'col-span-2' : ''}`}>
                                                    <label>Reorder Threshold</label>
                                                    <input type="number" name="reorder_level" className="input-premium" value={formData.reorder_level} onChange={handleInputChange} />
                                                </div>
                                                {formData.item_nature !== 'SERVICE' && (
                                                    <>
                                                        <div className="form-group-premium">
                                                            <label>Minimum Stable Reserve</label>
                                                            <input type="number" name="min_stock" className="input-premium" value={formData.min_stock} onChange={handleInputChange} />
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Maximum Storage Capacity</label>
                                                            <input type="number" name="max_stock" className="input-premium" value={formData.max_stock} onChange={handleInputChange} />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            {formData.item_nature !== 'SERVICE' && (
                                                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Asset Valuation</span>
                                                    <h5 className="text-xl font-bold text-emerald-600">₹{formData.stock_value.toLocaleString()}</h5>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <Clock className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Temporal Availability</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                                {formData.available_timings.map((t, i) => (
                                                    <div key={i} className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${t.enabled ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className={`text-sm font-bold ${t.enabled ? 'text-indigo-800' : 'text-slate-500'}`}>{t.label}</span>
                                                            <button type="button" onClick={() => {
                                                                const nt = [...formData.available_timings];
                                                                nt[i].enabled = !nt[i].enabled;
                                                                setFormData(p => ({ ...p, available_timings: nt }));
                                                            }} className={`w-6 h-6 rounded flex items-center justify-center transition-all ${t.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}>
                                                                {t.enabled ? <Check size={14} /> : <XCircle size={14} />}
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Begin</span>
                                                                <input type="time" className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-medium" value={t.start_time} onChange={(e) => {
                                                                    const nt = [...formData.available_timings];
                                                                    nt[i].start_time = e.target.value;
                                                                    setFormData(p => ({ ...p, available_timings: nt }));
                                                                }} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Terminate</span>
                                                                <input type="time" className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-medium" value={t.end_time} onChange={(e) => {
                                                                    const nt = [...formData.available_timings];
                                                                    nt[i].end_time = e.target.value;
                                                                    setFormData(p => ({ ...p, available_timings: nt }));
                                                                }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex flex-col h-full">
                                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                    <ImageIcon className="text-indigo-600" size={20} />
                                                    <h4 className="text-lg font-bold text-slate-800">Visual Asset</h4>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <div
                                                        className="w-40 h-40 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center relative group overflow-hidden mb-6 cursor-pointer"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        {formData.image ? (
                                                            <img src={`${getBaseUrl()}${formData.image}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        ) : (
                                                            <Package size={48} className="text-slate-300" />
                                                        )}
                                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                            <div className="text-center group-hover:translate-y-0 translate-y-2 transition-transform">
                                                                <Upload size={24} className="text-white mx-auto mb-1" />
                                                                <span className="text-white font-medium text-xs">Upload Image</span>
                                                            </div>
                                                        </div>
                                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" title="Upload Image" />
                                                    </div>
                                                </div>
                                                <div className="mt-auto">
                                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                                                        <span className="text-sm font-semibold text-slate-700">Item Status</span>
                                                        <button type="button" onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${formData.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                                                            {formData.is_active ? (
                                                                <><CheckCircle2 size={14} /> Active</>
                                                            ) : (
                                                                <><EyeOff size={14} /> Inactive</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button onClick={() => setShowDrawer(false)} className="btn-premium-outline">Cancel</button>
                                <button type="submit" form="product-form" disabled={submitting || uploading} className="btn-premium-primary">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Create Item')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ProductMaster;
