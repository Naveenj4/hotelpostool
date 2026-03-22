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

    // New Fields (Req 18)
    const [regType, setRegType] = useState('');
    const [stateName, setStateName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

    // Column Config / Settings (Req 8, 9, 12, 14, 15)
    const [colConfig, setColConfig] = useState({
        barcode: true, code: true, item_name: true, unit: true, qty: true,
        rate: true, amount: true, dis_pct: true, dis_amt: true, gst: true,
        tax: true, total: true, cost: true, sales: true, mrp: true, hsn: true,
        addins_enabled: false, paymode_enabled: true
    });

    const [showMoreDrawer, setShowMoreDrawer] = useState(false);

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
        if (found) {
            setSupplierSearch(found.name);
            setRegType(found.registration_type || 'Regular');
            setStateName(found.state || '');
            handleDueDaysChange(found.due_days || 0);
        }
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

    const handleItemKeyDown = (e, idx, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const fields = Object.keys(colConfig).filter(k => colConfig[k]);
            const currentIdx = fields.indexOf(field);
            
            if (currentIdx < fields.indexOf('hsn_code') && currentIdx !== -1) {
                // Find next visible field in same row
                const nextField = fields[currentIdx + 1];
                const nextEl = document.querySelector(`[data-idx="${idx}"][data-field="${nextField}"]`);
                if (nextEl) nextEl.focus();
            } else {
                // Last field of row, add new item or go to next row
                if (idx === items.length - 1) {
                    addItem();
                    setTimeout(() => {
                        const firstField = fields.find(k => colConfig[k]);
                        const nextEl = document.querySelector(`[data-idx="${idx + 1}"][data-field="${firstField}"]`);
                        if (nextEl) nextEl.focus();
                    }, 50);
                } else {
                    const firstField = fields.find(k => colConfig[k]);
                    const nextEl = document.querySelector(`[data-idx="${idx + 1}"][data-field="${firstField}"]`);
                    if (nextEl) nextEl.focus();
                }
            }
        }
    };

    const [showColSettings, setShowColSettings] = useState(false);

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
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Purchase Entry"
                    actions={
                        <div className="flex items-center gap-2">
                            <button className="btn-premium-primary !py-2 !px-4 !bg-slate-100 !text-slate-700" onClick={() => navigate('/dashboard/self-service/purchase-history')}>
                                <BarChart2 size={14} /> 
                                <span className="text-[10px] uppercase font-black">Statement</span>
                            </button>
                            <button className="btn-premium-primary !py-2 !px-4 !bg-slate-100 !text-slate-700">
                                <Upload size={14} /> 
                                <span className="text-[10px] uppercase font-black">Import</span>
                            </button>
                            <div className="relative">
                                <button className="btn-premium-primary !py-2 !px-3 !bg-slate-100 !text-slate-700" title="Column Settings"
                                    onClick={() => setShowColSettings(!showColSettings)}>
                                    <Settings size={16} />
                                </button>
                                {showColSettings && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-2xl rounded-2xl z-[500] border border-slate-100 p-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Display Columns</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.keys(colConfig).map(k => (
                                                <label key={k} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                                                    <input type="checkbox" checked={colConfig[k]} 
                                                        onChange={() => setColConfig(prev => ({...prev, [k]: !prev[k]})) }
                                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500" />
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{k.replace('_', ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                />
                <div className="pef-container">

                    {/* ─── Bill Header ─── */}
                    <div className="pef-bill-header">
                        {/* Left: Invoice fields */}
                        <div className="pef-left-fields">
                            <div className="pef-field-row">
                                <label className="pef-label">INVOICE NO</label>
                                <input id="invoice-no-field" className="pef-input" value={invoiceNo}
                                    onChange={e => setInvoiceNo(e.target.value.toUpperCase())}
                                    onKeyDown={e => handleHeaderKeyDown(e, 'invoice-date-field')}
                                    placeholder="INV-001" />
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">INVOICE DT</label>
                                <input id="invoice-date-field" type="date" className="pef-input" value={invoiceDate}
                                    onKeyDown={e => handleHeaderKeyDown(e, 'supplier-search-field')}
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

                        {/* Center: Supplier (Req 3, 4, 5, 6, 17, 18) */}
                        <div className="pef-supplier-column" style={{ flex: 2 }}>
                            <div className="pef-field-row !items-start">
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <label className="pef-label !mb-1">SUPPLIER / VENDOR</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                id="supplier-search-field"
                                                className="pef-input w-full font-bold" 
                                                value={supplierSearch}
                                                onChange={(e) => {
                                                    setSupplierSearch(e.target.value);
                                                    setShowSupplierDropdown(true);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' && !supplierSearch) {
                                                        setShowSupplierDropdown(true);
                                                    }
                                                    if (e.key === 'Enter') {
                                                        setShowSupplierDropdown(false);
                                                        handleHeaderKeyDown(e, 'FIRST_ITEM');
                                                    }
                                                }}
                                                placeholder="Type name or space for list..."
                                            />
                                            {showSupplierDropdown && (
                                                <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-xl z-[100] border border-slate-100 max-h-[200px] overflow-y-auto mt-1">
                                                    {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
                                                        <div 
                                                            key={s._id} 
                                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer font-bold text-sm text-slate-700"
                                                            onClick={() => {
                                                                handleSupplierChange(s._id);
                                                                setShowSupplierDropdown(false);
                                                            }}
                                                        >
                                                            {s.name}
                                                        </div>
                                                    ))}
                                                    <div className="p-2 border-t text-[10px] text-slate-400 text-center font-bold italic">End of List</div>
                                                </div>
                                            )}
                                        </div>
                                        <button className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                            <BarChart2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ width: '180px' }}>
                                    <label className="pef-label !mb-1">GSTIN NO</label>
                                    <input className="pef-input pef-input-readonly w-full" 
                                        readOnly value={selectedSupplier?.gst_number || ''} />
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mt-3">
                                <div style={{ flex: 1 }}>
                                    <label className="pef-label !mb-1">STORE ADDRESS</label>
                                    <textarea 
                                        className="pef-input w-full !h-20 py-2 resize-none font-medium"
                                        value={selectedSupplier?.address || ''}
                                        onChange={(e) => {
                                            if (selectedSupplier) {
                                                setSelectedSupplier({...selectedSupplier, address: e.target.value});
                                            }
                                        }}
                                        placeholder="Party Address..."
                                    />
                                </div>
                                <div style={{ width: '200px' }} className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="pef-label !mb-0 min-w-[70px]">BALANCE</label>
                                        <input className="pef-input pef-input-readonly !h-8 text-right font-black !text-indigo-600"
                                            readOnly value={selectedSupplier ? parseFloat(selectedSupplier.opening_balance || 0).toFixed(2) : '0.00'} title="Outstanding Balance" />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="pef-label !mb-0 min-w-[70px]">DUE DAYS</label>
                                        <input type="number" className="pef-input !h-8 text-right font-bold" min="0"
                                            value={dueDays} onChange={e => handleDueDaysChange(e.target.value)} />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="pef-label !mb-0 min-w-[70px]">DUE DATE</label>
                                        <input type="date" className="pef-input !h-8 text-right font-bold"
                                            value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Registration & State (Req 18) */}
                        <div className="pef-right-fields" style={{ width: '220px' }}>
                            <div className="pef-field-row">
                                <label className="pef-label">REG. TYPE</label>
                                <div className="pef-select-wrap">
                                    <ChevronDown size={12} className="pef-chevron" />
                                    <select className="pef-select" value={regType} onChange={e => setRegType(e.target.value)}>
                                        <option value="Regular">Regular</option>
                                        <option value="Composition">Composition</option>
                                        <option value="Unregistered">Unregistered</option>
                                        <option value="Consumer">Consumer</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pef-field-row">
                                <label className="pef-label">STATE</label>
                                <input className="pef-input font-bold" value={stateName} onChange={e => setStateName(e.target.value)} placeholder="State Name" />
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
                                        {colConfig.barcode && <th className="pef-th-barcode">BARCODE</th>}
                                        {colConfig.code && <th className="pef-th-code">CODE</th>}
                                        {colConfig.item_name && <th className="pef-th-name">ITEM NAME</th>}
                                        {colConfig.unit && <th className="pef-th-unit">UNIT</th>}
                                        {colConfig.qty && <th className="pef-th-qty">QTY</th>}
                                        {colConfig.rate && <th className="pef-th-rate">RATE</th>}
                                        {colConfig.amount && <th className="pef-th-amount">AMOUNT</th>}
                                        {colConfig.dis_pct && <th className="pef-th-dis">DIS %</th>}
                                        {colConfig.dis_amt && <th className="pef-th-dis">DIS AMT</th>}
                                        {colConfig.gst && (
                                            <>
                                                <th className="pef-th-gst">GST %</th>
                                                <th className="pef-th-gst">C-GST %</th>
                                                <th className="pef-th-gst">C-GST AMT</th>
                                                <th className="pef-th-gst">S-GST %</th>
                                                <th className="pef-th-gst">S-GST AMT</th>
                                            </>
                                        )}
                                        {colConfig.tax && <th className="pef-th-tax">TAX AMT</th>}
                                        {colConfig.total && <th className="pef-th-total">TOTAL AMT</th>}
                                        {colConfig.cost && <th className="pef-th-rate">COST RATE</th>}
                                        {colConfig.sales && <th className="pef-th-rate">SALES RATE</th>}
                                        {colConfig.mrp && <th className="pef-th-rate">MRP</th>}
                                        {colConfig.hsn && <th className="pef-th-hsn">HSNCODE</th>}
                                        <th className="pef-th-del"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="pef-item-row">
                                            <td className="pef-td-sno">{idx + 1}</td>
                                            {colConfig.barcode && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-barcode"
                                                        data-idx={idx} data-field="barcode"
                                                        value={item.barcode}
                                                        onChange={e => handleItemChange(idx, 'barcode', e.target.value)}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'barcode')}
                                                        placeholder="Barcode" />
                                                </td>
                                            )}
                                            {colConfig.code && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-sm"
                                                        data-idx={idx} data-field="code"
                                                        value={item.code}
                                                        onChange={e => handleItemChange(idx, 'code', e.target.value)}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'code')}
                                                        placeholder="Code" />
                                                </td>
                                            )}
                                            {colConfig.item_name && (
                                                <td className="pef-td-name">
                                                    <select className="pef-cell-select pef-w-name"
                                                        data-idx={idx} data-field="product_id"
                                                        value={item.product_id}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'product_id')}
                                                        onChange={e => handleItemChange(idx, 'product_id', e.target.value)}>
                                                        <option value="">— Item —</option>
                                                        {products.map(p => (
                                                            <option key={p._id} value={p._id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            )}
                                            {colConfig.unit && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-unit"
                                                        data-idx={idx} data-field="unit"
                                                        value={item.unit}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'unit')}
                                                        onChange={e => handleItemChange(idx, 'unit', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig.qty && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-qty pef-num"
                                                        data-idx={idx} data-field="quantity"
                                                        min="0" step="0.01"
                                                        value={item.quantity}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'quantity')}
                                                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig.rate && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="purchase_rate"
                                                        min="0" step="0.01"
                                                        value={item.purchase_rate}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'purchase_rate')}
                                                        onChange={e => handleItemChange(idx, 'purchase_rate', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig.amount && <td className="pef-td-computed">{item.amount.toFixed(2)}</td>}
                                            {colConfig.dis_pct && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-pct pef-num"
                                                        data-idx={idx} data-field="discount_percent"
                                                        min="0" max="100" step="0.01"
                                                        value={item.discount_percent}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'discount_percent')}
                                                        onChange={e => handleItemChange(idx, 'discount_percent', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig.dis_amt && <td className="pef-td-computed">{item.discount_amount.toFixed(2)}</td>}
                                            {colConfig.gst && (
                                                <>
                                                    <td>
                                                        <input type="number" className="pef-cell-input pef-w-pct pef-num"
                                                            data-idx={idx} data-field="gst_percent"
                                                            min="0" max="100" step="0.01"
                                                            value={item.gst_percent}
                                                            onKeyDown={e => handleItemKeyDown(e, idx, 'gst_percent')}
                                                            onChange={e => handleItemChange(idx, 'gst_percent', e.target.value)} />
                                                    </td>
                                                    <td className="pef-td-computed">{item.cgst_percent.toFixed(2)}</td>
                                                    <td className="pef-td-computed">{item.cgst_amount.toFixed(2)}</td>
                                                    <td className="pef-td-computed">{item.sgst_percent.toFixed(2)}</td>
                                                    <td className="pef-td-computed">{item.sgst_amount.toFixed(2)}</td>
                                                </>
                                            )}
                                            {colConfig.tax && <td className="pef-td-computed pef-tax">{item.tax_amount.toFixed(2)}</td>}
                                            {colConfig.total && <td className="pef-td-computed pef-total">{item.total_amount.toFixed(2)}</td>}
                                            {colConfig.cost && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="cost_rate"
                                                        min="0" step="0.01"
                                                        value={item.cost_rate}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'cost_rate')}
                                                        onChange={e => handleItemChange(idx, 'cost_rate', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig.sales && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="sales_rate"
                                                        min="0" step="0.01"
                                                        value={item.sales_rate}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'sales_rate')}
                                                        onChange={e => handleItemChange(idx, 'sales_rate', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig.mrp && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="mrp"
                                                        min="0" step="0.01"
                                                        value={item.mrp}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'mrp')}
                                                        onChange={e => handleItemChange(idx, 'mrp', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig.hsn && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-hsn"
                                                        data-idx={idx} data-field="hsn_code"
                                                        value={item.hsn_code}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'hsn_code')}
                                                        onChange={e => handleItemChange(idx, 'hsn_code', e.target.value)} />
                                                </td>
                                            )}
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
                        </div>
                        <div className="pef-net-amount">
                            <div className="text-right mr-6">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other/RoundOff</div>
                                <div className="text-sm font-black text-slate-600">₹{(parseFloat(otherCharges) + parseFloat(roundOff)).toFixed(2)}</div>
                            </div>
                            <div className="flex flex-col items-end mr-4">
                                <span className="pef-net-lbl">NET AMOUNT</span>
                                <span className="pef-net-val">₹{totals.grand_total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Action Bar ─── */}
                    <div className="pef-action-bar">
                        <button className="pef-action-btn pef-remarks-btn"
                            onClick={() => setShowRemarksModal(true)}>
                            REMARKS
                        </button>
                        <div className="pef-action-right">
                            {colConfig.addins_enabled && (
                                <button className="pef-action-btn pef-addins-btn" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                    ADDINS
                                </button>
                            )}
                            <button className="pef-action-btn pef-more-btn"
                                onClick={() => setShowMoreDrawer(true)}>
                                MORE
                            </button>
                            {colConfig.paymode_enabled && (
                                <button className="pef-action-btn pef-paymode-btn"
                                    onClick={() => setShowPayMode(!showPayMode)}>
                                    PAYMODE
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
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

                {/* ─── More Details Drawer (Req 12, 13) ─── */}
                {showMoreDrawer && (
                    <div className="fixed inset-0 z-[1000] flex justify-end">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMoreDrawer(false)}></div>
                        <div className="relative w-[400px] bg-white h-full shadow-2xl p-8 flex flex-col fade-in-right">
                            <div className="flex justify-between items-center mb-8 pb-4 border-b">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Additional Details</h3>
                                <button onClick={() => setShowMoreDrawer(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] font-medium text-slate-500 leading-relaxed">
                                    "When working in more column refer me for details" - Please update this section with specific fields as required.
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="pef-label !text-indigo-600">OTHER CHARGES (₹)</label>
                                        <input type="number" 
                                            className="pef-input w-full !h-12 !text-lg font-black"
                                            value={otherCharges} 
                                            onChange={e => setOtherCharges(parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="pef-label !text-indigo-600">ROUND OFF (₹)</label>
                                        <input type="number" 
                                            className="pef-input w-full !h-12 !text-lg font-black"
                                            value={roundOff} 
                                            onChange={e => setRoundOff(parseFloat(e.target.value) || 0)} />
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowMoreDrawer(false)} className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-widest uppercase hover:bg-black transition-all">
                                Done
                            </button>
                        </div>
                    </div>
                )}
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
