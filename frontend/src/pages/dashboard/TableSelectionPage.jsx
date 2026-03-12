import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    Loader2, Truck, Package, Users2, RefreshCw,
    Clock, Users, IndianRupee, Eye, Plus, X,
    Phone, StickyNote, CalendarClock, XCircle, CheckCircle2
} from 'lucide-react';

/* ─── helpers ─── */
const getToken = () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).token : '';
};

const headers = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
});

/* ─── Table-leg SVG icon ─── */
const TableSVG = ({ color = '#cbd5e1', size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        {/* table top */}
        <rect x="3" y="9" width="22" height="4" rx="2" fill={color} />
        {/* legs */}
        <rect x="6"  y="13" width="3" height="8" rx="1.5" fill={color} />
        <rect x="19" y="13" width="3" height="8" rx="1.5" fill={color} />
    </svg>
);

/* ─── Single compact table card ─── */
const TableCard = ({ table, onSelect, onReserve, onCancelReserve }) => {
    const isAvail    = table.status === 'AVAILABLE';
    const isOccupied = table.status === 'OCCUPIED';
    const isReserved = table.status === 'RESERVED';

    const border = isOccupied ? '#fb923c' : isReserved ? '#a78bfa' : '#d1d5db';
    const bg     = isOccupied ? '#fff7ed' : isReserved ? '#faf5ff' : '#ffffff';
    const numCol = isOccupied ? '#c2410c' : isReserved ? '#7c3aed' : '#1e293b';
    const iconCol= isOccupied ? '#fb923c' : isReserved ? '#a78bfa' : '#94a3b8';

    const handleClick = () => {
        if (isAvail) {
            onSelect(table);
        } else if (isReserved) {
            // Open a small menu - handled by right-click context or action buttons below
            onSelect(table);
        } else if (isOccupied) {
            onSelect(table);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {/* Card */}
            <button
                onClick={handleClick}
                style={{
                    width: '80px', minHeight: '80px', border: `2px solid ${border}`,
                    borderRadius: '10px', background: bg, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '3px', padding: '8px 4px',
                    transition: 'all 0.18s', outline: 'none', position: 'relative'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 6px 18px ${border}55`;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {/* Timer / amount for occupied */}
                {isOccupied && (
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#ea580c', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                        {table.running_time && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Clock size={8} />{table.running_time}
                            </span>
                        )}
                        {table.running_amount && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <IndianRupee size={8} />{table.running_amount}
                            </span>
                        )}
                    </div>
                )}

                {/* Reserved customer name */}
                {isReserved && table.reservation_name && (
                    <div style={{ fontSize: '8px', fontWeight: 800, color: '#7c3aed', textAlign: 'center', maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {table.reservation_name}
                    </div>
                )}

                <TableSVG color={iconCol} size={30} />

                {/* View icon row for occupied */}
                {isOccupied && (
                    <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={9} color="white" />
                        </div>
                        <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={9} color="white" />
                        </div>
                    </div>
                )}
            </button>

            {/* Table name label */}
            <div style={{ fontSize: '11px', fontWeight: 900, color: numCol, textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center' }}>
                {table.table_number}
            </div>

            {/* Seats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>
                <Users size={8} />{table.seating_capacity || '-'}
            </div>

            {/* Action buttons for reserved table */}
            {isReserved && (
                <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                    <button
                        onClick={() => onSelect(table)}
                        title="Proceed to billing"
                        style={{ padding: '2px 6px', fontSize: '8px', fontWeight: 800, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        BILL
                    </button>
                    <button
                        onClick={() => onCancelReserve(table)}
                        title="Cancel reservation"
                        style={{ padding: '2px 6px', fontSize: '8px', fontWeight: 800, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <XCircle size={9} />
                    </button>
                </div>
            )}

            {/* Reserve button for available table */}
            {isAvail && (
                <button
                    onClick={(e) => { e.stopPropagation(); onReserve(table); }}
                    title="Reserve this table"
                    style={{ padding: '2px 6px', fontSize: '8px', fontWeight: 800, background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff', borderRadius: '4px', cursor: 'pointer', marginTop: '2px' }}
                >
                    RESERVE
                </button>
            )}
        </div>
    );
};

/* ─── Reservation Modal ─── */
const ReservationModal = ({ table, onClose, onConfirm, loading }) => {
    const [form, setForm] = useState({
        reservation_name: '',
        reservation_phone: '',
        reservation_time: '',
        reservation_note: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.reservation_name.trim()) return alert('Customer name is required');
        onConfirm(table._id, form);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '420px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>Reserve Table</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                            Table {table.table_number} · {table.seating_capacity} seats
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Customer Name *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                required
                                type="text"
                                value={form.reservation_name}
                                onChange={e => setForm(f => ({ ...f, reservation_name: e.target.value }))}
                                placeholder="Enter customer name"
                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Phone Number
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="tel"
                                value={form.reservation_phone}
                                onChange={e => setForm(f => ({ ...f, reservation_phone: e.target.value }))}
                                placeholder="10-digit mobile number"
                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Reservation Time
                        </label>
                        <div style={{ position: 'relative' }}>
                            <CalendarClock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="time"
                                value={form.reservation_time}
                                onChange={e => setForm(f => ({ ...f, reservation_time: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Note
                        </label>
                        <div style={{ position: 'relative' }}>
                            <StickyNote size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                            <textarea
                                value={form.reservation_note}
                                onChange={e => setForm(f => ({ ...f, reservation_note: e.target.value }))}
                                placeholder="Any special requirements..."
                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, outline: 'none', resize: 'none', minHeight: '70px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
                            Confirm Reservation
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '12px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Main Page ─── */
const TableSelectionPage = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reserveTarget, setReserveTarget] = useState(null);   // table to reserve
    const [reserveLoading, setReserveLoading] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(p => !p);
        else {
            const n = !isCollapsed;
            setIsCollapsed(n);
            localStorage.setItem('sidebarCollapsed', n);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const hdr = { 'Authorization': `Bearer ${getToken()}` };
            const [tRes, ttRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/tables`, { headers: hdr }),
                fetch(`${import.meta.env.VITE_API_URL}/table-types`, { headers: hdr })
            ]);
            const tData = await tRes.json();
            const ttData = await ttRes.json();
            if (tData.success) setTables(tData.data);
            if (ttData.success) setTableTypes(ttData.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ── Navigate to billing ── */
    const handleSelect = (table) => {
        navigate('/dashboard/self-service/billing', {
            state: {
                fromTable: true,
                tableNo: table.table_number,
                tableId: table._id,
                persons: String(table.seating_capacity || ''),
                tableType: table.table_type || '',
                tableStatus: table.status,
                reservationName: table.reservation_name || '',
                reservationPhone: table.reservation_phone || ''
            }
        });
    };

    /* ── Reserve ── */
    const handleConfirmReservation = async (tableId, form) => {
        setReserveLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/reserve`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                setReserveTarget(null);
                fetchData();
            } else {
                alert(data.error || 'Reservation failed');
            }
        } catch (e) {
            alert('Network error');
        } finally {
            setReserveLoading(false);
        }
    };

    /* ── Cancel reservation ── */
    const handleCancelReserve = async (table) => {
        if (!window.confirm(`Cancel reservation for table ${table.table_number} (${table.reservation_name})?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}/cancel-reserve`, {
                method: 'PATCH',
                headers: headers()
            });
            const data = await res.json();
            if (data.success) fetchData();
            else alert(data.error || 'Failed to cancel reservation');
        } catch (e) {
            alert('Network error');
        }
    };

    /* ── Special order (no table) ── */
    const handleSpecialOrder = (mode) => {
        navigate('/dashboard/self-service/billing', {
            state: { fromTable: false, orderMode: mode }
        });
    };

    /* ── Group tables by type, preserving tableTypes order ── */
    const buildGroups = () => {
        const map = {};
        tableTypes.forEach(tt => { map[tt.name] = []; });
        tables.forEach(t => {
            const key = (t.table_type || '').trim() || 'Other';
            if (!map[key]) map[key] = [];
            map[key].push(t);
        });
        return Object.entries(map).filter(([, rows]) => rows.length > 0);
    };

    const groups = buildGroups();

    const stats = {
        total: tables.length,
        available: tables.filter(t => t.status === 'AVAILABLE').length,
        occupied: tables.filter(t => t.status === 'OCCUPIED').length,
        reserved: tables.filter(t => t.status === 'RESERVED').length,
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />}

            <main className="dashboard-main" style={{ background: '#f8fafc' }}>
                <Header toggleSidebar={toggleSidebar} />

                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>

                    {/* ── Top action bar ── */}
                    <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'stretch', height: '46px', flexShrink: 0 }}>
                        {[
                            { label: 'REFRESH', icon: <RefreshCw size={12} />, action: fetchData, color: '#6366f1' },
                            { label: 'TABLE RESERVATION', icon: <Plus size={12} />, action: () => alert('Click the RESERVE button under any available table'), color: '#7c3aed' },
                            { label: 'ADD TABLE', icon: <Plus size={12} />, action: () => navigate('/dashboard/self-service/tables'), color: '#475569' },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.action}
                                style={{ padding: '0 16px', background: 'none', border: 'none', borderRight: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: btn.color, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                            >
                                {btn.icon}{btn.label}
                            </button>
                        ))}

                        <div style={{ flex: 1 }} />

                        {[
                            { label: 'PARCEL', icon: <Package size={12} />, mode: 'PARCEL' },
                            { label: 'DELIVERY', icon: <Truck size={12} />, mode: 'DELIVERY' },
                            { label: 'PARTY ORDER', icon: <Users2 size={12} />, mode: 'PARTY_ORDER' },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => handleSpecialOrder(btn.mode)}
                                style={{ padding: '0 16px', background: 'none', border: 'none', borderLeft: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#6366f1'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}
                            >
                                {btn.icon}{btn.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Legend ── */}
                    <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '5px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '18px', flexShrink: 0 }}>
                        {[
                            { color: '#d1d5db', label: 'BLANK TABLE' },
                            { color: '#fb923c', label: 'RUNNING TABLE' },
                            { color: '#22c55e', label: 'PRINTED TABLE' },
                            { color: '#a78bfa', label: 'RESERVE TABLE' },
                        ].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Stats strip ── */}
                    <div style={{ background: '#fff', borderBottom: '2px solid #f1f5f9', padding: '7px 20px', display: 'flex', gap: '24px', alignItems: 'center', flexShrink: 0 }}>
                        {[
                            { label: 'Total', value: stats.total, color: '#6366f1' },
                            { label: 'Available', value: stats.available, color: '#16a34a' },
                            { label: 'Running', value: stats.occupied, color: '#ea580c' },
                            { label: 'Reserved', value: stats.reserved, color: '#7c3aed' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '17px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                            </div>
                        ))}

                        {/* Refresh indicator */}
                        <button
                            onClick={fetchData}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700 }}
                        >
                            <RefreshCw size={11} /> Refresh
                        </button>
                    </div>

                    {/* ── Zone-grouped tables ── */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                                <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '10px' }} />
                                <p style={{ fontWeight: 800, color: '#cbd5e1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Loading Floor Plan...</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                                <p style={{ fontWeight: 700, fontSize: '14px' }}>No tables found.</p>
                                <p style={{ fontSize: '12px', marginTop: '6px' }}>Go to <strong>Master → Table</strong> to add tables.</p>
                            </div>
                        ) : (
                            groups.map(([zoneName, zoneTables]) => (
                                <div key={zoneName}>
                                    {/* Zone header */}
                                    <div style={{
                                        padding: '10px 20px',
                                        fontSize: '11px', fontWeight: 900, color: '#64748b',
                                        textTransform: 'uppercase', letterSpacing: '0.15em',
                                        background: '#f8fafc',
                                        borderBottom: '1px solid #f1f5f9',
                                        borderTop: '1px solid #f1f5f9',
                                        display: 'flex', alignItems: 'center', gap: '10px'
                                    }}>
                                        {zoneName}
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', background: '#e2e8f0', padding: '1px 8px', borderRadius: '10px' }}>
                                            {zoneTables.length} table{zoneTables.length > 1 ? 's' : ''}
                                        </span>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#16a34a' }}>
                                            {zoneTables.filter(t => t.status === 'AVAILABLE').length} free
                                        </span>
                                        {zoneTables.filter(t => t.status === 'OCCUPIED').length > 0 && (
                                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#ea580c' }}>
                                                {zoneTables.filter(t => t.status === 'OCCUPIED').length} busy
                                            </span>
                                        )}
                                        {zoneTables.filter(t => t.status === 'RESERVED').length > 0 && (
                                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#7c3aed' }}>
                                                {zoneTables.filter(t => t.status === 'RESERVED').length} reserved
                                            </span>
                                        )}
                                    </div>

                                    {/* Horizontal scrollable table row */}
                                    <div style={{
                                        display: 'flex', gap: '16px', padding: '16px 20px',
                                        overflowX: 'auto', background: '#fff',
                                        borderBottom: '1px solid #f8fafc',
                                        scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent',
                                        alignItems: 'flex-start',
                                        minHeight: '140px'
                                    }}>
                                        {zoneTables.map(table => (
                                            <TableCard
                                                key={table._id}
                                                table={table}
                                                onSelect={handleSelect}
                                                onReserve={t => setReserveTarget(t)}
                                                onCancelReserve={handleCancelReserve}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* ── Reservation Modal ── */}
            {reserveTarget && (
                <ReservationModal
                    table={reserveTarget}
                    onClose={() => setReserveTarget(null)}
                    onConfirm={handleConfirmReservation}
                    loading={reserveLoading}
                />
            )}
        </div>
    );
};

export default TableSelectionPage;
