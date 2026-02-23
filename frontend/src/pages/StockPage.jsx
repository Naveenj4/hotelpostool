import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './StockPage.css';
import {
    Search,
    Package,
    AlertTriangle,
    Save,
    Edit3,
    RefreshCw,
    Check
} from 'lucide-react';

const StockPage = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [products, setProducts] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [bulkValue, setBulkValue] = useState('');

    // Fetch stock data
    const fetchData = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [stockRes, lowStockRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/stock`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/products/low-stock`, { headers })
            ]);

            const stockData = await stockRes.json();
            const lowStockData = await lowStockRes.json();

            if (stockData.success) setProducts(stockData.data);
            if (lowStockData.success) setLowStockItems(lowStockData.data);
        } catch (err) {
            console.error("Failed to fetch stock data", err);
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

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle stock update
    const handleStockUpdate = async (productId, newStock) => {
        if (newStock < 0) return;

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/stock/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ current_stock: parseInt(newStock) })
            });

            const result = await response.json();
            if (result.success) {
                fetchData(); // Refresh data
                setEditingId(null);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (err) {
            console.error('Update stock error:', err);
            alert('Failed to update stock');
        }
    };

    // Handle bulk update
    const handleBulkUpdate = async () => {
        if (selectedItems.size === 0 || bulkValue === '') return;

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const updates = Array.from(selectedItems).map(productId => ({
                productId,
                current_stock: parseInt(bulkValue)
            }));

            const response = await fetch(`${import.meta.env.VITE_API_URL}/stock/bulk-update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ updates })
            });

            const result = await response.json();
            if (result.success) {
                fetchData(); // Refresh data
                setSelectedItems(new Set());
                setBulkValue('');
                setBulkMode(false);
                alert(result.message);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (err) {
            console.error('Bulk update error:', err);
            alert('Failed to update stock');
        }
    };

    // Toggle item selection in bulk mode
    const toggleSelection = (productId) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedItems(newSelected);
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar isCollapsed={isCollapsed} />
                <main className="dashboard-main">
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="dashboard-content">
                        <div className="loading-container">
                            <RefreshCw className="animate-spin" size={32} />
                            <p>Loading stock data...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} />
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Stock Management</h2>
                            <p>Manage and track your inventory levels</p>
                        </div>
                        <div className="header-actions">
                            <button
                                className={`btn-secondary ${bulkMode ? 'btn-active' : ''}`}
                                onClick={() => setBulkMode(!bulkMode)}
                            >
                                {bulkMode ? 'Cancel Bulk Edit' : 'Bulk Update'}
                            </button>
                            <button className="btn-primary" onClick={fetchData}>
                                <RefreshCw size={18} /> Refresh
                            </button>
                        </div>
                    </div>

                    <div className="stock-layout">
                        {/* Main Stock Table */}
                        <div className="stock-main">
                            {/* Search Bar */}
                            <div className="search-container">
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

                            {/* Bulk Update Controls */}
                            {bulkMode && (
                                <div className="bulk-controls">
                                    <div className="bulk-input">
                                        <input
                                            type="number"
                                            placeholder="New stock value"
                                            className="input-field"
                                            value={bulkValue}
                                            onChange={(e) => setBulkValue(e.target.value)}
                                            min="0"
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={handleBulkUpdate}
                                            disabled={selectedItems.size === 0 || bulkValue === ''}
                                        >
                                            Update {selectedItems.size} Items
                                        </button>
                                    </div>
                                    <p className="bulk-info">
                                        {selectedItems.size} items selected
                                    </p>
                                </div>
                            )}

                            {/* Stock Table */}
                            <div className="table-card">
                                <table className="custom-table stock-table">
                                    <thead>
                                        <tr>
                                            {bulkMode && <th>Select</th>}
                                            <th>Product Name</th>
                                            <th>Category</th>
                                            <th>Current Stock</th>
                                            <th>Alert Level</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={bulkMode ? 6 : 5} className="empty-state">
                                                    <Package size={48} className="empty-icon mx-auto" />
                                                    <p>No stock-managed products found</p>
                                                </td>
                                            </tr>
                                        ) : filteredProducts.map((product) => (
                                            <tr
                                                key={product._id}
                                                className={product.current_stock < 10 ? 'low-stock-row' : ''}
                                            >
                                                {bulkMode && (
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.has(product._id)}
                                                            onChange={() => toggleSelection(product._id)}
                                                        />
                                                    </td>
                                                )}
                                                <td style={{ fontWeight: 600 }}>{product.name}</td>
                                                <td>
                                                    <span className="category-badge">{product.category}</span>
                                                </td>
                                                <td>
                                                    {editingId === product._id ? (
                                                        <div className="edit-stock">
                                                            <input
                                                                type="number"
                                                                className="input-field"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                min="0"
                                                                autoFocus
                                                            />
                                                            <button
                                                                className="save-btn"
                                                                onClick={() => handleStockUpdate(product._id, editValue)}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`stock-display ${product.current_stock < 10 ? 'stock-low' : 'stock-normal'}`}>
                                                            {product.current_stock}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {product.current_stock < 10 ? (
                                                        <span className="alert-badge low">
                                                            <AlertTriangle size={14} /> Low Stock
                                                        </span>
                                                    ) : product.current_stock < 20 ? (
                                                        <span className="alert-badge medium">
                                                            Medium
                                                        </span>
                                                    ) : (
                                                        <span className="alert-badge good">
                                                            Good
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {editingId !== product._id && (
                                                        <button
                                                            className="edit-btn"
                                                            onClick={() => {
                                                                setEditingId(product._id);
                                                                setEditValue(product.current_stock.toString());
                                                            }}
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Low Stock Panel */}
                        <div className="stock-sidebar">
                            <div className="data-card">
                                <h3 className="card-title">
                                    <AlertTriangle size={20} color="#ef4444" />
                                    Low Stock Alerts
                                </h3>
                                <div className="low-stock-list">
                                    {lowStockItems.length === 0 ? (
                                        <div className="no-alerts">
                                            <Check size={24} color="#10b981" />
                                            <p>All stock levels are healthy</p>
                                        </div>
                                    ) : (
                                        lowStockItems.map((item) => (
                                            <div
                                                key={item._id}
                                                className="low-stock-item"
                                                onClick={() => {
                                                    // Scroll to item in table and start editing
                                                    const rowElement = document.querySelector(`tr[data-product-id="${item._id}"]`);
                                                    if (rowElement) {
                                                        rowElement.scrollIntoView({ behavior: 'smooth' });
                                                        setEditingId(item._id);
                                                        setEditValue(item.current_stock.toString());
                                                    }
                                                }}
                                            >
                                                <div className="item-info">
                                                    <div className="item-name">{item.name}</div>
                                                    <div className="item-category">{item.category}</div>
                                                </div>
                                                <div className="item-stock">
                                                    <span className="stock-number">{item.current_stock}</span>
                                                    <span className="stock-unit">units</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StockPage;
