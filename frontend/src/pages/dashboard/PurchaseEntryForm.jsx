import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import './PurchaseEntryForm.css';
import {
    Settings, ChevronDown, Plus, Trash2, Loader2,
    Upload, FileText, BarChart2, Printer, Save
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const emptyItem = () => ({
    product_id: '', barcode: '', code: '', item_name: '', unit: '',
    quantity: 1, purchase_rate: 0, amount: 0,
    discount_percent: 0, discount_amount: 0,
    gst_percent: 0, cgst_percent: 0, cgst_amount: 0,
    sgst_percent: 0, sgst_amount: 0, tax_amount: 0,
    total_amount: 0, cost_rate: 0, sales_rate: 0,
    mrp: 0, hsn_code: ''
});

const calcItem = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.purchase_rate) || 0;
    const disP = parseFloat(item.discount_percent) || 0;
    const gstP = parseFloat(item.gst_percent) || 0;

    const amount = qty * rate;
    const disAmt = amount * (disP / 100);
    const taxableAmt = amount - disAmt;
    const cgstP = gstP / 2;
    const sgstP = gstP / 2;
    const taxableTotal = taxableAmt;
    const cgstAmt = taxableTotal * (cgstP / 100);
    const sgstAmt = taxableTotal * (sgstP / 100);
    const taxAmt = cgstAmt + sgstAmt;
    const totalAmt = taxableTotal + taxAmt;

    return {
        ...item,
        amount: parseFloat(amount.toFixed(2)),
        discount_amount: parseFloat(disAmt.toFixed(2)),
        cgst_percent: parseFloat(cgstP.toFixed(2)),
        cgst_amount: parseFloat(cgstAmt.toFixed(2)),
        sgst_percent: parseFloat(sgstP.toFixed(2)),
        sgst_amount: parseFloat(sgstAmt.toFixed(2)),
        tax_amount: parseFloat(taxAmt.toFixed(2)),
        total_amount: parseFloat(totalAmt.toFixed(2))
    };
};

const calcTotals = (items, otherCharges = 0, roundOff = 0) => {
    let subTotal = 0, discAmt = 0, taxAmt = 0, cgst = 0, sgst = 0;
    items.forEach(it => {
        subTotal += it.amount || 0;
        discAmt += it.discount_amount || 0;
        taxAmt += it.tax_amount || 0;
        cgst += it.cgst_amount || 0;
        sgst += it.sgst_amount || 0;
    });
    const netAmt = subTotal - discAmt + taxAmt + parseFloat(otherCharges || 0) + parseFloat(roundOff || 0);
    return {
        sub_total: parseFloat(subTotal.toFixed(2)),
        discount_amount: parseFloat(discAmt.toFixed(2)),
        tax_amount: parseFloat(taxAmt.toFixed(2)),
        cgst_amount: parseFloat(cgst.toFixed(2)),
        sgst_amount: parseFloat(sgst.toFixed(2)),
        net_amount: parseFloat(netAmt.toFixed(2)),
        grand_total: parseFloat(netAmt.toFixed(2))
    };
};

