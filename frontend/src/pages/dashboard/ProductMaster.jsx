import { useState, useEffect } from 'react';
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
            if (result.success) setFormData(prev => ({ ...prev, image: result.data }));
        } catch (err) { setError('Upload failed: ' + err.message); }
        finally { setUploading(false); }
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
                        <div className="drawer-premium !max-w-[1100px]">
                            <div className="drawer-header-premium !bg-slate-900 !text-white !border-none">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1 bg-indigo-600 rounded">
                                            <Package size={14} className="text-white" />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Item Architect</span>
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tighter uppercase">{isEditing ? 'Reconfigure Master' : 'Create New SKU'}</h3>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                    <XCircle size={28} />
                                </button>
                            </div>
                            <div className="drawer-body-premium !bg-slate-50">
                                {error && (
                                    <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-700 font-black text-sm mb-10 shadow-xl shadow-rose-100/50">
                                        <div className="p-3 bg-rose-600 text-white rounded-2xl"><AlertCircle size={24} /></div>
                                        {error}
                                    </div>
                                )}

                                <form id="product-form" onSubmit={handleSubmit} className="space-y-12 pb-10">
                                    <div className="premium-card bg-white p-10 rounded-[3rem] premium-shadow border border-slate-100">
                                        <div className="flex items-center gap-3 mb-8">
                                            <Layers className="text-indigo-600" size={24} />
                                            <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Physical Identity</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                            <div className="form-group-premium col-span-2">
                                                <label>Global Item Label *</label>
                                                <input type="text" name="name" required className="input-premium !text-xl" placeholder="e.g. ORGANIC TRUFFLE OIL" value={formData.name} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Registry ID</label>
                                                <input type="text" name="code" className="input-premium" placeholder="ITM-99" value={formData.code} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Classification *</label>
                                                <select name="category" required className="input-premium" value={formData.category} onChange={handleInputChange}>
                                                    <option value="">Select Domain</option>
                                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                                            <div className="form-group-premium">
                                                <label>Print Identity</label>
                                                <input type="text" name="print_name" className="input-premium" placeholder="Short Name for Bills" value={formData.print_name} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Food Classification</label>
                                                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                                    {['VEG', 'NON_VEG', 'NONE'].map(type => (
                                                        <button key={type} type="button" onClick={() => setFormData(p => ({ ...p, food_type: type }))} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.food_type === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{type.replace('_', ' ')}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Item Nature</label>
                                                <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                                                    {['GOOD', 'SERVICE'].map(n => (
                                                        <button key={n} type="button" onClick={() => setFormData(p => ({ ...p, item_nature: n }))} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.item_nature === n ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{n}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        <div className="premium-card bg-white p-10 rounded-[3rem] premium-shadow border border-slate-100">
                                            <div className="flex items-center gap-3 mb-8">
                                                <Tag className="text-indigo-600" size={24} />
                                                <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Pricing Matrix</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="form-group-premium">
                                                    <label>Procurement Rate</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                                                        <input type="number" name="purchase_price" className="input-premium !pl-10" value={formData.purchase_price} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>External MRP</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                                                        <input type="number" name="mrp" className="input-premium !pl-10" value={formData.mrp} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium col-span-2">
                                                    <label className="!text-indigo-600">Enterprise Sales Value *</label>
                                                    <div className="relative">
                                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300 font-black text-2xl">₹</span>
                                                        <input type="number" name="selling_price" required className="input-premium !pl-12 !text-3xl !py-4 !bg-indigo-50/30 !border-indigo-100 !text-indigo-900" value={formData.selling_price} onChange={handleInputChange} />
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

                                        <div className="premium-card bg-white p-10 rounded-[3rem] premium-shadow border border-slate-100">
                                            <div className="flex items-center gap-3 mb-8">
                                                <ShoppingCart className="text-indigo-600" size={24} />
                                                <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Reserve Logistics</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="form-group-premium">
                                                    <label>Opening Inventory</label>
                                                    <input type="number" name="opening_stock" className="input-premium" value={formData.opening_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Reorder Threshold</label>
                                                    <input type="number" name="reorder_level" className="input-premium" value={formData.reorder_level} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Minimum Stable Reserve</label>
                                                    <input type="number" name="min_stock" className="input-premium" value={formData.min_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Maximum Storage Capacity</label>
                                                    <input type="number" name="max_stock" className="input-premium" value={formData.max_stock} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                            <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Valuation</p>
                                                <h5 className="text-2xl font-black text-emerald-400">₹{formData.stock_value.toLocaleString()}</h5>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                                        <div className="lg:col-span-3 premium-card bg-white p-10 rounded-[3rem] premium-shadow border border-slate-100 flex flex-col">
                                            <div className="flex justify-between items-center mb-10">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="text-indigo-600" size={24} />
                                                    <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Temporal Availability</h4>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                                                {formData.available_timings.map((t, i) => (
                                                    <div key={i} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between ${t.enabled ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50 opacity-40'}`}>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <span className={`text-base font-black uppercase tracking-tighter ${t.enabled ? 'text-indigo-900' : 'text-slate-400'}`}>{t.label}</span>
                                                            <button type="button" onClick={() => {
                                                                const nt = [...formData.available_timings];
                                                                nt[i].enabled = !nt[i].enabled;
                                                                setFormData(p => ({ ...p, available_timings: nt }));
                                                            }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${t.enabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
                                                                {t.enabled ? <Check size={16} /> : <XCircle size={16} />}
                                                            </button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Begin</span>
                                                                <input type="time" className="w-full bg-white/50 border-none p-2 rounded-xl text-xs font-black" value={t.start_time} onChange={(e) => {
                                                                    const nt = [...formData.available_timings];
                                                                    nt[i].start_time = e.target.value;
                                                                    setFormData(p => ({ ...p, available_timings: nt }));
                                                                }} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminate</span>
                                                                <input type="time" className="w-full bg-white/50 border-none p-2 rounded-xl text-xs font-black" value={t.end_time} onChange={(e) => {
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

                                        <div className="lg:col-span-2 premium-card bg-slate-900 p-10 rounded-[3rem] shadow-2xl overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="flex items-center gap-3 mb-10">
                                                    <ImageIcon className="text-indigo-400" size={24} />
                                                    <h4 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Visual Asset</h4>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <div className="w-56 h-56 bg-white/5 rounded-[3rem] border-2 border-white/10 flex items-center justify-center relative group backdrop-blur-sm overflow-hidden mb-8">
                                                        {formData.image ? (
                                                            <img src={`${getBaseUrl()}${formData.image}`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        ) : (
                                                            <Package size={80} className="text-white/10" />
                                                        )}
                                                        <label className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/60 transition-all flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100">
                                                            <div className="text-center group-hover:translate-y-0 translate-y-4 transition-transform">
                                                                <Upload size={40} className="text-white mx-auto mb-2" />
                                                                <span className="text-white font-black uppercase text-[10px] tracking-widest">Update Visual</span>
                                                            </div>
                                                            <input type="file" onChange={handleFileChange} className="hidden" />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="mt-auto">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Availability Switch</p>
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))} className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${formData.is_active ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}>
                                                        {formData.is_active ? (
                                                            <><Eye size={20} /> Active Master</>
                                                        ) : (
                                                            <><EyeOff size={20} /> Dark Master</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium !bg-slate-900 !border-white/5 !pb-10">
                                <button type="submit" form="product-form" disabled={submitting || uploading} className="btn-premium-primary !bg-white !text-slate-900 !flex-1 !justify-center !py-6 !text-lg !rounded-[2.5rem] !shadow-none hover:!bg-indigo-500 hover:!text-white transition-all transform hover:scale-[0.98]">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'COMMIT MODIFICATIONS' : 'DEPLOY MASTER ITEM')}
                                </button>
                                <button onClick={() => setShowDrawer(false)} className="px-10 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-widest rounded-[2.5rem] border border-white/10 transition-all">TERMINATE</button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ProductMaster;
