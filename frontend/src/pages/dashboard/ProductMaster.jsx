import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './ProductMaster.css'; // Import the specific CSS
import {
    PlusCircle,
    Search,
    MoreVertical,
    Edit,
    Trash,
    CheckCircle2,
    XCircle,
    Package,
    AlertCircle,
    Loader2
} from 'lucide-react';

const ProductMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        product_type: 'TYPE_A', // Default
        selling_price: '',
        purchase_price: '',
        opening_stock: '',
        image: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [categories, setCategories] = useState([]);

    // Fetch Products & Categories
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

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

            if (!result.success) {
                throw new Error(result.message);
            }

            fetchData();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (product) => {
        setFormData(product);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const handleDisable = async (id) => {
        if (!window.confirm("Are you sure you want to toggle this product's status?")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/products/${id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Are you sure you want to delete the product "${product.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${product._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchData(); // Refresh list to show updated products
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            alert('An error occurred while deleting the product.');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: '',
            product_type: 'TYPE_A',
            selling_price: '',
            purchase_price: '',
            opening_stock: '',
            image: ''
        });
        setIsEditing(false);
        setError('');
    };

    // Filter Products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} />

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Product Master</h2>
                            <p>Manage your menu items and stock.</p>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ gap: '0.5rem' }}
                            onClick={() => { resetForm(); setShowDrawer(true); }}
                        >
                            <PlusCircle size={18} /> Add Product
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="count-badge">
                            Showing {filteredProducts.length} products
                        </span>
                    </div>

                    {/* Table */}
                    <div className="table-card">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="empty-state"><Loader2 className="animate-spin mb-2 mx-auto" /> Loading products...</td></tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-state">
                                            <Package size={48} className="empty-icon mx-auto" />
                                            <p>No products found matching your search.</p>
                                        </td>
                                    </tr>
                                ) : filteredProducts.map((product) => (
                                    <tr key={product._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                                                        <Package size={20} color="#9ca3af" />
                                                    </div>
                                                )}
                                                <span style={{ fontWeight: 600 }}>{product.name}</span>
                                            </div>
                                        </td>
                                        <td><span className="count-badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>{product.category}</span></td>
                                        <td>
                                            {product.product_type === 'TYPE_A' ? (
                                                <span className="type-badge type-stock">Stock Item</span>
                                            ) : (
                                                <span className="type-badge type-direct">Direct Sale</span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 700 }}>₹{product.selling_price}</td>
                                        <td>
                                            {product.product_type === 'TYPE_A' ? (
                                                <span className={`stock-level ${product.current_stock < 10 ? 'stock-low' : 'stock-ok'}`}>
                                                    {product.current_stock}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#9ca3af' }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${product.is_active ? 'status-active' : 'status-disabled'}`}>
                                                {product.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => handleEdit(product)} className="action-btn edit" title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDisable(product._id)} className={`action-btn ${product.is_active ? 'delete' : 'restore'}`} title={product.is_active ? "Disable" : "Enable"}>
                                                    {product.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(product)} className="action-btn delete" title="Delete">
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Drawer / Modal for Add/Edit */}
                {showDrawer && (
                    <div className="drawer-overlay">
                        <div className="drawer-backdrop" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-container">
                            <div className="drawer-header">
                                <h3 className="drawer-title">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                                <button onClick={() => setShowDrawer(false)} className="close-btn">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="drawer-body">
                                {error && (
                                    <div className="error-box">
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}

                                <form id="product-form" onSubmit={handleSubmit}>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="input-field"
                                            placeholder="e.g. Veg Burger"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Category *</label>
                                        <select
                                            name="category"
                                            required
                                            className="input-field"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat.name}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group mb-6">
                                        <label className="input-label">Product Type *</label>
                                        {isEditing ? (
                                            <div className="static-badge">
                                                {formData.product_type === 'TYPE_A' ? 'Stock Managed (Type A)' : 'Direct Sale (Type B)'}
                                            </div>
                                        ) : (
                                            <div className="radio-group">
                                                <label className={`radio-option ${formData.product_type === 'TYPE_A' ? 'selected-stock' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="product_type"
                                                        value="TYPE_A"
                                                        checked={formData.product_type === 'TYPE_A'}
                                                        onChange={handleInputChange}
                                                    />
                                                    Stock Managed
                                                </label>
                                                <label className={`radio-option ${formData.product_type === 'TYPE_B' ? 'selected-stock' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="product_type"
                                                        value="TYPE_B"
                                                        checked={formData.product_type === 'TYPE_B'}
                                                        onChange={handleInputChange}
                                                    />
                                                    Direct Sale
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-grid-pair mb-4">
                                        <div className="form-group">
                                            <label className="input-label">Selling Price *</label>
                                            <input
                                                type="number"
                                                name="selling_price"
                                                required
                                                min="0"
                                                className="input-field"
                                                placeholder="₹ 0.00"
                                                value={formData.selling_price}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        {formData.product_type === 'TYPE_A' && (
                                            <div className="form-group">
                                                <label className="input-label">Purchase Price *</label>
                                                <input
                                                    type="number"
                                                    name="purchase_price"
                                                    required
                                                    min="0"
                                                    className="input-field"
                                                    placeholder="₹ 0.00"
                                                    value={formData.purchase_price}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {formData.product_type === 'TYPE_A' && !isEditing && (
                                        <div className="form-group mb-4">
                                            <label className="input-label">Opening Stock *</label>
                                            <div className="input-relative">
                                                <Package size={18} className="input-icon" style={{ left: '0.8rem' }} />
                                                <input
                                                    type="number"
                                                    name="opening_stock"
                                                    required
                                                    min="0"
                                                    className="input-field pad-left"
                                                    placeholder="0"
                                                    value={formData.opening_stock}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group mb-4">
                                        <label className="input-label">Product Image URL</label>
                                        <input
                                            type="text"
                                            name="image"
                                            className="input-field"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.image}
                                            onChange={handleInputChange}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Provide a direct link to the product image.</p>
                                    </div>
                                </form>
                            </div>

                            <div className="drawer-footer">
                                <button
                                    type="submit"
                                    form="product-form"
                                    disabled={submitting}
                                    className="btn-primary w-full"
                                    style={{ padding: '0.875rem' }}
                                >
                                    {submitting ? (
                                        <>Updating...</>
                                    ) : (
                                        isEditing ? 'Update Product' : 'Save Product'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProductMaster;
