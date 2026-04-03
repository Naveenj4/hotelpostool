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

export default function ReceiptEntry() {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [view, setView] = useState('LIST');

    /* ── LIST STATE ── */
    const [receipts, setReceipts] = useState([]);
    const [stats, setStats] = useState({ total_receivable: 0, total_paid: 0, unpaid: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState(todayStr());
    const [toDate, setToDate] = useState(todayStr());

    /* ── FORM STATE ── */
    const [allLedgers, setAllLedgers] = useState([]);     // All ledgers from server
    const [partyLedgers, setPartyLedgers] = useState([]);  // Sundry Debtors
    const [paymodeLedgers, setPaymodeLedgers] = useState([]); // Cash/Bank
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
        receipt_no: '',
        date: todayStr(),
        received_amount: '',
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
            const [recRes, statRes] = await Promise.all([
                fetch(`${API}/receipts?${q}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/receipts/stats`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const recData = await recRes.json();
            const statData = await statRes.json();
            if (recData.success) setReceipts(recData.data);
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
                
                const partyGroups = getSubgroups(['Sundry Debtors', 'Sundry Creditors']);
                setPartyLedgers(all.filter(l => partyGroups.some(g => l.group?.toLowerCase() === g.toLowerCase())));
                
                const paymodeGroups = getSubgroups(['Bank Accounts', 'Cash-in-Hand', 'Cash in Hand', 'Bank OD A/c']);
                setPaymodeLedgers(all.filter(l =>
                    paymodeGroups.some(g => l.group?.toLowerCase() === g.toLowerCase()) ||
                    l.name?.toLowerCase().includes('cash') ||
                    l.name?.toLowerCase().includes('bank')
                ));

                // Try to find default ledgers from counters
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
            receipt_no: `REC-${Date.now().toString().slice(-5)}`,
            date: todayStr(), received_amount: '',
            paymode_ledger_id: '', reference_no: '', narration: ''
        });
        setPartySearch('');
        setBills([]);
    };

    /* ─────────────── PARTY SEARCH ─────────────── */
    const filteredParties = partySearch.length > 0
        ? allLedgers.filter(l => l.name.toLowerCase().startsWith(partySearch.toLowerCase())).slice(0, 10)
        : partyLedgers.slice(0, 10);

    const selectParty = (ledger) => {
        setFormData(fd => ({ ...fd, party_ledger_id: ledger._id, party_name: ledger.name }));
        setPartySearch(ledger.name);
        setShowPartyDropdown(false);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (partyRef.current && !partyRef.current.contains(e.target)) setShowPartyDropdown(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ─────────────── UNPAID BILLS ─────────────── */
    useEffect(() => {
        if (!formData.party_ledger_id || view !== 'FORM') { setBills([]); return; }
        // For receipts, try fetching unpaid bills by customer matching ledger name
        const partyLedger = allLedgers.find(l => l._id === formData.party_ledger_id);
        if (!partyLedger) return;
        const token = getToken();
        // We use customer-based unpaid bills; find customer by name matching ledger name
        fetch(`${API}/customers?search=${encodeURIComponent(partyLedger.name)}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data.length > 0) {
                    const cust = d.data.find(c => c.name.toLowerCase() === partyLedger.name.toLowerCase());
                    if (cust) {
                        return fetch(`${API}/receipts/party/${cust._id}/unpaid`, { headers: { Authorization: `Bearer ${token}` } });
                    }
                }
                return null;
            })
            .then(r => r ? r.json() : null)
            .then(d => {
                if (d?.success) {
                    setBills(d.data.map(b => ({ ...b, amount_settled: '', is_selected: false })));
                } else {
                    setBills([]);
                }
            })
            .catch(() => setBills([]));
    }, [formData.party_ledger_id, view, allLedgers]);

    /* ─────────────── PAYMODE SELECTION - show reference for bank ─────────────── */
    const selectedPaymode = paymodeLedgers.find(l => l._id === formData.paymode_ledger_id);
    const isBank = selectedPaymode && (
        selectedPaymode.group?.toLowerCase().includes('bank') ||
        selectedPaymode.name?.toLowerCase().includes('bank')
    );

    /* ─────────────── BILL LOGIC ─────────────── */
    const handleReceivedAmountChange = (val) => {
        setFormData(fd => ({ ...fd, received_amount: val }));
        
        // When total changes, if other modes are empty, assume it's the primary mode
        // But better to just distribute it to bills
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
        
        // Sum up all modes
        const total = (parseFloat(newModes.cash.amount) || 0) + 
                      (parseFloat(newModes.upi.amount) || 0) + 
                      (parseFloat(newModes.card.amount) || 0);
        
        setFormData(fd => ({ ...fd, received_amount: total > 0 ? total.toString() : '' }));
        distributeToBills(total);
    };

    const handleBillChange = (idx, val) => {
        const newBills = [...bills];
        newBills[idx].amount_settled = val;
        newBills[idx].is_selected = parseFloat(val) > 0;
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData(fd => ({ ...fd, received_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' }));
        setBills(newBills);
    };

    const handleCheckboxChange = (idx, checked) => {
        const newBills = [...bills];
        newBills[idx].is_selected = checked;
        newBills[idx].amount_settled = checked ? newBills[idx].due_amount : '';
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData(fd => ({ ...fd, received_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' }));
        setBills(newBills);
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        const newBills = bills.map(b => ({ ...b, is_selected: checked, amount_settled: checked ? b.due_amount : '' }));
        const sum = newBills.reduce((acc, b) => acc + (parseFloat(b.amount_settled) || 0), 0);
        setFormData(fd => ({ ...fd, received_amount: sum > 0 ? (Math.round(sum * 100) / 100).toString() : '' }));
        setBills(newBills);
    };

    /* ─────────────── SAVE ─────────────── */
    const handleSave = async () => {
        if (!formData.party_ledger_id || !formData.received_amount || !formData.paymode_ledger_id) {
            return alert('Please fill Party, Received Amount, and Paymode.');
        }
        setSaving(true);
        try {
            const token = getToken();
            // Find customer_id from party name to match old API
            const partyLedger = allLedgers.find(l => l._id === formData.party_ledger_id);
            const custRes = await fetch(`${API}/customers?search=${encodeURIComponent(partyLedger?.name || '')}`, { headers: { Authorization: `Bearer ${token}` } });
            const custData = await custRes.json();
            const cust = custData.success ? custData.data.find(c => c.name.toLowerCase() === (partyLedger?.name || '').toLowerCase()) : null;

            const settled = bills.filter(b => parseFloat(b.amount_settled) > 0)
                .map(b => ({ bill_id: b._id, amount_settled: parseFloat(b.amount_settled) }));

            const pModes = [];
            if (parseFloat(modes.cash.amount) > 0) pModes.push({ mode: 'CASH', amount: parseFloat(modes.cash.amount), ledger_id: modes.cash.ledger_id || formData.paymode_ledger_id });
            if (parseFloat(modes.upi.amount) > 0) pModes.push({ mode: 'UPI', amount: parseFloat(modes.upi.amount), ledger_id: modes.upi.ledger_id || formData.paymode_ledger_id });
            if (parseFloat(modes.card.amount) > 0) pModes.push({ mode: 'CARD', amount: parseFloat(modes.card.amount), ledger_id: modes.card.ledger_id || formData.paymode_ledger_id });

            const payload = {
                party_id: cust?._id || '',
                receipt_no: formData.receipt_no,
                date: formData.date,
                received_amount: formData.received_amount,
                paymode_ledger_id: formData.paymode_ledger_id,
                narration: formData.narration,
                settled_bills: settled,
                payment_modes: pModes.length > 0 ? pModes : undefined
            };

            const res = await fetch(`${API}/receipts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) { alert('Receipt saved successfully.'); setView('LIST'); }
            else alert(data.error || 'Failed to save receipt');
        } catch (err) { alert('Failed to save receipt'); }
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
        if (!window.confirm('Delete this receipt and revert balances?')) return;
        try {
            const res = await fetch(`${API}/receipts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) fetchList();
            else alert(data.error);
        } catch { alert('Error deleting.'); }
    };

    const totalAmountList = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
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
                    title="Receipt Entry"
                    actions={view === 'LIST' ? (
                        <button className="re-header-create-btn" onClick={() => setView('FORM')}>
                            <Plus size={16} /> Create Receipt
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
                            <div className="re-page-title">Receipt Entry</div>
                            <div className="re-topbar-actions">
                                <button className="re-icon-btn" title="Print" onClick={() => window.print()}><Printer size={16} /></button>
                                <button className="re-icon-btn" title="Download"><Download size={16} /></button>
                            </div>
                        </div>

                        {/* STATS */}
                        <div className="re-stats-row">
                            <div className="re-stat-card receivable">
                                <div className="re-stat-label">Total Receivable</div>
                                <div className="re-stat-value">₹{fmt(stats.total_receivable)}</div>
                            </div>
                            <div className="re-stat-card paid">
                                <div className="re-stat-label">Total Received</div>
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
                                    placeholder="Search by receipt no or party..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="re-date-range">
                                <label>From</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                                <label>To</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                            </div>
                            <button className="re-create-btn-list" onClick={() => setView('FORM')}>
                                <Plus size={15} /> Create Receipt
                            </button>
                        </div>

                        {/* TABLE */}
                        <div className="re-table-card">
                            <table className="re-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Receipt No</th>
                                        <th>Date</th>
                                        <th>Party Name</th>
                                        <th>Narration</th>
                                        <th className="text-right">Amount</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && <tr><td colSpan={7} className="re-empty"><Loader2 className="spin" size={20} /></td></tr>}
                                    {!loading && receipts.length === 0 && <tr><td colSpan={7} className="re-empty">No receipts found for today</td></tr>}
                                    {!loading && receipts.map((r, i) => (
                                        <tr key={r._id} className="re-tr">
                                            <td>{i + 1}</td>
                                            <td className="re-voucher-no">{r.voucher_number}</td>
                                            <td>{fmtD(r.date)}</td>
                                            <td className="re-party-name">{r.party_id?.name || r.party_ledger_id?.name || '—'}</td>
                                            <td className="re-narration-cell">{r.narration || '—'}</td>
                                            <td className="text-right re-amount-cell">
                                                <div className="re-amt-main">₹{fmt(r.amount)}</div>
                                                {r.payment_modes && r.payment_modes.length > 1 && (
                                                    <div className="re-amt-breakdown">
                                                        {r.payment_modes.map((m, idx) => (
                                                            <span key={idx} className={`re-mode-tag ${m.mode.toLowerCase()}`}>
                                                                {m.mode.slice(0, 1)}: {fmt(m.amount)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <button onClick={() => handleDelete(r._id)} className="re-del-btn" title="Delete">
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
                            <span>Total Vouchers: <strong>{receipts.length}</strong></span>
                            <span>Total Amount: <strong className="re-total-amount">₹{fmt(totalAmountList)}</strong></span>
                        </div>
                    </div>
                )}

                {/* ══════════ FORM VIEW ══════════ */}
                {view === 'FORM' && (
                    <div className="re-wrapper re-form-wrapper fade-in">
                        <div className="re-form-topbar">
                            <button className="re-back-link" onClick={() => setView('LIST')}>
                                <ChevronLeft size={18} /> Receipt Entry
                            </button>
                            <div className="re-form-title">Create Receipt</div>
                        </div>

                        {/* FORM HEADER FIELDS */}
                        <div className="re-form-grid">
                            {/* PARTY NAME - autocomplete */}
                            <div className="re-field-group re-party-field" ref={partyRef}>
                                <label className="re-field-label">Party Name *</label>
                                <div className="re-autocomplete-wrap">
                                    <input
                                        id="re_party_search"
                                        className="re-input"
                                        placeholder="Type to search party..."
                                        value={partySearch}
                                        onChange={e => {
                                            setPartySearch(e.target.value);
                                            setShowPartyDropdown(true);
                                            if (!e.target.value) setFormData(fd => ({ ...fd, party_ledger_id: '', party_name: '' }));
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !showPartyDropdown) handleKeyDown(e, 're_receipt_no');
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

                            {/* RECEIPT NO */}
                            <div className="re-field-group">
                                <label className="re-field-label">Receipt No</label>
                                <input id="re_receipt_no" className="re-input" value={formData.receipt_no} 
                                    onKeyDown={e => handleKeyDown(e, 're_date', 're_party_search')}
                                    onChange={e => setFormData(fd => ({ ...fd, receipt_no: e.target.value }))} />
                            </div>

                            {/* DATE */}
                            <div className="re-field-group">
                                <label className="re-field-label">Date</label>
                                <input id="re_date" type="date" className="re-input" value={formData.date} 
                                    onKeyDown={e => handleKeyDown(e, 're_amount', 're_receipt_no')}
                                    onChange={e => setFormData(fd => ({ ...fd, date: e.target.value }))} />
                            </div>

                            {/* RECEIVED AMOUNT * */}
                            <div className="re-field-group">
                                <label className="re-field-label">Received Amount *</label>
                                <input
                                    id="re_amount"
                                    type="number" className="re-input re-amt-input"
                                    placeholder="0.00"
                                    value={formData.received_amount}
                                    onKeyDown={e => handleKeyDown(e, 're_paymode', 're_date')}
                                    onChange={e => handleReceivedAmountChange(e.target.value)}
                                />
                            </div>

                            <div className="re-field-group">
                                <label className="re-field-label">Pay Mode (Primary) *</label>
                                <select
                                    id="re_paymode"
                                    className="re-input"
                                    value={formData.paymode_ledger_id}
                                    onKeyDown={e => handleKeyDown(e, 're_cash_amt', 're_amount')}
                                    onChange={e => {
                                        const lid = e.target.value;
                                        setFormData(fd => ({ ...fd, paymode_ledger_id: lid, reference_no: '' }));
                                        // Also update mode ledgers if they are not set
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
                                        <input id="re_cash_amt" type="number" className="re-input" placeholder="0.00" 
                                            value={modes.cash.amount} 
                                            onKeyDown={e => handleKeyDown(e, 're_upi_amt', 're_paymode')}
                                            onChange={e => handleModeAmountChange('cash', e.target.value)} />
                                    </div>
                                    <div className="re-mode-col">
                                        <label className="re-field-label">UPI Amount</label>
                                        <input id="re_upi_amt" type="number" className="re-input" placeholder="0.00" 
                                            value={modes.upi.amount} 
                                            onKeyDown={e => handleKeyDown(e, 're_card_amt', 're_cash_amt')}
                                            onChange={e => handleModeAmountChange('upi', e.target.value)} />
                                    </div>
                                    <div className="re-mode-col">
                                        <label className="re-field-label">Card Amount</label>
                                        <input id="re_card_amt" type="number" className="re-input" placeholder="0.00" 
                                            value={modes.card.amount} 
                                            onKeyDown={e => handleKeyDown(e, isBank ? 're_ref' : 're_narration', 're_upi_amt')}
                                            onChange={e => handleModeAmountChange('card', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* REFERENCE NO - only when bank selected */}
                            {isBank && (
                                <div className="re-field-group">
                                    <label className="re-field-label">Reference / Cheque No</label>
                                    <input
                                        id="re_ref"
                                        className="re-input"
                                        placeholder="Cheque / Transfer Ref No"
                                        value={formData.reference_no}
                                        onKeyDown={e => handleKeyDown(e, 're_narration', 're_paymode')}
                                        onChange={e => setFormData(fd => ({ ...fd, reference_no: e.target.value }))}
                                    />
                                </div>
                            )}

                            {/* NARRATION - multiline */}
                            <div className="re-field-group re-narration-group">
                                <label className="re-field-label">Narration</label>
                                <textarea
                                    id="re_narration"
                                    className="re-textarea"
                                    rows={3}
                                    placeholder="Payment details / notes..."
                                    value={formData.narration}
                                    onKeyDown={e => handleKeyDown(e, 're_save_btn', isBank ? 're_ref' : 're_paymode')}
                                    onChange={e => setFormData(fd => ({ ...fd, narration: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* PENDING BILLS */}
                        {formData.party_ledger_id && bills.length > 0 && (
                            <div className="re-bills-section">
                                <div className="re-bills-header">
                                    <CheckSquare size={16} />
                                    <span>Pending Bills — {bills.length} bill(s)</span>
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
                                                <th className="text-right">Received</th>
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
                                                    <td className="text-right re-pending-cell">₹{fmt(b.due_amount)}</td>
                                                    <td className="text-right">
                                                        <input
                                                            type="number"
                                                            className="re-settle-input"
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
                                    <span>Total Settling: <strong className="re-total-amount">₹{fmt(bills.reduce((a, b) => a + (parseFloat(b.amount_settled) || 0), 0))}</strong></span>
                                </div>
                            </div>
                        )}

                        {/* SAVE BUTTONS */}
                        <div className="re-form-actions">
                            <button className="re-btn-secondary" onClick={() => setView('LIST')} disabled={saving}>Cancel</button>
                            <button className="re-btn-print" onClick={() => { }} disabled={saving}>
                                <Printer size={15} /> Save & Print
                            </button>
                            <button id="re_save_btn" className="re-btn-save" onClick={handleSave} disabled={saving}
                                onKeyDown={e => {
                                    if (e.key === 'Backspace') { e.preventDefault(); document.getElementById('re_narration').focus(); }
                                }}>
                                {saving ? <Loader2 className="spin" size={16} /> : 'Save Receipt'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
