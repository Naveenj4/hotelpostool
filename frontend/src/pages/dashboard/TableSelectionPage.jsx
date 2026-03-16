import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    Loader2, Truck, Package, Users2, RefreshCw,
    Clock, Users, IndianRupee, Plus, X,
    Phone, StickyNote, CalendarClock, XCircle, CheckCircle2, Printer
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
        <rect x="6" y="13" width="3" height="8" rx="1.5" fill={color} />
        <rect x="19" y="13" width="3" height="8" rx="1.5" fill={color} />
    </svg>
);

/* ─── Live timer hook ─── */
const useLiveTimer = (since) => {
    const [display, setDisplay] = useState('');
    const timerRef = useRef(null);
    useEffect(() => {
        if (!since) { setDisplay(''); return; }
        const calc = () => {
            const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            if (h > 0) setDisplay(`${h}h ${String(m).padStart(2,'0')}m`);
            else setDisplay(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
        };
        calc();
        timerRef.current = setInterval(calc, 1000);
        return () => clearInterval(timerRef.current);
    }, [since]);
    return display;
};

// Inject readyPulse keyframe once
if (typeof document !== 'undefined' && !document.getElementById('readyPulseStyle')) {
    const s = document.createElement('style');
    s.id = 'readyPulseStyle';
    s.textContent = `@keyframes readyPulse { from { opacity:1; transform: translateX(-50%) scale(1); } to { opacity:0.75; transform: translateX(-50%) scale(1.08); } }`;
    document.head.appendChild(s);
}

/* ─── Single compact table card ─── */
const TableCard = ({ table, onSelect, onReserve, onCancelReserve, onReset }) => {
    const isAvail   = table.status === 'AVAILABLE';
    const isOccupied = table.status === 'OCCUPIED';
    const isPrinted  = table.status === 'PRINTED';
    const isReserved = table.status === 'RESERVED';
    const isActive   = isOccupied || isPrinted; // table has an open session

    const colorScheme = isOccupied
        ? { border: '#fb923c', bg: '#fffaf5', text: '#c2410c', icon: '#fb923c', glow: '#fb923c33' }
        : isPrinted
            ? { border: '#22c55e', bg: '#f0fdf4', text: '#15803d', icon: '#22c55e', glow: '#22c55e33' }
            : isReserved
                ? { border: '#a78bfa', bg: '#fbfaff', text: '#7c3aed', icon: '#a78bfa', glow: '#a78bfa33' }
                : { border: '#e2e8f0', bg: '#ffffff', text: '#1e293b', icon: '#94a3b8', glow: 'transparent' };

    const { border, bg, text: numCol, icon: iconCol, glow } = colorScheme;

    // Live timer from occupied_since
    const liveTimer = useLiveTimer(isActive ? table.occupied_since : null);

    const handleClick = () => onSelect(table);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {/* Card */}
            <button
                onClick={handleClick}
                style={{
                    width: '108px', minHeight: '108px', border: `1.5px solid ${border}`,
                    borderRadius: '16px', background: bg, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '6px', padding: '12px 6px',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none', position: 'relative',
                    boxShadow: isActive || isReserved ? `0 4px 14px ${glow}` : '0 2px 6px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 14px 28px ${border}44`;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = isActive || isReserved ? `0 4px 14px ${glow}` : '0 2px 6px rgba(0,0,0,0.03)';
                }}
            >
                {/* PRINTED badge — top of card */}
                {isPrinted && (
                    <div style={{
                        position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff',
                        fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(34,197,94,0.4)', letterSpacing: '0.05em'
                    }}>
                        <Printer size={8} /> PRINTED
                    </div>
                )}

                {/* KOT SENT badge — bottom: shown after captain prints KOT */}
                {isActive && table.kot_status === 'KOT_SENT' && (
                    <div style={{
                        position: 'absolute', bottom: '-9px', left: '50%', transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff',
                        fontSize: '8px', fontWeight: 900, padding: '2px 7px', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(59,130,246,0.5)', letterSpacing: '0.05em', zIndex: 2
                    }}>
                        🍳 KOT SENT
                    </div>
                )}

                {/* READY badge — bottom: pulsing green when kitchen marks ready */}
                {isActive && table.kot_status === 'READY' && (
                    <div style={{
                        position: 'absolute', bottom: '-9px', left: '50%', transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff',
                        fontSize: '8px', fontWeight: 900, padding: '2px 7px', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(34,197,94,0.7)', letterSpacing: '0.05em', zIndex: 2,
                        animation: 'readyPulse 0.8s ease-in-out infinite alternate'
                    }}>
                        ✅ READY!
                    </div>
                )}

                {/* Top info: timer + amount for occupied / printed */}
                {isActive && (
                    <div style={{
                        position: 'absolute', top: isPrinted ? '10px' : '8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                    }}>
                        {liveTimer && (
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: '3px',
                                fontSize: '10px', fontWeight: 800,
                                color: isPrinted ? '#15803d' : '#d97706',
                                background: isPrinted ? 'rgba(220,252,231,0.9)' : 'rgba(254,249,195,0.9)',
                                padding: '1px 6px', borderRadius: '20px'
                            }}>
                                <Clock size={9} />{liveTimer}
                            </span>
                        )}
                        {table.running_amount > 0 && (
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: '2px',
                                fontSize: '10px', fontWeight: 900,
                                color: isPrinted ? '#15803d' : '#16a34a'
                            }}>
                                <IndianRupee size={9} />{Math.round(table.running_amount)}
                            </span>
                        )}
                    </div>
                )}

                {/* Reserved customer name */}
                {isReserved && table.reservation_name && (
                    <div style={{
                        fontSize: '10px', fontWeight: 800, color: '#7c3aed',
                        textAlign: 'center', maxWidth: '90px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        position: 'absolute', top: '10px',
                        background: 'rgba(245,243,255,0.9)', padding: '1px 6px', borderRadius: '10px'
                    }}>
                        {table.reservation_name}
                    </div>
                )}

                <TableSVG color={iconCol} size={42} />

                {/* Status bar */}
                <div style={{
                    marginTop: '4px', width: '28px', height: '4px', borderRadius: '2px',
                    background: isOccupied ? '#fb923c' : isPrinted ? '#22c55e' : isReserved ? '#a78bfa' : '#e2e8f0',
                    boxShadow: isActive || isReserved ? `0 0 8px ${border}` : 'none'
                }} />
            </button>

            {/* Table name label */}
            <div style={{ fontSize: '13px', fontWeight: 900, color: numCol, textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center' }}>
                {table.table_number}
            </div>

            {/* Seats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                <Users size={10} />{table.seating_capacity || '-'}
            </div>

            {/* Action buttons for RESERVED table */}
            {isReserved && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                        onClick={() => onSelect(table)}
                        title="Proceed to billing"
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 900, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(124,58,237,0.3)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        BILL
                    </button>
                    <button
                        onClick={() => onCancelReserve(table)}
                        title="Cancel reservation"
                        style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 800, background: '#fff', color: '#ef4444', border: '1.5px solid #fee2e2', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                    >
                        <XCircle size={14} />
                    </button>
                </div>
            )}

            {/* PRINTED / OCCUPIED — Reset button to manually clear table */}
            {isActive && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {isPrinted && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(table); }}
                            title="Open bill and process payment"
                            style={{
                                padding: '6px 14px', fontSize: '11px', fontWeight: 900,
                                background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff',
                                border: 'none', borderRadius: '10px', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(34,197,94,0.3)', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(34,197,94,0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(34,197,94,0.3)'; }}
                        >
                            <CheckCircle2 size={13} /> PAY
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onReset(table); }}
                        title="Manual reset: mark table as AVAILABLE"
                        style={{
                            padding: '6px 10px', fontSize: '11px', fontWeight: 800,
                            background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0',
                            borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <RefreshCw size={13} /> RESET
                    </button>
                </div>
            )}

            {/* Reserve button for AVAILABLE table */}
            {isAvail && (
                <button
                    onClick={(e) => { e.stopPropagation(); onReserve(table); }}
                    title="Reserve this table"
                    style={{
                        padding: '6px 14px', fontSize: '11px', fontWeight: 900,
                        background: '#ffffff', color: '#7c3aed',
                        border: '1.5px solid #e9d5ff', borderRadius: '10px',
                        cursor: 'pointer', marginTop: '6px',
                        boxShadow: '0 2px 5px rgba(124,58,237,0.05)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e9d5ff'; e.currentTarget.style.transform = 'scale(1)'; }}
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
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
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
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
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
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
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
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', resize: 'none', minHeight: '80px', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(124, 58, 237, 0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)'; }}
                        >
                            {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={20} />}
                            Confirm Reservation
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: '14px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
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

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
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
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Listen for real-time KOT/Order updates from other tabs
        const ch = new BroadcastChannel('restoboard_kot');
        ch.onmessage = (e) => {
            if (e.data?.type === 'KOT_FIRED' || e.data?.type === 'ORDER_READY' || e.data?.type === 'KOT_DELETED') {
                fetchData(true); // silent refresh
            }
        };

        // Fallback for older browsers
        const handleStorage = (e) => {
            if (e.key === 'kot_fired') fetchData(true);
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            ch.close();
            window.removeEventListener('storage', handleStorage);
        };
    }, [fetchData]);

    /* ── Navigate to billing ── */
    const handleSelect = (table) => {
        navigate('/dashboard/self-service/billing', {
            state: {
                fromTable: true,
                tableNo: table.table_number,
                tableId: table._id,
                billId: table.bill_id || null,       // existing bill to load (PRINTED/OCCUPIED)
                persons: String(table.seating_capacity || ''),
                tableType: table.table_type || '',
                tableStatus: table.status,            // AVAILABLE | OCCUPIED | PRINTED | RESERVED
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
    /* ── Cancel Reservation ── */
    const handleCancelReserve = async (table) => {
        if (!window.confirm(`Cancel reservation for Table ${table.table_number}?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}/cancel-reserve`, {
                method: 'PATCH',
                headers: headers()
            });
            const data = await res.json();
            if (data.success) fetchData();
        } catch (e) { alert('Network error'); }
    };

    /* ── Reset / Free Table (Customers left) ── */
    const handleResetTable = async (table) => {
        if (!window.confirm(`Force clear Table ${table.table_number}? This will mark it as AVAILABLE.`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}/free`, {
                method: 'PATCH',
                headers: headers()
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
            } else {
                alert(data.error || 'Reset failed');
            }
        } catch (e) { alert('Network error'); }
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
        printed: tables.filter(t => t.status === 'PRINTED').length,
        reserved: tables.filter(t => t.status === 'RESERVED').length,
    };

    // Auto-refresh every 30 seconds to keep live amounts current
    useEffect(() => {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />}

            <main className="dashboard-main" style={{ background: '#f8fafc' }}>
                <Header toggleSidebar={toggleSidebar} />

                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>

                    {/* ── Top action bar ── */}
                    <div style={{ background: '#fff', borderBottom: '1.5px solid #edf2f7', display: 'flex', alignItems: 'stretch', height: '56px', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        {[
                            { label: 'REFRESH', icon: <RefreshCw size={16} />, action: fetchData, color: '#6366f1', bg: '#eef2ff' },
                            { label: 'ADD TABLE', icon: <Plus size={16} />, action: () => navigate('/dashboard/self-service/tables'), color: '#4b5563', bg: '#f3f4f6' },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.action}
                                style={{ 
                                    padding: '0 24px', background: 'none', border: 'none', 
                                    borderRight: '1px solid #f1f5f9', cursor: 'pointer', 
                                    fontSize: '13px', fontWeight: 800, color: btn.color, 
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    whiteSpace: 'nowrap', transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = btn.bg; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = btn.color; }}
                            >
                                <span style={{ background: '#fff', padding: '6px', borderRadius: '8px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{btn.icon}</span>
                                {btn.label}
                            </button>
                        ))}

                        <div style={{ flex: 1 }} />

                        {[
                            { label: 'PARCEL', icon: <Package size={16} />, mode: 'PARCEL' },
                            { label: 'DELIVERY', icon: <Truck size={16} />, mode: 'DELIVERY' },
                            { label: 'PARTY', icon: <Users2 size={16} />, mode: 'PARTY_ORDER' },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => handleSpecialOrder(btn.mode)}
                                style={{ 
                                    padding: '0 24px', background: 'none', border: 'none', 
                                    borderLeft: '1px solid #f1f5f9', cursor: 'pointer', 
                                    fontSize: '13px', fontWeight: 800, color: '#64748b', 
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#6366f1'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
                            >
                                <span style={{ background: '#fff', padding: '6px', borderRadius: '8px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{btn.icon}</span>
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Legend ── */}
                    <div style={{ background: '#fff', borderBottom: '1.5px solid #f1f5f9', padding: '10px 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px', flexShrink: 0 }}>
                        {[
                            { color: '#e2e8f0', label: 'BLANK' },
                            { color: '#fb923c', label: 'RUNNING' },
                            { color: '#22c55e', label: 'PRINTED' },
                            { color: '#a78bfa', label: 'RESERVED' },
                        ].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: l.color, boxShadow: `0 2px 4px ${l.color}44` }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Stats strip ── */}
                    <div style={{ background: '#fff', borderBottom: '2.5px solid #edf2f7', padding: '16px 28px', display: 'flex', gap: '40px', alignItems: 'center', flexShrink: 0 }}>
                        {[
                            { label: 'Total',     value: stats.total,     color: '#4f46e5', bg: '#eef2ff' },
                            { label: 'Available', value: stats.available, color: '#10b981', bg: '#ecfdf5' },
                            { label: 'Running',   value: stats.occupied,  color: '#f59e0b', bg: '#fffbeb' },
                            { label: 'Printed',   value: stats.printed,   color: '#16a34a', bg: '#f0fdf4' },
                            { label: 'Reserved',  value: stats.reserved,  color: '#8b5cf6', bg: '#f5f3ff' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: s.bg, padding: '8px 16px', borderRadius: '16px', border: `1px solid ${s.color}22` }}>
                                <span style={{ fontSize: '28px', fontWeight: 950, color: s.color, lineHeight: 1 }}>{s.value}</span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                            </div>
                        ))}

                        {/* Refresh indicator */}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={fetchData}
                                style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >
                                <RefreshCw size={14} /> Refresh Plan
                            </button>
                        </div>
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
                                        padding: '18px 28px',
                                        fontSize: '14px', fontWeight: 900, color: '#334155',
                                        textTransform: 'uppercase', letterSpacing: '0.18em',
                                        background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', alignItems: 'center', gap: '16px'
                                    }}>
                                        <div style={{ width: '4px', height: '18px', background: '#6366f1', borderRadius: '4px' }} />
                                        {zoneName}
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
                                                {zoneTables.length} Tables
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: '20px' }}>
                                                {zoneTables.filter(t => t.status === 'AVAILABLE').length} Free
                                            </span>
                                            {zoneTables.filter(t => t.status === 'OCCUPIED').length > 0 && (
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', background: '#fffbeb', padding: '4px 12px', borderRadius: '20px' }}>
                                                    {zoneTables.filter(t => t.status === 'OCCUPIED').length} Running
                                                </span>
                                            )}
                                            {zoneTables.filter(t => t.status === 'PRINTED').length > 0 && (
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '4px 12px', borderRadius: '20px' }}>
                                                    {zoneTables.filter(t => t.status === 'PRINTED').length} Printed
                                                </span>
                                            )}
                                            {zoneTables.filter(t => t.status === 'RESERVED').length > 0 && (
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', background: '#f5f3ff', padding: '4px 12px', borderRadius: '20px' }}>
                                                    {zoneTables.filter(t => t.status === 'RESERVED').length} Reserved
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Horizontal scrollable table row */}
                                    <div style={{
                                        display: 'flex', gap: '20px', padding: '20px',
                                        overflowX: 'auto', background: '#fff',
                                        borderBottom: '1px solid #f8fafc',
                                        scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent',
                                        alignItems: 'flex-start',
                                        minHeight: '170px'
                                    }}>
                                        {zoneTables.map(table => (
                                            <TableCard
                                                key={table._id}
                                                table={table}
                                                onSelect={handleSelect}
                                                onReserve={t => setReserveTarget(t)}
                                                onCancelReserve={handleCancelReserve}
                                                onReset={handleResetTable}
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
