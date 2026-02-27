import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './ProductMaster.css';
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
    Check
} from 'lucide-react';
import { TableSkeleton } from '../../components/Skeleton';

const ProductMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
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

    // Auto-calculate stock value
    useEffect(() => {
        const value = (parseFloat(formData.purchase_price) || 0) * (parseFloat(formData.opening_stock) || 0);
        setFormData(prev => ({
            ...prev,
            stock_value: value.toFixed(2)
        }));
    }, [formData.purchase_price, formData.opening_stock]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleServeTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            serve_types: {
                ...prev.serve_types,
                [type]: !prev.serve_types[type]
            }
        }));
    };

    const handleTimingChange = (index, field, value) => {
        const newTimings = [...formData.available_timings];
        newTimings[index][field] = field === 'enabled' ? !newTimings[index][field] : value;
        setFormData(prev => ({ ...prev, available_timings: newTimings }));
    };

    const addAddon = () => {
        setFormData(prev => ({
            ...prev,
            addons: [...prev.addons, { name: '', rate: 0 }]
        }));
    };

    const removeAddon = (index) => {
        const newAddons = formData.addons.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, addons: newAddons }));
    };

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        newAddons[index][field] = value;
        setFormData(prev => ({ ...prev, addons: newAddons }));
    };

    const addVariation = () => {
        setFormData(prev => ({
            ...prev,
            variations: [...prev.variations, { name: '', amount: 0 }]
        }));
    };

    const removeVariation = (index) => {
        const newVars = formData.variations.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, variations: newVars }));
    };

    const handleVariationChange = (index, field, value) => {
        const newVars = [...formData.variations];
        newVars[index][field] = value;
        setFormData(prev => ({ ...prev, variations: newVars }));
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            if (!result.success) throw new Error(result.message);
            setFormData(prev => ({ ...prev, image: result.data }));
        } catch (err) {
            setError('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (product) => {
        setFormData({
            ...initialFormState,
            ...product,
            // Ensure nested objects preserve their structure if product is missing them
            serve_types: product.serve_types || initialFormState.serve_types
        });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;
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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} />
            <main className="dashboard-main">
                <Header toggleSidebar={() => {
                    const ns = !isCollapsed;
                    setIsCollapsed(ns);
                    localStorage.setItem('sidebarCollapsed', ns);
                }} />

                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Item Creation</h2>
                            <p>Manage your menu items, pricing, and stock levels.</p>
                        </div>
                        <button className="btn-primary" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} /> Add New Item
                        </button>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or category..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">Total Items: {filteredProducts.length}</span>
                    </div>

                    <div className="table-card">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Item Details</th>
                                    <th>Category</th>
                                    <th>Rates (P/S)</th>
                                    <th>Stock</th>
                                    <th>Food Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableSkeleton rows={8} cols={7} />
                                ) : filteredProducts.map(p => (
                                    <tr key={p._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {p.image ? (
                                                    <img src={`${getBaseUrl()}${p.image}`} alt="" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Package size={20} color="#94a3b8" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.code || 'No Code'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="count-badge" style={{ fontSize: '0.85rem' }}>{p.category}</span></td>
                                        <td>
                                            <div style={{ fontSize: '0.9rem' }}>
                                                <span style={{ color: '#64748b' }}>₹{p.purchase_price}</span> /
                                                <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}> ₹{p.selling_price}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`status-badge ${p.current_stock > p.reorder_level ? 'status-active' : 'status-disabled'}`} style={{ fontFamily: 'monospace' }}>
                                                {p.current_stock}
                                            </div>
                                        </td>
                                        <td>
                                            {p.food_type === 'VEG' ? (
                                                <div className="food-type-tag food-type-veg active" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                                    <div className="indicator-dot veg-dot"></div> VEG
                                                </div>
                                            ) : p.food_type === 'NON_VEG' ? (
                                                <div className="food-type-tag food-type-nonveg active" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                                    <div className="indicator-dot nonveg-dot"></div> NON-VEG
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${p.is_active ? 'status-active' : 'status-disabled'}`}>
                                                {p.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => handleEdit(p)} className="action-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(p._id)} className="action-btn delete"><Trash size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <div className="drawer-overlay">
                        <div className="drawer-backdrop" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-container">
                            <div className="drawer-header">
                                <h3 className="drawer-title">{isEditing ? 'Edit Item' : 'New Item Creation'}</h3>
                                <button className="close-btn" onClick={() => setShowDrawer(false)}><XCircle size={28} /></button>
                            </div>

                            <form className="drawer-body" onSubmit={handleSubmit}>
                                {error && <div className="error-box" style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}><AlertCircle size={18} /> {error}</div>}

                                {/* Basic Info Section */}
                                <div className="form-section">
                                    <div className="section-title"><Layers size={18} /> General Information</div>
                                    <div className="grid-row-4">
                                        <div className="form-group">
                                            <label className="input-label">Item Code</label>
                                            <input type="text" name="code" className="input-field" placeholder="P001" value={formData.code} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Barcode</label>
                                            <input type="text" name="barcode" className="input-field" placeholder="12345678" value={formData.barcode} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="input-label">Item Name *</label>
                                            <input type="text" name="name" required className="input-field" placeholder="Full Item Name" value={formData.name} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="grid-row-4" style={{ marginTop: '1rem' }}>
                                        <div className="form-group">
                                            <label className="input-label">Short Name</label>
                                            <input type="text" name="short_name" className="input-field" placeholder="Short Name" value={formData.short_name} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Print Name</label>
                                            <input type="text" name="print_name" className="input-field" placeholder="Name on Bill" value={formData.print_name} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Category *</label>
                                            <select name="category" required className="input-field" value={formData.category} onChange={handleInputChange}>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Brand</label>
                                            <input type="text" name="brand" className="input-field" placeholder="Brand Name" value={formData.brand} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="grid-row-2" style={{ marginTop: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="input-label">Food Type</label>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <div className={`food-type-tag food-type-veg ${formData.food_type === 'VEG' ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, food_type: 'VEG' }))}>
                                                    <div className="indicator-dot veg-dot"></div> VEG
                                                </div>
                                                <div className={`food-type-tag food-type-nonveg ${formData.food_type === 'NON_VEG' ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, food_type: 'NON_VEG' }))}>
                                                    <div className="indicator-dot nonveg-dot"></div> NON-VEG
                                                </div>
                                                <div className={`food-type-tag ${formData.food_type === 'NONE' ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, food_type: 'NONE' }))}>
                                                    NONE
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Item Nature</label>
                                            <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.5rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="radio" name="item_nature" value="GOOD" checked={formData.item_nature === 'GOOD'} onChange={handleInputChange} /> Good
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="radio" name="item_nature" value="SERVICE" checked={formData.item_nature === 'SERVICE'} onChange={handleInputChange} /> Service
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Section */}
                                <div className="form-section">
                                    <div className="section-title"><Tag size={18} /> Pricing & Tax</div>
                                    <div className="grid-row-4">
                                        <div className="form-group">
                                            <label className="input-label">Purchase Rate</label>
                                            <input type="number" name="purchase_price" className="input-field" value={formData.purchase_price} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Cost Rate</label>
                                            <input type="number" name="cost_price" className="input-field" value={formData.cost_price} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Sales Rate *</label>
                                            <input type="number" name="selling_price" required className="input-field" value={formData.selling_price} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">MRP</label>
                                            <input type="number" name="mrp" className="input-field" value={formData.mrp} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="grid-row-4" style={{ marginTop: '1rem' }}>
                                        <div className="form-group">
                                            <label className="input-label">GST Sales (%)</label>
                                            <input type="number" name="gst_sales" className="input-field" value={formData.gst_sales} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">GST Purchase (%)</label>
                                            <input type="number" name="gst_purchase" className="input-field" value={formData.gst_purchase} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="input-label">HSN Code</label>
                                            <input type="text" name="hsn_code" className="input-field" placeholder="GST HSN Code" value={formData.hsn_code} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Section */}
                                <div className="form-section">
                                    <div className="section-title"><ShoppingCart size={18} /> Stock Management</div>
                                    <div className="grid-row-3">
                                        <div className="form-group">
                                            <label className="input-label">Opening Stock</label>
                                            <input type="number" name="opening_stock" className="input-field" value={formData.opening_stock} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Stock Value</label>
                                            <input type="number" name="stock_value" className="input-field" value={formData.stock_value} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            {/* Stock level button logic integrated below */}
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Level Rules</div>
                                        <div className="grid-row-4">
                                            <div className="form-group">
                                                <label className="input-label">Min Stock</label>
                                                <input type="number" name="min_stock" className="input-field" value={formData.min_stock} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label className="input-label">Max Stock</label>
                                                <input type="number" name="max_stock" className="input-field" value={formData.max_stock} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label className="input-label">Reorder Level</label>
                                                <input type="number" name="reorder_level" className="input-field" value={formData.reorder_level} onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label className="input-label">Urgent Order</label>
                                                <input type="number" name="urgent_order_level" className="input-field" value={formData.urgent_order_level} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Variations & Addons */}
                                <div className="grid-row-2">
                                    <div className="form-section" style={{ marginBottom: 0 }}>
                                        <div className="section-title"><Layers size={18} /> Variations</div>
                                        <table className="sub-table">
                                            <thead>
                                                <tr><th>Variant Name</th><th>Amount</th><th></th></tr>
                                            </thead>
                                            <tbody>
                                                {formData.variations.map((v, i) => (
                                                    <tr key={i}>
                                                        <td><input type="text" className="mini-input" value={v.name} onChange={(e) => handleVariationChange(i, 'name', e.target.value)} /></td>
                                                        <td><input type="number" className="mini-input" value={v.amount} onChange={(e) => handleVariationChange(i, 'amount', e.target.value)} /></td>
                                                        <td><Trash2 size={16} className="remove-btn" onClick={() => removeVariation(i)} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button type="button" className="add-row-btn" onClick={addVariation}><Plus size={16} /> Add Variant</button>
                                    </div>

                                    <div className="form-section" style={{ marginBottom: 0 }}>
                                        <div className="section-title"><Plus size={18} /> Addons</div>
                                        <table className="sub-table">
                                            <thead>
                                                <tr><th>Addon Item</th><th>Rate</th><th></th></tr>
                                            </thead>
                                            <tbody>
                                                {formData.addons.map((a, i) => (
                                                    <tr key={i}>
                                                        <td><input type="text" className="mini-input" value={a.name} onChange={(e) => handleAddonChange(i, 'name', e.target.value)} /></td>
                                                        <td><input type="number" className="mini-input" value={a.rate} onChange={(e) => handleAddonChange(i, 'rate', e.target.value)} /></td>
                                                        <td><Trash2 size={16} className="remove-btn" onClick={() => removeAddon(i)} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button type="button" className="add-row-btn" onClick={addAddon}><Plus size={16} /> Add Addon</button>
                                    </div>
                                </div>

                                {/* Timings & Serve Setup */}
                                <div className="form-section" style={{ marginTop: '1.5rem' }}>
                                    <div className="section-title"><Clock size={18} /> Available Timings</div>
                                    <div className="grid-row-3">
                                        {formData.available_timings.map((t, i) => (
                                            <div key={i} style={{ opacity: t.enabled ? 1 : 0.5, border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.label}</span>
                                                    <input type="checkbox" checked={t.enabled} onChange={() => handleTimingChange(i, 'enabled')} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input type="time" className="mini-input" value={t.start_time} onChange={(e) => handleTimingChange(i, 'start_time', e.target.value)} />
                                                    <input type="time" className="mini-input" value={t.end_time} onChange={(e) => handleTimingChange(i, 'end_time', e.target.value)} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Image & Serve Type */}
                                <div className="form-section">
                                    <div className="section-title"><ImageIcon size={18} /> Presentation & Delivery</div>
                                    <div className="grid-row-2">
                                        <div className="form-group">
                                            <label className="input-label">Item Image</label>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {formData.image && <img src={`${getBaseUrl()}${formData.image}`} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
                                                <input type="file" onChange={handleFileChange} disabled={uploading} className="input-field" style={{ padding: '0.5rem' }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Item Availability</label>
                                            <label className="checkbox-card" style={{ background: formData.is_active ? '#dcfce7' : '#f1f5f9' }}>
                                                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                                <span>{formData.is_active ? 'AVAILABLE' : 'NOT AVAILABLE'}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.5rem' }}>
                                        <label className="input-label">Serve Types</label>
                                        <div className="serve-type-grid">
                                            {Object.keys(formData.serve_types).map(type => (
                                                <div key={type} className={`checkbox-card ${formData.serve_types[type] ? 'active' : ''}`} onClick={() => handleServeTypeChange(type)}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: formData.serve_types[type] ? 'var(--primary-600)' : 'white' }}>
                                                        {formData.serve_types[type] && <Check size={14} color="white" />}
                                                    </div>
                                                    <span style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="drawer-footer">
                                <button className="btn-primary" style={{ flex: 1, padding: '1rem' }} onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Update Item' : 'Create Item')}
                                </button>
                                <button className="btn-outline" style={{ padding: '1rem' }} onClick={() => setShowDrawer(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProductMaster;
