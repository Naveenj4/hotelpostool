import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    Plus, Search, Trash2, Save, Calendar, Loader2,
    ShoppingCart, Package, ChevronDown, AlertTriangle,
    Truck, FileText, TrendingDown
} from 'lucide-react';

const PurchaseEntry = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState({
        supplier_id: '', invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        items: [], sub_total: 0, tax_amount: 0, other_charges: 0, grand_total: 0, paid_amount: 0
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
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
        } catch (err) { console.error("Failed to fetch data", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const addItem = () => {
        setPurchaseDetails(prev => ({
            ...prev,
            items: [...prev.items, { product_id: '', quantity: 1, purchase_rate: 0, gst_percent: 0, total_amount: 0 }]
        }));
    };

    const removeItem = (index) => {
        const newItems = purchaseDetails.items.filter((_, i) => i !== index);
        setPurchaseDetails(prev => ({ ...prev, items: newItems }));
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
        } else { item[field] = value; }
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.purchase_rate) || 0;
        const gst = parseFloat(item.gst_percent) || 0;
        const base = qty * rate;
        item.total_amount = base + (base * (gst / 100));
        newItems[index] = item;
        setPurchaseDetails(prev => ({ ...prev, items: newItems }));
        calculateTotals(newItems, purchaseDetails.other_charges);
    };

    const calculateTotals = (items, other) => {
        let sub = 0, tax = 0;
        items.forEach(item => {
            const qty = parseFloat(item.quantity) || 0, rate = parseFloat(item.purchase_rate) || 0, gst = parseFloat(item.gst_percent) || 0;
            sub += (qty * rate); tax += (qty * rate * (gst / 100));
        });
        setPurchaseDetails(prev => ({ ...prev, sub_total: sub, tax_amount: tax, grand_total: sub + tax + (parseFloat(other) || 0) }));
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(purchaseDetails)
            });
            const result = await response.json();
            if (result.success) {
                alert("Purchase recorded successfully!");
                setPurchaseDetails({ supplier_id: '', invoice_number: '', purchase_date: new Date().toISOString().split('T')[0], items: [], sub_total: 0, tax_amount: 0, other_charges: 0, grand_total: 0, paid_amount: 0 });
            } else { alert("Error: " + result.error); }
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Initializing Procurement Module...</p>
            </div>
        </div>
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
                                <TrendingDown className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Procurement Engine</span>
                            </div>
                            <h2>Purchase Entry</h2>
                            <p>Record new stock inward and GRN from vendor partners.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Bill Header Card */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
                            <div className="flex items-center gap-3 mb-8">
                                <FileText size={20} className="text-indigo-600" />
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Invoice Metadata</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group-premium">
                                    <label>Vendor Partner *</label>
                                    <div className="relative">
                                        <Truck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                        <select required className="input-premium !pl-12 appearance-none cursor-pointer" value={purchaseDetails.supplier_id} onChange={(e) => setPurchaseDetails({ ...purchaseDetails, supplier_id: e.target.value })}>
                                            <option value="">Select Vendor...</option>
                                            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="form-group-premium">
                                    <label>Invoice Reference Number *</label>
                                    <input type="text" required className="input-premium" placeholder="e.g. INV-2024-001" value={purchaseDetails.invoice_number} onChange={(e) => setPurchaseDetails({ ...purchaseDetails, invoice_number: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="form-group-premium">
                                    <label>GRN Date</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                        <input type="date" className="input-premium !pl-12" value={purchaseDetails.purchase_date} onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchase_date: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="flex justify-between items-center p-8 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Package size={20} className="text-indigo-600" />
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Line Items</h3>
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">{purchaseDetails.items.length} SKUs</span>
                                </div>
                                <button type="button" onClick={addItem} className="btn-premium-primary !py-2.5 !px-5 !text-sm">
                                    <Plus size={16} /> Add SKU
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Qty</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">Rate (Excl.)</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">GST %</th>
                                            <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">Line Total</th>
                                            <th className="px-4 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {purchaseDetails.items.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-16">
                                                    <ShoppingCart size={48} className="text-slate-100 mx-auto mb-3" />
                                                    <p className="text-slate-400 font-bold text-sm">No SKUs added. Click "Add SKU" to begin.</p>
                                                </td>
                                            </tr>
                                        ) : purchaseDetails.items.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" value={item.product_id} onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}>
                                                        <option value="">Select Product...</option>
                                                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input type="number" min="1" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input type="number" min="0" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={item.purchase_rate} onChange={(e) => handleItemChange(idx, 'purchase_rate', e.target.value)} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input type="number" min="0" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={item.gst_percent} onChange={(e) => handleItemChange(idx, 'gst_percent', e.target.value)} />
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-base font-black text-slate-800">₹{item.total_amount.toFixed(2)}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button type="button" onClick={() => removeItem(idx)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Financial Summary</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500">Subtotal (Excl. Tax)</span>
                                        <span className="font-black text-slate-800">₹{purchaseDetails.sub_total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500">Tax (GST)</span>
                                        <span className="font-black text-amber-600">₹{purchaseDetails.tax_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500">Other Charges</span>
                                        <input type="number" className="w-24 text-right px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-700 text-sm" value={purchaseDetails.other_charges} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setPurchaseDetails(p => ({ ...p, other_charges: v })); calculateTotals(purchaseDetails.items, v); }} />
                                    </div>
                                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                                        <span className="font-black text-slate-800 text-base uppercase tracking-widest">Grand Total</span>
                                        <span className="text-2xl font-black text-indigo-600">₹{purchaseDetails.grand_total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500">Paid Amount</span>
                                        <input type="number" className="w-28 text-right px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl font-black text-emerald-700 text-sm" value={purchaseDetails.paid_amount} onChange={(e) => setPurchaseDetails(p => ({ ...p, paid_amount: parseFloat(e.target.value) || 0 }))} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500">Balance Due</span>
                                        <span className="font-black text-rose-600">₹{(purchaseDetails.grand_total - purchaseDetails.paid_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                                {purchaseDetails.items.length === 0 && (
                                    <div className="flex items-center gap-3 p-5 bg-amber-50 border border-amber-100 rounded-2xl mb-6">
                                        <AlertTriangle size={20} className="text-amber-500" />
                                        <p className="text-sm font-bold text-amber-700">Add at least one item before saving.</p>
                                    </div>
                                )}
                                <button type="submit" disabled={submitting} className="btn-premium-primary w-full justify-center !py-6 !text-base !rounded-[2rem] !shadow-xl !shadow-indigo-100">
                                    {submitting ? <><Loader2 className="animate-spin" /> Processing...</> : <><Save size={20} /> Commit Purchase Record</>}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default PurchaseEntry;
