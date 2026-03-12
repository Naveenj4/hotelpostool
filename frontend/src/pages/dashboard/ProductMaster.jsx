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
    const [brands, setBrands] = useState([]);
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
        unit: '',
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
        online_order: false,
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

            const [prodRes, catRes, brandRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/products`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/categories`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/brands`, { headers })
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();
            const brandData = await brandRes.json();

            if (prodData.success) setProducts(prodData.data);
            if (catData.success) setCategories(catData.data);
            if (brandData.success) setBrands(brandData.data);

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

    const handleAddAddon = () => {
        setFormData(prev => ({ ...prev, addons: [...prev.addons, { name: '', rate: 0 }] }));
    };

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        newAddons[index][field] = value;
        setFormData(prev => ({ ...prev, addons: newAddons }));
    };

    const handleRemoveAddon = (index) => {
        setFormData(prev => ({ ...prev, addons: prev.addons.filter((_, i) => i !== index) }));
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
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                            <Layers className="text-indigo-600" size={20} />
                                            <h4 className="text-lg font-bold text-slate-800">Primary Product Configuration</h4>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            {/* Image Upload Column */}
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className="w-48 h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative group overflow-hidden cursor-pointer hover:border-indigo-400 transition-all"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    {formData.image ? (
                                                        <img src={`${getBaseUrl()}${formData.image}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="text-center p-4">
                                                            <ImageIcon size={40} className="text-slate-300 mx-auto mb-2" />
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tap to Upload<br/>Product Photo</p>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                        <div className="text-center group-hover:translate-y-0 translate-y-2 transition-transform">
                                                            <Upload size={24} className="text-white mx-auto mb-1" />
                                                            <span className="text-white font-bold text-[10px] uppercase tracking-widest">Update Photo</span>
                                                        </div>
                                                    </div>
                                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                                </div>
                                                <div className="mt-4 flex gap-4 w-full">
                                                    <div className="flex-1 p-2 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Online</span>
                                                        <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                            <input type="checkbox" className="sr-only peer" checked={formData.online_order} onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))} />
                                                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                        </label>
                                                    </div>
                                                    <div className="flex-1 p-2 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Active</span>
                                                        <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                            <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Fields Column */}
                                            <div className="flex-1">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    <div className="form-group-premium">
                                                        <label>Item Name *</label>
                                                        <input type="text" name="name" required className="input-premium" placeholder="e.g. Traditional Margherita" value={formData.name} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="form-group-premium">
                                                            <label>Item Code</label>
                                                            <input type="text" name="code" className="input-premium" placeholder="AUTO" value={formData.code} onChange={handleInputChange} />
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Barcode</label>
                                                            <input type="text" name="barcode" className="input-premium" placeholder="SCAN" value={formData.barcode} onChange={handleInputChange} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    <div className="form-group-premium">
                                                        <label>Category *</label>
                                                        <select name="category" required className="input-premium" value={formData.category} onChange={handleInputChange}>
                                                            <option value="">Select</option>
                                                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Brand</label>
                                                        <select name="brand" className="input-premium" value={formData.brand} onChange={handleInputChange}>
                                                            <option value="">Select</option>
                                                            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Food Type</label>
                                                        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                                            <button type="button" onClick={() => setFormData(p => ({ ...p, food_type: 'VEG' }))} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black transition-all ${formData.food_type === 'VEG' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> VEG
                                                            </button>
                                                            <button type="button" onClick={() => setFormData(p => ({ ...p, food_type: 'NON_VEG' }))} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black transition-all ${formData.food_type === 'NON_VEG' ? 'bg-white text-rose-600 shadow-sm border border-rose-200' : 'text-slate-400 hover:text-rose-600'}`}>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> NON
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Unit</label>
                                                        <input type="text" name="unit" className="input-premium" placeholder="PCS / KG" value={formData.unit} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>HSN</label>
                                                        <input type="text" name="hsn_code" className="input-premium" placeholder="HSN" value={formData.hsn_code} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <Tag className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Pricing Details</h4>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div className="form-group-premium">
                                                    <label>Purchase Rate</label>
                                                    <input type="number" name="purchase_price" className="input-premium" value={formData.purchase_price} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Cost Rate</label>
                                                    <input type="number" name="cost_price" className="input-premium" value={formData.cost_price} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>MRP</label>
                                                    <input type="number" name="mrp" className="input-premium" value={formData.mrp} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Sales Rate *</label>
                                                    <input type="number" name="selling_price" required className="input-premium font-bold text-indigo-700 bg-indigo-50/30" value={formData.selling_price} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>GST Purchase (%)</label>
                                                    <input type="number" name="gst_purchase" className="input-premium" value={formData.gst_purchase} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>GST Sales (%)</label>
                                                    <input type="number" name="gst_sales" className="input-premium" value={formData.gst_sales} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>HSN Code</label>
                                                    <input type="text" name="hsn_code" className="input-premium" value={formData.hsn_code} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Unit</label>
                                                    <input type="text" name="unit" className="input-premium" placeholder="e.g. PCS, KG" value={formData.unit} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <ShoppingCart className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Stock Details & Level</h4>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6 pb-6 border-b border-slate-100">
                                                <div className="form-group-premium">
                                                    <label>Opening Stock</label>
                                                    <input type="number" name="opening_stock" className="input-premium" value={formData.opening_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Stock Value</label>
                                                    <input type="number" disabled className="input-premium bg-slate-50 text-emerald-700 font-bold" value={formData.stock_value} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div className="form-group-premium">
                                                    <label>Maximum</label>
                                                    <input type="number" name="max_stock" className="input-premium" value={formData.max_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Minimum</label>
                                                    <input type="number" name="min_stock" className="input-premium" value={formData.min_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Re-order</label>
                                                    <input type="number" name="reorder_level" className="input-premium" value={formData.reorder_level} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Urgent</label>
                                                    <input type="number" name="urgent_order_level" className="input-premium" value={formData.urgent_order_level} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <Plus className="text-indigo-600" size={20} />
                                                    <h4 className="text-lg font-bold text-slate-800">Addons (Example: Pizza)</h4>
                                                </div>
                                                <button type="button" onClick={handleAddAddon} className="btn-premium-outline !py-1 !px-3 !text-xs">
                                                    <Plus size={14} /> Add row
                                                </button>
                                            </div>
                                            {formData.addons.length > 0 ? (
                                                <div className="space-y-3">
                                                    {formData.addons.map((addon, idx) => (
                                                        <div key={idx} className="flex gap-4 items-center">
                                                            <div className="form-group-premium flex-1 !mb-0">
                                                                <input type="text" placeholder="Item Name (e.g. Small)" className="input-premium" value={addon.name} onChange={(e) => handleAddonChange(idx, 'name', e.target.value)} />
                                                            </div>
                                                            <div className="form-group-premium flex-1 !mb-0">
                                                                <input type="number" placeholder="Rate (e.g. 200)" className="input-premium" value={addon.rate} onChange={(e) => handleAddonChange(idx, 'rate', parseFloat(e.target.value) || 0)} />
                                                            </div>
                                                            <button type="button" onClick={() => handleRemoveAddon(idx)} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-lg mt-1 transition-colors">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                                    No addons configured. Click 'Add row' to create.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
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
