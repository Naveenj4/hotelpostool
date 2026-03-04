import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './ProductMaster.css'; // Reusing CSS
import {
    Search,
    Trash2,
    Loader2,
    FileText,
    Calendar,
    User,
    ChevronDown,
    Eye,
    Tag,
    AlertCircle,
    XCircle
} from 'lucide-react';

const PurchaseBillManagement = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchPurchases = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/purchases`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setPurchases(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch purchases", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? Stock and Supplier balance will be adjusted.")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/purchases/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if ((await response.json()).success) fetchPurchases();
        } catch (err) { alert("Delete failed"); }
    };

    const filteredPurchases = purchases.filter(p =>
        p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier_id?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Purchase Bills</h2>
                            <p>History and management of your purchase invoices.</p>
                        </div>
                    </div>

                    <div className="product-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search by invoice or supplier..."
                                className="input-field pad-left"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-card">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Invoice No</th>
                                    <th>Supplier</th>
                                    <th>Amount</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="empty-state">Loading purchases...</td></tr>
                                ) : filteredPurchases.length === 0 ? (
                                    <tr><td colSpan="7" className="empty-state">No purchase bills found.</td></tr>
                                ) : filteredPurchases.map((p) => (
                                    <tr key={p._id}>
                                        <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>{p.invoice_number}</td>
                                        <td>{p.supplier_id?.name}</td>
                                        <td>₹{p.grand_total}</td>
                                        <td style={{ color: p.due_amount > 0 ? '#ef4444' : '#10b981' }}>₹{p.due_amount}</td>
                                        <td>
                                            <span className={`status-badge status-${p.payment_status.toLowerCase()}`}>
                                                {p.payment_status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btn-group">
                                                <button onClick={() => { setSelectedPurchase(p); setShowDetail(true); }} className="action-btn edit">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(p._id)} className="action-btn delete">
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

                {/* Detail View Drawer */}
                {showDetail && selectedPurchase && (
                    <div className="drawer-overlay">
                        <div className="drawer-backdrop" onClick={() => setShowDetail(false)}></div>
                        <div className="drawer-container" style={{ maxWidth: '800px' }}>
                            <div className="drawer-header">
                                <h3 className="drawer-title">Invoice: {selectedPurchase.invoice_number}</h3>
                                <button onClick={() => setShowDetail(false)} className="close-btn"><XCircle size={24} /></button>
                            </div>
                            <div className="drawer-body">
                                <div className="invoice-summary-grid">
                                    <div className="info-item">
                                        <label>Supplier</label>
                                        <p>{selectedPurchase.supplier_id?.name}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Date</label>
                                        <p>{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Status</label>
                                        <span className={`status-badge status-${selectedPurchase.payment_status.toLowerCase()}`}>
                                            {selectedPurchase.payment_status}
                                        </span>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Items List</h4>
                                <table className="purchase-items-table">
                                    <thead>
                                        <tr>
                                            <th>Product ID/Name</th>
                                            <th>Qty</th>
                                            <th>Rate</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPurchase.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product_id}</td>
                                                <td>{item.quantity}</td>
                                                <td>₹{item.purchase_rate}</td>
                                                <td>₹{item.total_amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="invoice-total-footer">
                                    <div className="total-row"><span>Sub Total:</span> <span>₹{selectedPurchase.sub_total}</span></div>
                                    <div className="total-row"><span>Tax:</span> <span>₹{selectedPurchase.tax_amount}</span></div>
                                    <div className="total-row"><span>Other:</span> <span>₹{selectedPurchase.other_charges}</span></div>
                                    <div className="total-row grand"><span>Grand Total:</span> <span>₹{selectedPurchase.grand_total}</span></div>
                                    <div className="total-row paid"><span>Paid:</span> <span>₹{selectedPurchase.paid_amount}</span></div>
                                    <div className="total-row due"><span>Due:</span> <span>₹{selectedPurchase.due_amount}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                .invoice-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 8px; }
                .info-item label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
                .info-item p { font-weight: 600; color: #1e293b; margin-top: 4px; }
                .invoice-total-footer { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; width: 300px; margin-left: auto; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem; }
                .total-row.grand { font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                .total-row.due { color: #ef4444; font-weight: 700; }
                .purchase-items-table { width: 100%; border-collapse: collapse; }
                .purchase-items-table th { text-align: left; background: #f1f5f9; padding: 10px; font-size: 0.8rem; }
                .purchase-items-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
                .status-unpaid { background: #fee2e2; color: #991b1b; }
                .status-partial { background: #fef3c7; color: #92400e; }
                .status-paid { background: #d1fae5; color: #065f46; }
            `}</style>
        </div>
    );
};

export default PurchaseBillManagement;
