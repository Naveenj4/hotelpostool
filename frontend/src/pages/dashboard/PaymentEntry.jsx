import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    Search, Plus, Printer, Download, Trash2, ChevronLeft,
    Loader2, AlertCircle, CheckSquare
} from 'lucide-react';
import './ReceiptEntry.css';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };
const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
const todayStr = () => new Date().toISOString().split('T')[0];

export default function PaymentEntry() {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [view, setView] = useState('LIST');

    /* ── LIST STATE ── */
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ total_payable: 0, total_paid: 0, unpaid: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState(todayStr());
    const [toDate, setToDate] = useState(todayStr());

    /* ── FORM STATE ── */
    const [allLedgers, setAllLedgers] = useState([]);
    const [partyLedgers, setPartyLedgers] = useState([]);
    const [paymodeLedgers, setPaymodeLedgers] = useState([]);
    const [bills, setBills] = useState([]);
    const [saving, setSaving] = useState(false);
    const [counterSettings, setCounterSettings] = useState(null);

    // Multi-mode input states
    const [modes, setModes] = useState({
        cash: { amount: '', ledger_id: '' },
        upi: { amount: '', ledger_id: '' },
        card: { amount: '', ledger_id: '' }
    });

    // Party autocomplete
    const [partySearch, setPartySearch] = useState('');
    const [showPartyDropdown, setShowPartyDropdown] = useState(false);
    const partyRef = useRef(null);

    const [formData, setFormData] = useState({
        party_ledger_id: '',
        party_name: '',
        payment_no: '',
        date: todayStr(),
        paid_amount: '',
        paymode_ledger_id: '',
        reference_no: '',
        narration: ''
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    /* ─────────────── LIST ─────────────── */
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const q = new URLSearchParams();
            if (search) q.append('search', search);
            if (fromDate) q.append('startDate', fromDate);
            if (toDate) q.append('endDate', toDate);
            const [payRes, statRes] = await Promise.all([
                fetch(`${API}/payments?${q}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/payments/stats`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const payData = await payRes.json();
            const statData = await statRes.json();
            if (payData.success) setPayments(payData.data);
            if (statData.success) setStats(statData.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [search, fromDate, toDate]);

    useEffect(() => { if (view === 'LIST') fetchList(); }, [view, fetchList]);

    /* ─────────────── FORM DEPS ─────────────── */
    useEffect(() => {
        if (view !== 'FORM') return;
        const load = async () => {
            const token = getToken();
            const [resLedgers, resGroups] = await Promise.all([
                fetch(`${API}/ledgers`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/ledger-groups`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            const dataL = await resLedgers.json();
            const dataG = await resGroups.json();

            if (dataL.success) {
                const all = dataL.data;
                const groups = dataG.success ? dataG.data : [];

                const getSubgroups = (targetGroups) => {
                    let result = new Set(targetGroups);
                    let added = true;
                    while(added) {
                        added = false;
                        groups.forEach(g => {
                            if (result.has(g.parent) && !result.has(g.name)) {
                                result.add(g.name);
                                added = true;
                            }
                        });
                    }
                    return Array.from(result);
                };

                setAllLedgers(all);
                
                // Suppliers/party = Sundry Creditors group + custom
                const supplierGroups = getSubgroups(['Sundry Creditors']);
                setPartyLedgers(all.filter(l => supplierGroups.some(g => l.group?.toLowerCase() === g.toLowerCase())));
                
                // Paymode = Cash / Bank + custom
                const paymodeGroups = getSubgroups(['Bank Accounts', 'Cash-in-Hand', 'Cash in Hand', 'Bank OD A/c']);
                setPaymodeLedgers(all.filter(l =>
                    paymodeGroups.some(g => l.group?.toLowerCase() === g.toLowerCase()) ||
                    l.name?.toLowerCase().includes('cash') ||
                    l.name?.toLowerCase().includes('bank')
                ));

                // Fetch default ledgers
                fetch(`${API}/counters`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.json())
                    .then(d => {
                        if (d.success && d.data.length > 0) {
                            const c = d.data[0];
                            setCounterSettings(c);
                            setModes(prev => ({
                                ...prev,
                                cash: { ...prev.cash, ledger_id: c.cash_ledger_id || '' },
                                upi: { ...prev.upi, ledger_id: c.upi_ledger_id || '' },
                                card: { ...prev.card, ledger_id: c.card_ledger_id || '' }
                            }));
                        }
                    });
            }
        };
        load();
        resetForm();
    }, [view]);

    const resetForm = () => {
        setFormData({
            party_ledger_id: '', party_name: '',
            payment_no: `PAY-${Date.now().toString().slice(-5)}`,
            date: todayStr(), paid_amount: '',
            paymode_ledger_id: '', reference_no: '', narration: ''
        });
        setPartySearch('');
        setBills([]);
    };

    /* ─────────────── PARTY SEARCH ─────────────── */
    // All ledgers can be party (supplier type)
    const filteredParties = partySearch.length > 0
        ? allLedgers.filter(l => l.name.toLowerCase().startsWith(partySearch.toLowerCase())).slice(0, 10)
        : partyLedgers.slice(0, 10);

    const selectParty = (ledger) => {
        setFormData(fd => ({ ...fd, party_ledger_id: ledger._id, party_name: ledger.name }));
        setPartySearch(ledger.name);
        setShowPartyDropdown(false);
    };

    useEffect(() => {
        const handler = (e) => { if (partyRef.current && !partyRef.current.contains(e.target)) setShowPartyDropdown(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ─────────────── UNPAID PURCHASE BILLS ─────────────── */
    useEffect(() => {
        if (!formData.party_ledger_id || view !== 'FORM') { setBills([]); return; }
        const token = getToken();
        fetch(`${API}/payments/party/${formData.party_ledger_id}/unpaid`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                if (d?.success) setBills(d.data.map(b => ({ ...b, amount_settled: '', is_selected: false })));
                else setBills([]);
            })
            .catch(() => setBills([]));
    }, [formData.party_ledger_id, view]);

    /* ─────────────── PAYMODE ─────────────── */
    const selectedPaymode = paymodeLedgers.find(l => l._id === formData.paymode_ledger_id);
    const isBank = selectedPaymode && (
        selectedPaymode.group?.toLowerCase().includes('bank') ||
        selectedPaymode.name?.toLowerCase().includes('bank')
    );

    /* ─────────────── BILL LOGIC ─────────────── */
    const handlePaidAmountChange = (val) => {
        setFormData(fd => ({ ...fd, paid_amount: val }));
        distributeToBills(val);
    };

    const distributeToBills = (total) => {
        let remaining = parseFloat(total) || 0;
        const newBills = bills.map(b => {
            if (remaining > 0) {
                const settle = Math.min(remaining, b.due_amount);
                remaining -= settle;
                return { ...b, amount_settled: Math.round(settle * 100) / 100, is_selected: true };
            }
            return { ...b, amount_settled: '', is_selected: false };
        });
        setBills(newBills);
    };

    const handleModeAmountChange = (mode, val) => {
        const newModes = { ...modes, [mode]: { ...modes[mode], amount: val } };
        setModes(newModes);
        const total = (parseFloat(newModes.cash.amount) || 0) + 
                      (parseFloat(newModes.upi.amount) || 0) + 
                      (parseFloat(newModes.card.amount) || 0);
        setFormData(fd => ({ ...fd, paid_amount: total > 0 ? total.toString() : '' }));
        distributeToBills(total);
    };

    const handleBillChange = (idx, val) => {
        const newBills = [...bills];
        newBills[idx].amount_settled = val;
        newBills[idx].is_selected = parseFloat(val) > 0;
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData(fd => ({ ...fd, paid_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' }));
        setBills(newBills);
    };

    const handleCheckboxChange = (idx, checked) => {
        const newBills = [...bills];
        newBills[idx].is_selected = checked;
        newBills[idx].amount_settled = checked ? newBills[idx].due_amount : '';
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData(fd => ({ ...fd, paid_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' }));
        setBills(newBills);
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        const newBills = bills.map(b => ({ ...b, is_selected: checked, amount_settled: checked ? b.due_amount : '' }));
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData(fd => ({ ...fd, paid_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' }));
        setBills(newBills);
    };

    /* ─────────────── SAVE ─────────────── */
    const handleSave = async () => {
        if (!formData.party_ledger_id || !formData.paid_amount || !formData.paymode_ledger_id) {
            return alert('Please fill Party, Paid Amount, and Paymode.');
        }
        setSaving(true);
        try {
            const token = getToken();
            const settled = bills.filter(b => parseFloat(b.amount_settled) > 0)
                .map(b => ({ bill_id: b._id, amount_settled: parseFloat(b.amount_settled) }));

            const pModes = [];
            if (parseFloat(modes.cash.amount) > 0) pModes.push({ mode: 'CASH', amount: parseFloat(modes.cash.amount), ledger_id: modes.cash.ledger_id || formData.paymode_ledger_id });
            if (parseFloat(modes.upi.amount) > 0) pModes.push({ mode: 'UPI', amount: parseFloat(modes.upi.amount), ledger_id: modes.upi.ledger_id || formData.paymode_ledger_id });
            if (parseFloat(modes.card.amount) > 0) pModes.push({ mode: 'CARD', amount: parseFloat(modes.card.amount), ledger_id: modes.card.ledger_id || formData.paymode_ledger_id });

            const payload = {
                party_ledger_id: formData.party_ledger_id,
                payment_no: formData.payment_no,
                date: formData.date,
                paid_amount: formData.paid_amount,
                paymode_ledger_id: formData.paymode_ledger_id,
                reference_no: formData.reference_no,
                narration: formData.narration,
                settled_bills: settled,
                payment_modes: pModes.length > 0 ? pModes : undefined
            };

            const res = await fetch(`${API}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) { alert('Payment saved successfully.'); setView('LIST'); }
            else alert(data.error || 'Failed to save payment');
        } catch { alert('Failed to save payment'); }
        finally { setSaving(false); }
    };

    const handleKeyDown = (e, nextId, prevId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextEl = document.getElementById(nextId);
            if (nextEl) nextEl.focus();
        } else if (e.key === 'Backspace' && (!e.target.value || e.target.value === '')) {
            if (prevId) {
                e.preventDefault();
                const prevEl = document.getElementById(prevId);
                if (prevEl) prevEl.focus();
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this payment and revert balances?')) return;
        try {
            const res = await fetch(`${API}/payments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) fetchList();
            else alert(data.error);
        } catch { alert('Error deleting.'); }
    };

    const totalAmountList = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const selectedLedgerBalance = formData.party_ledger_id
        ? (allLedgers.find(l => l._id === formData.party_ledger_id)?.opening_balance || 0)
        : 0;

    return (
        <div className="dashboard-layout bg-receipt">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />
            )}
            <main className="dashboard-main min-h-screen">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Payment Entry"
                    actions={view === 'LIST' ? (
                        <button className="re-header-create-btn re-payment-btn" onClick={() => setView('FORM')}>
                            <Plus size={16} /> Create Payment
                        </button>
                    ) : (
                        <button className="re-header-back-btn" onClick={() => setView('LIST')}>
                            <ChevronLeft size={16} /> Back to List
                        </button>
                    )}
                />

                {/* ══════════ LIST VIEW ══════════ */}
                {view === 'LIST' && (
                    <div className="re-wrapper fade-in">
                        <div className="re-page-header">
                            <div className="re-page-title re-payment-title">Payment Entry</div>
                            <div className="re-topbar-actions">
                                <button className="re-icon-btn" title="Print" onClick={() => window.print()}><Printer size={16} /></button>
                                <button className="re-icon-btn" title="Download"><Download size={16} /></button>
                            </div>
                        </div>

                        {/* STATS */}
                        <div className="re-stats-row">
                            <div className="re-stat-card payable">
                                <div className="re-stat-label">Total Payable</div>
                                <div className="re-stat-value">₹{fmt(stats.total_payable)}</div>
                            </div>
                            <div className="re-stat-card paid">
                                <div className="re-stat-label">Total Paid</div>
                                <div className="re-stat-value">₹{fmt(stats.total_paid)}</div>
                            </div>
                            <div className="re-stat-card unpaid">
                                <div className="re-stat-label">Outstanding</div>
                                <div className="re-stat-value">₹{fmt(stats.unpaid)}</div>
                            </div>
                        </div>

                        {/* FILTERS */}
                        <div className="re-filters-bar">
                            <div className="re-search-wrap">
                                <Search size={15} className="re-search-icon" />
                                <input
                                    className="re-search-input"
                                    placeholder="Search by payment no or party..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="re-date-range">
                                <label>From</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                                <label>To</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                            </div>
                            <button className="re-create-btn-list re-payment-create-btn" onClick={() => setView('FORM')}>
                                <Plus size={15} /> Create Payment
                            </button>
                        </div>

                        {/* TABLE */}
                        <div className="re-table-card">
                            <table className="re-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Payment No</th>
                                        <th>Date</th>
                                        <th>Party Name</th>
                                        <th>Narration</th>
                                        <th className="text-right">Amount</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && <tr><td colSpan={7} className="re-empty"><Loader2 className="spin" size={20} /></td></tr>}
                                    {!loading && payments.length === 0 && <tr><td colSpan={7} className="re-empty">No payments found for today</td></tr>}
                                    {!loading && payments.map((p, i) => (
                                        <tr key={p._id} className="re-tr">
                                            <td>{i + 1}</td>
                                            <td className="re-voucher-no">{p.voucher_number}</td>
                                            <td>{fmtD(p.date)}</td>
                                            <td className="re-party-name">{p.party_ledger_id?.name || '—'}</td>
                                            <td className="re-narration-cell">{p.narration || '—'}</td>
                                            <td className="text-right re-pay-amount-cell">
                                                <div className="re-amt-main">₹{fmt(p.amount)}</div>
                                                {p.payment_modes && p.payment_modes.length > 1 && (
                                                    <div className="re-amt-breakdown">
                                                        {p.payment_modes.map((m, idx) => (
                                                            <span key={idx} className={`re-mode-tag ${m.mode.toLowerCase()}`}>
                                                                {m.mode.slice(0, 1)}: {fmt(m.amount)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <button onClick={() => handleDelete(p._id)} className="re-del-btn" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* FOOTER */}
                        <div className="re-list-footer">
                            <span>Total Vouchers: <strong>{payments.length}</strong></span>
                            <span>Total Amount: <strong className="re-pay-total">₹{fmt(totalAmountList)}</strong></span>
                        </div>
                    </div>
                )}

                {/* ══════════ FORM VIEW ══════════ */}
                {view === 'FORM' && (
                    <div className="re-wrapper re-form-wrapper fade-in">
                        <div className="re-form-topbar">
                            <button className="re-back-link" onClick={() => setView('LIST')}>
                                <ChevronLeft size={18} /> Payment Entry
                            </button>
                            <div className="re-form-title re-payment-title">Create Payment</div>
                        </div>

                        {/* FORM FIELDS */}
                        <div className="re-form-grid">
                            {/* PARTY NAME - autocomplete */}
                            <div className="re-field-group re-party-field" ref={partyRef}>
                                <label className="re-field-label">Party Name *</label>
                                <div className="re-autocomplete-wrap">
                                    <input
                                        id="pe_party_search"
                                        className="re-input"
                                        placeholder="Type to search supplier..."
                                        value={partySearch}
                                        onChange={e => {
                                            setPartySearch(e.target.value);
                                            setShowPartyDropdown(true);
                                            if (!e.target.value) setFormData(fd => ({ ...fd, party_ledger_id: '', party_name: '' }));
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !showPartyDropdown) handleKeyDown(e, 'pe_payment_no');
                                        }}
                                        onFocus={() => setShowPartyDropdown(true)}
                                        autoComplete="off"
                                    />
                                    {showPartyDropdown && filteredParties.length > 0 && (
                                        <ul className="re-dropdown">
                                            {filteredParties.map(l => (
                                                <li key={l._id} onMouseDown={() => selectParty(l)}>
                                                    <span className="re-dd-name">{l.name}</span>
                                                    <span className="re-dd-group">{l.group}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* BALANCE (readonly) */}
                            <div className="re-field-group">
                                <label className="re-field-label">Balance</label>
                                <input className="re-input re-readonly" readOnly value={formData.party_ledger_id ? `₹${fmt(selectedLedgerBalance)}` : '—'} />
                            </div>

                            {/* PAYMENT NO */}
                            <div className="re-field-group">
                                <label className="re-field-label">Payment No</label>
                                <input id="pe_payment_no" className="re-input" value={formData.payment_no} 
                                    onKeyDown={e => handleKeyDown(e, 'pe_date', 'pe_party_search')}
                                    onChange={e => setFormData(fd => ({ ...fd, payment_no: e.target.value }))} />
                            </div>

                            {/* DATE */}
                            <div className="re-field-group">
                                <label className="re-field-label">Date</label>
                                <input id="pe_date" type="date" className="re-input" value={formData.date} 
                                    onKeyDown={e => handleKeyDown(e, 'pe_amount', 'pe_payment_no')}
                                    onChange={e => setFormData(fd => ({ ...fd, date: e.target.value }))} />
                            </div>

                            {/* PAID AMOUNT * */}
                            <div className="re-field-group">
                                <label className="re-field-label">Paid Amount *</label>
                                <input
                                    id="pe_amount"
                                    type="number" className="re-input re-pay-amt-input"
                                    placeholder="0.00"
                                    value={formData.paid_amount}
                                    onKeyDown={e => handleKeyDown(e, 'pe_paymode', 'pe_date')}
                                    onChange={e => handlePaidAmountChange(e.target.value)}
                                />
                            </div>

                            <div className="re-field-group">
                                <label className="re-field-label">Pay Mode (Primary) *</label>
                                <select
                                    id="pe_paymode"
                                    className="re-input"
                                    value={formData.paymode_ledger_id}
                                    onKeyDown={e => handleKeyDown(e, 'pe_cash_amt', 'pe_amount')}
                                    onChange={e => {
                                        const lid = e.target.value;
                                        setFormData(fd => ({ ...fd, paymode_ledger_id: lid, reference_no: '' }));
                                        setModes(prev => ({
                                            ...prev,
                                            cash: { ...prev.cash, ledger_id: prev.cash.ledger_id || lid },
                                            upi: { ...prev.upi, ledger_id: prev.upi.ledger_id || lid },
                                            card: { ...prev.card, ledger_id: prev.card.ledger_id || lid }
                                        }));
                                    }}
                                >
                                    <option value="">— Select Account —</option>
                                    {(() => {
                                        const grouped = paymodeLedgers.reduce((acc, l) => {
                                            const cat = l.group || 'OTHER';
                                            if(!acc[cat]) acc[cat] = [];
                                            acc[cat].push(l);
                                            return acc;
                                        }, {});
                                        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, list]) => (
                                            <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                                                {list.sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                            </optgroup>
                                        ));
                                    })()}
                                </select>
                            </div>

                            {/* BREAKDOWN ROW */}
                            <div className="re-field-group" style={{ gridColumn: '1 / -1' }}>
                                <div className="re-breakdown-row">
                                    <div className="re-mode-col">
                                        <label className="re-field-label">Cash Amount</label>
                                        <input id="pe_cash_amt" type="number" className="re-input" placeholder="0.00" 
                                            value={modes.cash.amount} 
                                            onKeyDown={e => handleKeyDown(e, 'pe_upi_amt', 'pe_paymode')}
                                            onChange={e => handleModeAmountChange('cash', e.target.value)} />
                                    </div>
                                    <div className="re-mode-col">
                                        <label className="re-field-label">UPI Amount</label>
                                        <input id="pe_upi_amt" type="number" className="re-input" placeholder="0.00" 
                                            value={modes.upi.amount} 
                                            onKeyDown={e => handleKeyDown(e, 'pe_card_amt', 'pe_cash_amt')}
                                            onChange={e => handleModeAmountChange('upi', e.target.value)} />
                                    </div>
                                    <div className="re-mode-col">
                                        <label className="re-field-label">Card Amount</label>
                                        <input id="pe_card_amt" type="number" className="re-input" placeholder="0.00" 
                                            value={modes.card.amount} 
                                            onKeyDown={e => handleKeyDown(e, isBank ? 'pe_ref' : 'pe_narration', 'pe_upi_amt')}
                                            onChange={e => handleModeAmountChange('card', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* REFERENCE NO - only when bank selected */}
                            {isBank && (
                                <div className="re-field-group">
                                    <label className="re-field-label">Reference / Cheque No</label>
                                    <input
                                        id="pe_ref"
                                        className="re-input"
                                        placeholder="Cheque / Transfer Ref No"
                                        value={formData.reference_no}
                                        onKeyDown={e => handleKeyDown(e, 'pe_narration', 'pe_paymode')}
                                        onChange={e => setFormData(fd => ({ ...fd, reference_no: e.target.value }))}
                                    />
                                </div>
                            )}

                            {/* NARRATION - multiline */}
                            <div className="re-field-group re-narration-group">
                                <label className="re-field-label">Narration</label>
                                <textarea
                                    id="pe_narration"
                                    className="re-textarea"
                                    rows={3}
                                    placeholder="Payment details / notes..."
                                    value={formData.narration}
                                    onKeyDown={e => handleKeyDown(e, 'pe_save_btn', isBank ? 'pe_ref' : 'pe_paymode')}
                                    onChange={e => setFormData(fd => ({ ...fd, narration: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* PENDING PURCHASE BILLS */}
                        {formData.party_ledger_id && bills.length > 0 && (
                            <div className="re-bills-section re-payment-bills">
                                <div className="re-bills-header">
                                    <CheckSquare size={16} />
                                    <span>Pending Purchase Bills — {bills.length} bill(s)</span>
                                    <AlertCircle size={14} className="re-bills-hint-icon" />
                                    <span className="re-bills-hint">Select bills to settle or enter amount above to auto-distribute</span>
                                </div>
                                <div className="re-table-card">
                                    <table className="re-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40 }}>
                                                    <input type="checkbox"
                                                        onChange={handleSelectAll}
                                                        checked={bills.length > 0 && bills.every(b => b.is_selected)}
                                                    />
                                                </th>
                                                <th>Invoice No</th>
                                                <th>Inv Date</th>
                                                <th>Due Date</th>
                                                <th className="text-right">Invoice Amt</th>
                                                <th className="text-right">Paid</th>
                                                <th className="text-right">Pending</th>
                                                <th className="text-right" style={{ width: 160 }}>Settle Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bills.map((b, idx) => (
                                                <tr key={b._id} className={b.is_selected ? 're-tr re-tr-selected' : 're-tr'}>
                                                    <td>
                                                        <input type="checkbox"
                                                            checked={b.is_selected || false}
                                                            onChange={e => handleCheckboxChange(idx, e.target.checked)}
                                                        />
                                                    </td>
                                                    <td className="re-voucher-no">{b.bill_number}</td>
                                                    <td>{fmtD(b.createdAt)}</td>
                                                    <td>{fmtD(b.due_date) || '—'}</td>
                                                    <td className="text-right">₹{fmt(b.grand_total)}</td>
                                                    <td className="text-right re-paid-cell">₹{fmt(b.total_paid)}</td>
                                                    <td className="text-right re-pay-pending-cell">₹{fmt(b.due_amount)}</td>
                                                    <td className="text-right">
                                                        <input
                                                            type="number"
                                                            className="re-settle-input re-pay-settle-input"
                                                            placeholder="0.00"
                                                            value={b.amount_settled}
                                                            max={b.due_amount}
                                                            onChange={e => handleBillChange(idx, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="re-bills-summary">
                                    <span>Selected: <strong>{bills.filter(b => b.is_selected).length}</strong> bills</span>
                                    <span>Total Settling: <strong className="re-pay-total">₹{fmt(bills.reduce((a, b) => a + (parseFloat(b.amount_settled) || 0), 0))}</strong></span>
                                </div>
                            </div>
                        )}

                        {/* SAVE BUTTONS */}
                        <div className="re-form-actions">
                            <button className="re-btn-secondary" onClick={() => setView('LIST')} disabled={saving}>Cancel</button>
                            <button className="re-btn-print" onClick={() => { }} disabled={saving}>
                                <Printer size={15} /> Save & Print
                            </button>
                            <button id="pe_save_btn" className="re-btn-save re-btn-payment" onClick={handleSave} disabled={saving}
                                onKeyDown={e => {
                                    if (e.key === 'Backspace') { e.preventDefault(); document.getElementById('pe_narration').focus(); }
                                }}>
                                {saving ? <Loader2 className="spin" size={16} /> : 'Save Payment'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
