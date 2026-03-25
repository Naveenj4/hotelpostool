import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    Search, Plus, Printer, Download, Upload,
    Settings, Loader2, Trash2, ChevronLeft
} from 'lucide-react';
import './ReceiptEntry.css';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };
const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

export default function ReceiptEntry() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // List State
    const [receipts, setReceipts] = useState([]);
    const [stats, setStats] = useState({ total_receivable: 0, total_paid: 0, unpaid: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [view, setView] = useState('LIST'); // LIST or FORM

    // Form State
    const [customers, setCustomers] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [bills, setBills] = useState([]); // Unpaid bills
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        party_id: '',
        receipt_no: '',
        date: new Date().toISOString().split('T')[0],
        received_amount: '',
        paymode_ledger_id: '',
        narration: ''
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    // --- Data Fetching ---
    const fetchList = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const q = new URLSearchParams();
            if (search) q.append('search', search);
            if (fromDate) q.append('startDate', fromDate);
            if (toDate) q.append('endDate', toDate);

            const [recRes, statRes] = await Promise.all([
                fetch(`${API}/receipts?${q}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/receipts/stats`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const recData = await recRes.json();
            const statData = await statRes.json();

            if (recData.success) setReceipts(recData.data);
            if (statData.success) setStats(statData.data);
        } catch (err) { console.error('Error fetching list:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'LIST') fetchList();
    }, [view, search, fromDate, toDate]);

    // Load prerequisites for Form
    useEffect(() => {
        if (view === 'FORM') {
            const loadDeps = async () => {
                const token = getToken();
                const [custRes, ledgRes] = await Promise.all([
                    fetch(`${API}/customers`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API}/ledgers?group=Bank_Accounts,Cash_in_Hand`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                const custData = await custRes.json();
                const ledgData = await ledgRes.json();
                if (custData.success) setCustomers(custData.data);
                // Filter ledgers internally if API didn't perfectly filter
                if (ledgData.success) {
                    const paymodes = ledgData.data.filter(l => 
                        l.group === 'Bank Accounts' || 
                        l.group === 'Cash-in-Hand' ||
                        l.group === 'Bank OD A/c' ||
                        l.name?.toLowerCase().includes('cash') || 
                        l.name?.toLowerCase().includes('bank')
                    );
                    setLedgers(paymodes);
                }
            };
            loadDeps();
            setFormData({
                party_id: '', receipt_no: `REC-${Date.now().toString().slice(-5)}`,
                date: new Date().toISOString().split('T')[0], received_amount: '',
                paymode_ledger_id: '', narration: ''
            });
            setBills([]);
        }
    }, [view]);

    // Fetch bills when party changes
    useEffect(() => {
        if (formData.party_id && view === 'FORM') {
            const token = getToken();
            fetch(`${API}/receipts/party/${formData.party_id}/unpaid`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json())
                .then(d => {
                    if (d.success) {
                        // Attach state to track settlement input
                        const b = d.data.map(i => ({ ...i, amount_settled: '', is_selected: false }));
                        setBills(b);
                    }
                });
        } else {
            setBills([]);
        }
    }, [formData.party_id, view]);

    // Auto-distribute
    const handleReceivedAmountChange = (val) => {
        setFormData({ ...formData, received_amount: val });
        let remaining = parseFloat(val) || 0;
        const newBills = bills.map(b => {
            if (remaining > 0) {
                const settle = Math.min(remaining, b.due_amount);
                remaining -= settle;
                // Avoid tiny float issues
                const finalSettle = Math.round(settle * 100) / 100;
                return { ...b, amount_settled: finalSettle, is_selected: true };
            } else {
                return { ...b, amount_settled: '', is_selected: false };
            }
        });
        setBills(newBills);
    };

    const handleBillChange = (idx, val) => {
        const newBills = [...bills];
        newBills[idx].amount_settled = val;
        newBills[idx].is_selected = parseFloat(val) > 0;
        
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData({ ...formData, received_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' });
        setBills(newBills);
    };

    const handleCheckboxChange = (idx, checked) => {
        const newBills = [...bills];
        newBills[idx].is_selected = checked;
        if (checked) {
            newBills[idx].amount_settled = newBills[idx].due_amount;
        } else {
            newBills[idx].amount_settled = '';
        }
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData({ ...formData, received_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' });
        setBills(newBills);
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        const newBills = bills.map(b => ({
            ...b,
            is_selected: checked,
            amount_settled: checked ? b.due_amount : ''
        }));
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData({ ...formData, received_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' });
        setBills(newBills);
    };

    const handleSave = async (andPrint = false) => {
        if (!formData.party_id || !formData.received_amount || !formData.paymode_ledger_id) {
            return alert('Please fill Party, Received Amount, and Paymode.');
        }

        setSaving(true);
        try {
            const token = getToken();
            // Collect settled bills
            const settled = bills.filter(b => parseFloat(b.amount_settled) > 0)
                                 .map(b => ({ bill_id: b._id, amount_settled: parseFloat(b.amount_settled) }));
            
            const payload = { ...formData, settled_bills: settled };
            const res = await fetch(`${API}/receipts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                if(andPrint) alert('Receipt saved. (Print prompt would appear here)');
                else alert('Receipt saved successfully.');
                setView('LIST');
            } else {
                alert(data.error || 'Failed to save receipt');
            }
        } catch (err) {
            alert('Failed to save receipt');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this receipt and revert balances?")) return;
        try {
            const res = await fetch(`${API}/receipts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) fetchList();
            else alert(data.error);
        } catch(err) { alert('Error deleting.') }
    }

    const selectedCustomer = customers.find(c => c._id === formData.party_id);
    const balance = selectedCustomer ? selectedCustomer.opening_balance : 0;
    
    const totalAmountList = receipts.reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="dashboard-layout bg-receipt">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            
            <main className="dashboard-main min-h-screen">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Receipt Entry"
                    actions={
                        view === 'LIST' ? (
                            <button className="btn-premium-primary !py-2 !px-6" onClick={() => setView('FORM')}>
                                <Plus size={18} /> 
                                <span className="text-[10px] uppercase font-black">Create Receipt</span>
                            </button>
                        ) : (
                            <button className="btn-premium-primary !py-2 !px-6 !bg-slate-200 !text-slate-800" onClick={() => setView('LIST')}>
                                <ChevronLeft size={18} /> 
                                <span className="text-[10px] uppercase font-black">Back to List</span>
                            </button>
                        )
                    }
                />
                
                {view === 'LIST' ? (
                <div className="re-wrapper fade-in">
                    {/* TOP CONTROLS */}
                    <div className="re-topbar">
                        <div className="re-title">RECEIPT ENTRY</div>
                        <div className="re-top-actions">
                            <button className="re-icon-btn"><Upload size={18} /></button>
                            <button className="re-icon-btn"><Download size={18} /></button>
                            <button className="re-icon-btn" onClick={() => window.print()}><Printer size={18} /></button>
                            <button className="re-icon-btn" onClick={() => navigate('/dashboard/self-service/settings')}><Settings size={18} /></button>
                        </div>
                    </div>

                    <div className="re-controls-row">
                        <div className="re-search-box">
                            <input 
                                placeholder="SEARCH BY NAME / AMOUNT" 
                                value={search} onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="re-date-filter">
                            <span>FROM</span>
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            <span>TO</span>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                        <button className="re-create-btn" onClick={() => setView('FORM')}>
                            + CREATE RECEIPT
                        </button>
                    </div>

                    {/* SUMMARY CARDS */}
                    <div className="re-stats">
                        <div className="re-stat-card">
                            <label>TOTAL RECEIVABLE</label>
                            <div className="val">{fmt(stats.total_receivable)}</div>
                        </div>
                        <div className="re-stat-card">
                            <label>PAID</label>
                            <div className="val">{fmt(stats.total_paid)}</div>
                        </div>
                        <div className="re-stat-card">
                            <label>UNPAID</label>
                            <div className="val">{fmt(stats.unpaid)}</div>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="re-table-area">
                        <table>
                            <thead>
                                <tr>
                                    <th>S.NO</th>
                                    <th>RECEIPT NO</th>
                                    <th>DATE</th>
                                    <th>PARTY NAME</th>
                                    <th className="text-right">AMOUNT</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan={6} className="re-empty"><Loader2 className="spin" /></td></tr>}
                                {!loading && receipts.length === 0 && <tr><td colSpan={6} className="re-empty">No receipts found</td></tr>}
                                {!loading && receipts.map((r, i) => (
                                    <tr key={r._id}>
                                        <td>{i + 1}</td>
                                        <td>{r.voucher_number}</td>
                                        <td>{fmtD(r.date)}</td>
                                        <td className="font-bold text-slate-800">{r.party_id?.name || '—'}</td>
                                        <td className="text-right font-bold text-green-600 font-mono">₹{fmt(r.amount)}</td>
                                        <td className="text-right">
                                            <button onClick={() => handleDelete(r._id)} className="re-del-btn"><Trash2 size={15} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* FOOTER */}
                    <div className="re-footer">
                        <div className="re-foot-cell flex-1">TOTAL VOUCHER : <strong>{receipts.length}</strong></div>
                        <div className="re-foot-cell text-right pr-6">TOTAL AMOUNT : <strong className="font-mono ml-2">₹{fmt(totalAmountList)}</strong></div>
                    </div>
                    <div className="re-pagination">
                        {/* Dummy pagination mirroring image */}
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                    </div>
                </div>
                ) : (
                <div className="re-wrapper form-view fade-in">
                    <div className="re-topbar">
                        <div className="re-title flex items-center gap-2 cursor-pointer" onClick={() => setView('LIST')}>
                            <ChevronLeft size={20} /> RECEIPT ENTRY
                        </div>
                        <div className="re-top-actions">
                            <button className="re-icon-btn"><Upload size={18} /></button>
                            <button className="re-icon-btn"><Download size={18} /></button>
                            <button className="re-icon-btn"><Printer size={18} /></button>
                            <button className="re-icon-btn"><Settings size={18} /></button>
                        </div>
                    </div>

                    {/* FORM HEADER */}
                    <div className="re-form-header">
                        <div className="re-f-col">
                            <div className="re-f-group">
                                <label>PARTY NAME</label>
                                <select value={formData.party_id} onChange={e => setFormData({...formData, party_id: e.target.value})}>
                                    <option value="">-- Select Party --</option>
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="re-f-group">
                                <label>BALANCE</label>
                                <input readOnly value={`₹${fmt(balance)}`} className="re-readonly" />
                            </div>
                        </div>

                        <div className="re-f-col">
                            <div className="re-f-group">
                                <label>RECEIPT NO</label>
                                <input value={formData.receipt_no} onChange={e => setFormData({...formData, receipt_no: e.target.value})} />
                            </div>
                            <div className="re-f-group">
                                <label>DATE</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="re-form-mid">
                        <div className="re-f-group">
                            <label>RECEIVED AMOUNT</label>
                            <input type="number" className="re-amt-input" value={formData.received_amount} onChange={e => handleReceivedAmountChange(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="re-f-group">
                            <label>PAYMODE</label>
                            <select value={formData.paymode_ledger_id} onChange={e => setFormData({...formData, paymode_ledger_id: e.target.value})}>
                                <option value="">-- Select Account --</option>
                                {ledgers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className="re-f-group flex-1">
                            <label>NARRATION</label>
                            <input value={formData.narration} onChange={e => setFormData({...formData, narration: e.target.value})} placeholder="Payment details..." />
                        </div>
                    </div>

                    {/* INVOICE FILTERS & BILLS */}
                    <div className="re-form-bills">
                        <div className="re-fb-controls">
                            <div className="re-fb-btns">
                                <button className="re-toggle-btn active">INVOICE NO</button>
                                <button className="re-toggle-btn">TOT BILLS <span className="badge">{bills.length}</span></button>
                            </div>
                            <div className="re-date-filter">
                                <span>FROM</span><input type="date" />
                                <span>TO</span><input type="date" />
                            </div>
                        </div>

                        <div className="re-table-area shrink-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{width:40}}>
                                            <input 
                                                type="checkbox" 
                                                onChange={handleSelectAll} 
                                                checked={bills.length > 0 && bills.every(b => b.is_selected)}
                                            />
                                        </th>
                                        <th>INVOICE NO</th>
                                        <th>INV DATE</th>
                                        <th>DUE DAY</th>
                                        <th>DUE DATE</th>
                                        <th className="text-right">INVOICE AMOUNT</th>
                                        <th className="text-right">RECEIVED AMOUNT</th>
                                        <th className="text-right">PENDING AMOUNT</th>
                                        <th className="text-right" style={{width:160}}>SETTELED AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.length === 0 && <tr><td colSpan={9} className="re-empty py-10 text-slate-400 font-medium">Select a party to view unpaid invoices</td></tr>}
                                    {bills.map((b, idx) => (
                                        <tr key={b._id}>
                                            <td>
                                                <input 
                                                    type="checkbox" 
                                                    checked={b.is_selected || false} 
                                                    onChange={e => handleCheckboxChange(idx, e.target.checked)} 
                                                />
                                            </td>
                                            <td className="font-bold">{b.bill_number}</td>
                                            <td>{fmtD(b.createdAt)}</td>
                                            <td>{b.due_days || 0}</td>
                                            <td>{fmtD(b.createdAt)}</td> 
                                            <td className="text-right">₹{fmt(b.grand_total)}</td>
                                            <td className="text-right text-green-600">₹{fmt(b.total_paid)}</td>
                                            <td className="text-right text-red-500 font-bold">₹{fmt(b.due_amount)}</td>
                                            <td className="text-right">
                                                <input 
                                                    type="number" 
                                                    className="re-settle-input" 
                                                    placeholder="NEED TO TYPE" 
                                                    value={b.amount_settled}
                                                    max={b.due_amount}
                                                    onChange={(e) => handleBillChange(idx, e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="re-form-footer">
                        <button className="re-btn bg-slate-200 text-slate-800" disabled={saving} onClick={() => handleSave(true)}>
                            SAVE & PRINT
                        </button>
                        <button className="re-btn bg-green-600 text-white" disabled={saving} onClick={() => handleSave(false)}>
                            {saving ? <Loader2 className="spin" size={16}/> : 'SAVE'}
                        </button>
                    </div>
                </div>
                )}
            </main>
        </div>
    );
}