export default function PurchaseEntryForm() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Bill header
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentType, setPaymentType] = useState('CREDIT');
    const [supplierId, setSupplierId] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [dueDays, setDueDays] = useState(0);
    const [dueDate, setDueDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [otherCharges, setOtherCharges] = useState(0);
    const [roundOff, setRoundOff] = useState(0);
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [showPayMode, setShowPayMode] = useState(false);
    const [paidAmount, setPaidAmount] = useState(0);

    // Items
    const [items, setItems] = useState([emptyItem()]);
    const [totals, setTotals] = useState({ sub_total: 0, discount_amount: 0, tax_amount: 0, cgst_amount: 0, sgst_amount: 0, net_amount: 0, grand_total: 0 });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getToken();
                const [supRes, prodRes] = await Promise.all([
                    fetch(`${API}/suppliers`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                const supData = await supRes.json();
                const prodData = await prodRes.json();
                if (supData.success) setSuppliers(supData.data);
                if (prodData.success) setProducts(prodData.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Recalculate totals whenever items/other charges change
    useEffect(() => {
        const t = calcTotals(items, otherCharges, roundOff);
        setTotals(t);
    }, [items, otherCharges, roundOff]);

    // When supplierId changes, update selectedSupplier
    const handleSupplierChange = (id) => {
        setSupplierId(id);
        const found = suppliers.find(s => s._id === id);
        setSelectedSupplier(found || null);
    };

    // When dueDays change, compute new dueDate from invoiceDate
    const handleDueDaysChange = (days) => {
        const d = parseInt(days) || 0;
        setDueDays(d);
        if (d > 0 && invoiceDate) {
            const base = new Date(invoiceDate);
            base.setDate(base.getDate() + d);
            setDueDate(base.toISOString().split('T')[0]);
        } else {
            setDueDate('');
        }
    };

    const handleInvoiceDateChange = (date) => {
        setInvoiceDate(date);
        const d = parseInt(dueDays) || 0;
        if (d > 0 && date) {
            const base = new Date(date);
            base.setDate(base.getDate() + d);
            setDueDate(base.toISOString().split('T')[0]);
        }
    };

    const handleItemChange = (idx, field, value) => {
        const newItems = [...items];
        let item = { ...newItems[idx], [field]: value };

        // If product selected, populate fields
        if (field === 'product_id') {
            const prod = products.find(p => p._id === value);
            if (prod) {
                item.item_name = prod.name;
                item.code = prod.code || '';
                item.barcode = prod.barcode || '';
                item.unit = prod.unit || '';
                item.purchase_rate = prod.purchase_price || 0;
                item.cost_rate = prod.cost_price || 0;
                item.sales_rate = prod.selling_price || 0;
                item.mrp = prod.mrp || 0;
                item.gst_percent = prod.gst_purchase || 0;
                item.hsn_code = prod.hsn_code || '';
            }
        }

        // If barcode changed, try to find product
        if (field === 'barcode' && value) {
            const prod = products.find(p => p.barcode === value);
            if (prod) {
                item.product_id = prod._id;
                item.item_name = prod.name;
                item.code = prod.code || '';
                item.unit = prod.unit || '';
                item.purchase_rate = prod.purchase_price || 0;
                item.cost_rate = prod.cost_price || 0;
                item.sales_rate = prod.selling_price || 0;
                item.mrp = prod.mrp || 0;
                item.gst_percent = prod.gst_purchase || 0;
                item.hsn_code = prod.hsn_code || '';
            }
        }

        newItems[idx] = calcItem(item);
        setItems(newItems);
    };

    const addItem = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleSave = async (andPrint = false) => {
        if (!supplierId) return alert('Please select a supplier');
        if (!invoiceNo.trim()) return alert('Please enter invoice number');
        const validItems = items.filter(it => it.quantity > 0 && it.purchase_rate > 0);
        if (validItems.length === 0) return alert('Please add at least one item with quantity and rate');

        setSaving(true);
        try {
            const token = getToken();
            const payload = {
                supplier_id: supplierId,
                invoice_number: invoiceNo.trim(),
                invoice_date: invoiceDate,
                payment_type: paymentType,
                due_days: parseInt(dueDays) || 0,
                items: validItems,
                ...totals,
                other_charges: parseFloat(otherCharges) || 0,
                round_off: parseFloat(roundOff) || 0,
                paid_amount: parseFloat(paidAmount) || 0,
                remarks,
                notes: remarks
            };

            const res = await fetch(`${API}/purchases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                if (andPrint) {
                    // Navigate to view with print intent
                    navigate('/dashboard/purchase-invoices', { state: { printId: data.data._id } });
                } else {
                    alert('Purchase bill saved successfully!');
                    navigate('/dashboard/purchase-invoices');
                }
            } else {
                alert('Error: ' + (data.error || 'Save failed'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const totalItems = items.filter(it => it.quantity > 0).length;
    const totalQty = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9f7f4' }}>
            <Loader2 className="pef-spinner" size={48} style={{ color: '#6c5fc7' }} />
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
                <div className="pef-container">
                    {/* ─── Sub-header ─── */}
                    <div className="pef-header">
                        <span className="pef-title">PURCHASE ENTRY</span>
                        <div className="pef-header-actions">
                            <button className="pef-hdr-btn" onClick={() => navigate('/dashboard/self-service/purchase-invoices')}>
                                <BarChart2 size={14} /> STATEMENT
                            </button>
                            <button className="pef-hdr-btn">
                                <Upload size={14} /> IMPORT
                            </button>
                            <button className="pef-hdr-btn">
                                <FileText size={14} /> UPLOAD
                            </button>
                            <button className="pef-icon-btn" title="Settings"
                                onClick={() => navigate('/dashboard/self-service/settings')}>
                                <Settings size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ─── Bill Header ─── */}
                    <div className="pef-bill-header">
                        {/* Left: Invoice fields */}
                        <div className="pef-left-fields">
                            <div className="pef-field-row">
                                <label className="pef-label">INVOICE NO</label>
                                <input className="pef-input" value={invoiceNo}
                                    onChange={e => setInvoiceNo(e.target.value.toUpperCase())}
                                    placeholder="INV-001" />
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">INVOICE DT</label>
                                <input type="date" className="pef-input" value={invoiceDate}
                                    onChange={e => handleInvoiceDateChange(e.target.value)} />
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">PAYMENT TYPE</label>
                                <div className="pef-select-wrap">
                                    <ChevronDown size={12} className="pef-chevron" />
                                    <select className="pef-select" value={paymentType}
                                        onChange={e => setPaymentType(e.target.value)}>
                                        <option value="CASH">CASH</option>
                                        <option value="CREDIT">CREDIT</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Center: Supplier */}
                        <div className="pef-supplier-fields">
                            <div className="pef-field-row">
                                <label className="pef-label">SUPPLIER NAME</label>
                                <div className="pef-select-wrap" style={{ flex: 1 }}>
                                    <ChevronDown size={12} className="pef-chevron" />
                                    <select className="pef-select" value={supplierId}
                                        onChange={e => handleSupplierChange(e.target.value)}>
                                        <option value="">— Select Supplier —</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">ADDRESS</label>
                                <input className="pef-input pef-input-readonly"
                                    readOnly value={selectedSupplier?.address || ''} />
                            </div>
                            <div className="pef-field-row pef-contact-row">
                                <input className="pef-input pef-input-readonly"
                                    readOnly value={selectedSupplier?.contact_person || ''} placeholder="Contact Person" />
                                <input className="pef-input pef-input-readonly"
                                    readOnly value={selectedSupplier?.contact_number || ''} placeholder="Phone" />
                            </div>
                        </div>

                        {/* Right: GST/Balance/Due */}
                        <div className="pef-right-fields">
                            <div className="pef-field-row">
                                <label className="pef-label">GSTIN NO</label>
                                <input className="pef-input pef-input-readonly"
                                    readOnly value={selectedSupplier?.gst_number || ''} />
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">BALANCE</label>
                                <input className="pef-input pef-input-readonly"
                                    readOnly value={selectedSupplier ? parseFloat(selectedSupplier.opening_balance || 0).toFixed(2) : ''} />
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">DUE DAYS</label>
                                <input type="number" className="pef-input" min="0"
                                    value={dueDays} onChange={e => handleDueDaysChange(e.target.value)} />
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">DUE DATE</label>
                                <input type="date" className="pef-input"
                                    value={dueDate} onChange={e => setDueDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* ─── Items Table ─── */}
                    <div className="pef-items-section">
                        <div className="pef-table-wrap">
                            <table className="pef-table">
                                <thead>
                                    <tr>
                                        <th className="pef-th-sno">S.NO</th>
                                        <th className="pef-th-barcode">BARCODE</th>
                                        <th className="pef-th-code">CODE</th>
                                        <th className="pef-th-name">ITEM NAME</th>
                                        <th className="pef-th-unit">UNIT</th>
                                        <th className="pef-th-qty">QTY</th>
                                        <th className="pef-th-rate">RATE</th>
                                        <th className="pef-th-amount">AMOUNT</th>
                                        <th className="pef-th-dis">DIS %</th>
                                        <th className="pef-th-dis">DIS AMT</th>
                                        <th className="pef-th-gst">GST %</th>
                                        <th className="pef-th-gst">C-GST %</th>
                                        <th className="pef-th-gst">C-GST AMT</th>
                                        <th className="pef-th-gst">S-GST %</th>
                                        <th className="pef-th-gst">S-GST AMT</th>
                                        <th className="pef-th-tax">TAX AMT</th>
                                        <th className="pef-th-total">TOTAL AMT</th>
                                        <th className="pef-th-rate">COST RATE</th>
                                        <th className="pef-th-rate">SALES RATE</th>
                                        <th className="pef-th-rate">MRP</th>
                                        <th className="pef-th-hsn">HSNCODE</th>
                                        <th className="pef-th-del"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="pef-item-row">
                                            <td className="pef-td-sno">{idx + 1}</td>
                                            <td>
                                                <input className="pef-cell-input pef-w-barcode"
                                                    value={item.barcode}
                                                    onChange={e => handleItemChange(idx, 'barcode', e.target.value)}
                                                    placeholder="Barcode" />
                                            </td>
                                            <td>
                                                <input className="pef-cell-input pef-w-sm"
                                                    value={item.code}
                                                    onChange={e => handleItemChange(idx, 'code', e.target.value)}
                                                    placeholder="Code" />
                                            </td>
                                            <td className="pef-td-name">
                                                <select className="pef-cell-select pef-w-name"
                                                    value={item.product_id}
                                                    onChange={e => handleItemChange(idx, 'product_id', e.target.value)}>
                                                    <option value="">— Item —</option>
                                                    {products.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input className="pef-cell-input pef-w-unit"
                                                    value={item.unit}
                                                    onChange={e => handleItemChange(idx, 'unit', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="number" className="pef-cell-input pef-w-qty pef-num"
                                                    min="0" step="0.01"
                                                    value={item.quantity}
                                                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                    min="0" step="0.01"
                                                    value={item.purchase_rate}
                                                    onChange={e => handleItemChange(idx, 'purchase_rate', e.target.value)} />
                                            </td>
                                            <td className="pef-td-computed">{item.amount.toFixed(2)}</td>
                                            <td>
                                                <input type="number" className="pef-cell-input pef-w-pct pef-num"
                                                    min="0" max="100" step="0.01"
                                                    value={item.discount_percent}
                                                    onChange={e => handleItemChange(idx, 'discount_percent', e.target.value)} />
                                            </td>
                                            <td className="pef-td-computed">{item.discount_amount.toFixed(2)}</td>
                                            <td>
                                                <input type="number" className="pef-cell-input pef-w-pct pef-num"
                                                    min="0" max="100" step="0.01"
                                                    value={item.gst_percent}
                                                    onChange={e => handleItemChange(idx, 'gst_percent', e.target.value)} />
                                            </td>
                                            <td className="pef-td-computed">{item.cgst_percent.toFixed(2)}</td>
                                            <td className="pef-td-computed">{item.cgst_amount.toFixed(2)}</td>
                                            <td className="pef-td-computed">{item.sgst_percent.toFixed(2)}</td>
                                            <td className="pef-td-computed">{item.sgst_amount.toFixed(2)}</td>
                                            <td className="pef-td-computed pef-tax">{item.tax_amount.toFixed(2)}</td>
                                            <td className="pef-td-computed pef-total">{item.total_amount.toFixed(2)}</td>
                                            <td>
                                                <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                    min="0" step="0.01"
                                                    value={item.cost_rate}
                                                    onChange={e => handleItemChange(idx, 'cost_rate', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                    min="0" step="0.01"
                                                    value={item.sales_rate}
                                                    onChange={e => handleItemChange(idx, 'sales_rate', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                    min="0" step="0.01"
                                                    value={item.mrp}
                                                    onChange={e => handleItemChange(idx, 'mrp', e.target.value)} />
                                            </td>
                                            <td>
                                                <input className="pef-cell-input pef-w-hsn"
                                                    value={item.hsn_code}
                                                    onChange={e => handleItemChange(idx, 'hsn_code', e.target.value)} />
                                            </td>
                                            <td>
                                                {items.length > 1 && (
                                                    <button className="pef-del-btn" onClick={() => removeItem(idx)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add row button */}
                        <button className="pef-add-row" onClick={addItem}>
                            <Plus size={14} /> ADD ITEM
                        </button>
                    </div>

                    {/* ─── Footer ─── */}
                    <div className="pef-footer">
                        <div className="pef-footer-left">
                            <div className="pef-footer-stat">
                                <span className="pef-footer-lbl">TOTAL ITEMS:</span>
                                <span className="pef-footer-val">{totalItems}</span>
                            </div>
                            <div className="pef-footer-stat">
                                <span className="pef-footer-lbl">TOTAL QTY:</span>
                                <span className="pef-footer-val">{totalQty.toFixed(2)}</span>
                            </div>
                            <div className="pef-footer-stat">
                                <span className="pef-footer-lbl">TAXABLE AMT:</span>
                                <span className="pef-footer-val">₹{(totals.sub_total - totals.discount_amount).toFixed(2)}</span>
                            </div>
                            <div className="pef-footer-stat">
                                <span className="pef-footer-lbl">TAX AMT:</span>
                                <span className="pef-footer-val">₹{totals.tax_amount.toFixed(2)}</span>
                            </div>
                            <div className="pef-footer-stat">
                                <span className="pef-footer-lbl">OTHER CHG:</span>
                                <input type="number" 
                                    className="pef-cell-input pef-w-rate pef-num" 
                                    style={{ width: '80px', height: '26px' }}
                                    value={otherCharges} 
                                    onChange={e => setOtherCharges(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="pef-footer-stat">
                                <span className="pef-footer-lbl">RD OFF:</span>
                                <input type="number" 
                                    className="pef-cell-input pef-w-rate pef-num" 
                                    style={{ width: '60px', height: '26px' }}
                                    value={roundOff} 
                                    onChange={e => setRoundOff(parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="pef-net-amount">
                            <span className="pef-net-lbl">NET AMOUNT</span>
                            <span className="pef-net-val">₹{totals.grand_total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* ─── Action Bar ─── */}
                    <div className="pef-action-bar">
                        <button className="pef-action-btn pef-remarks-btn"
                            onClick={() => setShowRemarksModal(true)}>
                            REMARKS
                        </button>
                        <div className="pef-action-right">
                            <button className="pef-action-btn pef-more-btn"
                                onClick={() => navigate('/dashboard/self-service/purchase-invoices')}>
                                MORE
                            </button>
                            <button className="pef-action-btn pef-paymode-btn"
                                onClick={() => setShowPayMode(!showPayMode)}>
                                PAYMODE
                            </button>
                            <button className="pef-action-btn pef-saveprint-btn"
                                disabled={saving}
                                onClick={() => handleSave(true)}>
                                {saving ? <Loader2 size={14} className="pef-spinner" /> : <><Printer size={14} /> SAVE &amp; PRINT</>}
                            </button>
                            <button className="pef-action-btn pef-save-btn"
                                disabled={saving}
                                onClick={() => handleSave(false)}>
                                {saving ? <Loader2 size={14} className="pef-spinner" /> : <><Save size={14} /> SAVE</>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Remarks Modal ─── */}
            {showRemarksModal && (
                <div className="pef-modal-overlay" onClick={() => setShowRemarksModal(false)}>
                    <div className="pef-modal" onClick={e => e.stopPropagation()}>
                        <h3>Remarks</h3>
                        <textarea
                            className="pef-remarks-textarea"
                            rows={5}
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="Enter any notes or remarks for this purchase..."
                        />
                        <div className="pef-modal-btns">
                            <button className="pi-modal-cancel" onClick={() => setShowRemarksModal(false)}>Close</button>
                            <button className="pi-modal-confirm" onClick={() => setShowRemarksModal(false)}>Save Remarks</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Pay Mode Panel ─── */}
            {showPayMode && (
                <div className="pef-modal-overlay" onClick={() => setShowPayMode(false)}>
                    <div className="pef-modal" onClick={e => e.stopPropagation()}>
                        <h3>Payment Mode</h3>
                        <p style={{ marginBottom: '1rem', color: '#7c6b8a', fontSize: '0.85rem' }}>
                            Grand Total: <strong>₹{totals.grand_total.toFixed(2)}</strong>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c6b8a' }}>
                                PAID AMOUNT
                            </label>
                            <input type="number" min="0" step="0.01"
                                className="pef-input"
                                value={paidAmount}
                                onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                                style={{ fontSize: '1.1rem', padding: '0.6rem', borderRadius: 8, border: '2px solid #d6c8e0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                                <span>Balance Due:</span>
                                <span style={{ color: (totals.grand_total - (parseFloat(paidAmount) || 0)) > 0 ? '#ef4444' : '#22c55e' }}>
                                    ₹{Math.max(0, totals.grand_total - (parseFloat(paidAmount) || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="pef-modal-btns" style={{ marginTop: '1.5rem' }}>
                            <button className="pi-modal-cancel" onClick={() => setShowPayMode(false)}>Cancel</button>
                            <button className="pi-modal-confirm" onClick={() => setShowPayMode(false)}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
