import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './ProductMaster.css'; // Reusing some CSS
import {
    Plus,
    Search,
    Trash2,
    Save,
    Calendar,
    User,
    FileText,
    ArrowLeft,
    Loader2
} from 'lucide-react';

const PurchaseEntry = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [purchaseDetails, setPurchaseDetails] = useState({
        supplier_id: '',
        invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        items: [],
        sub_total: 0,
        tax_amount: 0,
        other_charges: 0,
        grand_total: 0,
        paid_amount: 0
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchData = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const [supRes, prodRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const supData = await supRes.json();
            const prodData = await prodRes.json();

            if (supData.success) setSuppliers(supData.data);
            if (prodData.success) setProducts(prodData.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addItem = () => {
        setPurchaseDetails({
            ...purchaseDetails,
            items: [...purchaseDetails.items, { product_id: '', quantity: 1, purchase_rate: 0, gst_percent: 0, total_amount: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = purchaseDetails.items.filter((_, i) => i !== index);
        setPurchaseDetails({ ...purchaseDetails, items: newItems });
        calculateTotals(newItems, purchaseDetails.other_charges);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...purchaseDetails.items];
        const item = { ...newItems[index] };

        if (field === 'product_id') {
            const product = products.find(p => p._id === value);
            item.product_id = value;
            item.purchase_rate = product ? product.buying_price : 0;
            item.gst_percent = product ? product.gst_purchase : 0;
        } else {
            item[field] = value;
        }

        // Recalculate item total
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.purchase_rate) || 0;
        const gst = parseFloat(item.gst_percent) || 0;

        const base = qty * rate;
        const tax = base * (gst / 100);
        item.total_amount = base + tax;

        newItems[index] = item;
        setPurchaseDetails({ ...purchaseDetails, items: newItems });
        calculateTotals(newItems, purchaseDetails.other_charges);
    };

    const calculateTotals = (items, other) => {
        let sub = 0;
        let tax = 0;
        items.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.purchase_rate) || 0;
            const gst = parseFloat(item.gst_percent) || 0;
            sub += (qty * rate);
            tax += (qty * rate * (gst / 100));
        });

        const grand = sub + tax + (parseFloat(other) || 0);
        setPurchaseDetails(prev => ({
            ...prev,
            sub_total: sub,
            tax_amount: tax,
            grand_total: grand
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (purchaseDetails.items.length === 0) return alert("Add at least one item");

        setSubmitting(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/purchases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(purchaseDetails)
            });

            const result = await response.json();
            if (result.success) {
                alert("Purchase recorded successfully!");
                // Reset form
                setPurchaseDetails({
                    supplier_id: '',
                    invoice_number: '',
                    purchase_date: new Date().toISOString().split('T')[0],
                    items: [],
                    sub_total: 0,
                    tax_amount: 0,
                    other_charges: 0,
                    grand_total: 0,
                    paid_amount: 0
                });
            } else {
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loader-overlay"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Purchase Entry</h2>
                            <p>Record new stock inward from suppliers.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="purchase-form-container">
                        <div className="form-card purchase-header-card">
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label className="input-label">Supplier *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={purchaseDetails.supplier_id}
                                        onChange={(e) => setPurchaseDetails({ ...purchaseDetails, supplier_id: e.target.value })}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Invoice Number *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        placeholder="INV-001"
                                        value={purchaseDetails.invoice_number}
                                        onChange={(e) => setPurchaseDetails({ ...purchaseDetails, invoice_number: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Purchase Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={purchaseDetails.purchase_date}
                                        onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchase_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-card items-card">
                            <div className="items-header">
                                <h3>Purchase Items</h3>
                                <button type="button" onClick={addItem} className="btn-secondary btn-sm">
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>

                            <table className="purchase-items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th width="100">Qty</th>
                                        <th width="120">Rate (Excl.)</th>
                                        <th width="100">GST %</th>
                                        <th width="120">Total</th>
                                        <th width="50"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseDetails.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <select
                                                    className="input-field-sm"
                                                    value={item.product_id}
                                                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="input-field-sm"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="input-field-sm"
                                                    value={item.purchase_rate}
                                                    onChange={(e) => handleItemChange(idx, 'purchase_rate', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="input-field-sm"
                                                    value={item.gst_percent}
                                                    onChange={(e) => handleItemChange(idx, 'gst_percent', e.target.value)}
                                                />
                                            </td>
                                            <td className="text-right">₹{item.total_amount.toFixed(2)}</td>
                                            <td>
                                                <button type="button" onClick={() => removeItem(idx)} className="text-danger">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {purchaseDetails.items.length === 0 && (
                                        <tr><td colSpan="6" className="text-center py-4 text-gray-400">No items added. Click "Add Item" to begin.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="purchase-footer">
                            <div className="summary-section">
                                <div className="summary-row"><span>Sub Total:</span> <span>₹{purchaseDetails.sub_total.toFixed(2)}</span></div>
                                <div className="summary-row"><span>Tax (GST):</span> <span>₹{purchaseDetails.tax_amount.toFixed(2)}</span></div>
                                <div className="summary-row">
                                    <span>Other Charges:</span>
                                    <input
                                        type="number"
                                        className="inline-input"
                                        value={purchaseDetails.other_charges}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setPurchaseDetails({ ...purchaseDetails, other_charges: val });
                                            calculateTotals(purchaseDetails.items, val);
                                        }}
                                    />
                                </div>
                                <div className="summary-row grand-total"><span>Grand Total:</span> <span>₹{purchaseDetails.grand_total.toFixed(2)}</span></div>
                                <div className="summary-row">
                                    <span>Paid Amount:</span>
                                    <input
                                        type="number"
                                        className="inline-input"
                                        value={purchaseDetails.paid_amount}
                                        onChange={(e) => setPurchaseDetails({ ...purchaseDetails, paid_amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="action-section">
                                <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
                                    {submitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Purchase</>}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            <style jsx>{`
                .purchase-form-container { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-card { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; }
                .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
                .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .purchase-items-table { width: 100%; border-collapse: collapse; }
                .purchase-items-table th { text-align: left; padding: 0.75rem; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600; font-size: 0.85rem; }
                .purchase-items-table td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; }
                .input-field-sm { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; outline: none; transition: border-color 0.2s; }
                .text-right { text-align: right; }
                .text-danger { color: #ef4444; background: none; border: none; cursor: pointer; }
                .purchase-footer { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: flex-end; }
                .summary-section { background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
                .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #475569; }
                .grand-total { border-top: 1px solid #e2e8f0; padding-top: 0.5rem; margin-top: 0.5rem; font-weight: 700; color: #0f172a; font-size: 1.1rem; }
                .inline-input { width: 80px; text-align: right; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 4px; }
                .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; }
                .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; }
                @media (max-width: 768px) { .form-grid-3 { grid-template-columns: 1fr; } .purchase-footer { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
};

export default PurchaseEntry;
