import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Printer, Clock, Loader2, RefreshCw, ArrowLeft, Monitor,
    AlertCircle, CheckCircle2, Utensils, Timer, UserCheck, Users2, Wifi
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

/* ─── Status badge (Elapsed Time) ─── */
function TimeBadge({ createdAt }) {
    const [elapsed, setElapsed] = useState('');
    useEffect(() => {
        const tick = () => {
            const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
            if (diff < 60) setElapsed(`${diff}s`);
            else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`);
            else setElapsed(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [createdAt]);

    const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
    const urgent = diff > 600; // > 10 min = urgent
    const warn = diff > 300;  // > 5 min = warning

    return (
        <span style={{
            padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800,
            background: urgent ? '#fee2e2' : warn ? '#fef3c7' : '#d1fae5',
            color: urgent ? '#ef4444' : warn ? '#d97706' : '#059669',
            display: 'flex', alignItems: 'center', gap: 4
        }}>
            <Timer size={11} /> {elapsed}
        </span>
    );
}

/* ─── Printer Order Card ─── */
function OrderCard({ order, color, onPrint }) {
    const modeBadge = {
        DINE_IN: { label: 'Dine In', bg: '#ede9fe', color: '#7c3aed' },
        TAKEAWAY: { label: 'Takeaway', bg: '#fef9c3', color: '#ca8a04' },
        SELF_SERVICE: { label: 'Counter', bg: '#dcfce7', color: '#16a34a' }
    };
    const mode = modeBadge[order.order_mode] || modeBadge.SELF_SERVICE;

    return (
        <div style={{
            background: '#fff', borderRadius: 16, border: `2px solid ${color}22`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Card Header */}
            <div style={{ background: color, padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.05em' }}>
                        {order.table_no ? `TABLE ${order.table_no}` : order.order_mode === 'TAKEAWAY' ? 'TAKEAWAY' : 'COUNTER'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 700 }}>
                        Bill #{order.bill_number}
                        {order.customer_name && ` · ${order.customer_name}`}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <button onClick={() => onPrint(order)} style={{ background: '#fff', color: color, border: 'none', borderRadius: 8, padding: '4px 8px', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Printer size={12} /> PRINT
                    </button>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, background: mode.bg, color: mode.color, padding: '0.2rem 0.6rem', borderRadius: 12 }}>
                        {mode.label}
                    </span>
                </div>
            </div>

            {/* Info Bar */}
            <div style={{ background: '#f8fafc', padding: '0.4rem 1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {(order.captain_name || order.waiter_name) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: '0.65rem', fontWeight: 700 }}>
                            <UserCheck size={11} /> <span style={{ color: '#0f172a' }}>{(order.captain_name || order.waiter_name).toUpperCase()}</span>
                        </div>
                    )}
                </div>
                <TimeBadge createdAt={order.createdAt} />
            </div>

            {/* Items */}
            <div style={{ padding: '0.75rem', flex: 1 }}>
                {order.items.map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.55rem 0.5rem', borderBottom: i < order.items.length - 1 ? '1px solid #f0ecff' : 'none'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: '#1a1333', fontSize: '0.9rem' }}>{item.product_name || item.name}</div>
                            {item.category && (
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9b86aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.category}</div>
                            )}
                        </div>
                        <div style={{
                            background: color, color: '#fff', fontWeight: 900, fontSize: '1.1rem',
                            minWidth: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {item.quantity}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Printer Selector View ─── */
export function PrinterDisplayList() {
    const navigate = useNavigate();
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/printers`, { headers: { Authorization: `Bearer ${getToken()}` } });
                const data = await res.json();
                if (data.success) setPrinters(data.data);
            } catch { }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <button onClick={() => navigate('/dashboard/self-service/printer-management')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '0.6rem 1rem', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} /> BACK
                    </button>
                    <div>
                        <h1 style={{ color: '#fff', fontWeight: 900, margin: 0, fontSize: '1.8rem' }}>Printer Feeds</h1>
                        <p style={{ color: '#888', margin: 0, fontWeight: 600, fontSize: '0.82rem' }}>Select a routing gateway station to monitor and print KOTs</p>
                    </div>
                </div>
                {printers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#666' }}>
                        <Printer size={64} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>No printers configured yet</p>
                        <button onClick={() => navigate('/dashboard/self-service/printer-management')}
                            style={{ marginTop: 16, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.5rem', fontWeight: 800, cursor: 'pointer' }}>
                            Configure Printers
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        {printers.map(p => (
                            <button key={p._id} onClick={() => navigate(`/dashboard/self-service/printer-display/${p._id}`)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: `2px solid ${p.color || '#3b82f6'}44`, borderRadius: 16, padding: '1.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                <div style={{ width: 48, height: 48, background: p.color || '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <Printer size={24} color="white" />
                                </div>
                                <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>{p.name}</div>
                                <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {p.ip_address || 'Local Printer'}
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: p.color || '#3b82f6', fontWeight: 800, fontSize: '0.75rem' }}>
                                    <Monitor size={14} /> OPEN LIVE FEED
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Main Printer Feed Screen ─── */
export default function PrinterDisplay() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [printer, setPrinter] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState('');
    const [autoPrint, setAutoPrint] = useState(false);

    const prevCount = useRef(0);

    const fetchOrders = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch(`${API}/printers/${id}/orders`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
                setPrinter(data.printer);
                setLastUpdated(new Date());
                setError('');
                
                // Detection logic for auto-print
                if (autoPrint && data.data.length > prevCount.current) {
                    // In a real browser implementation, this might trigger a window.print() 
                    // or send a silent print command to a local listener map.
                    console.log("Auto-printing new ticket...");
                }
                prevCount.current = data.data.length;
            } else {
                setError(data.error || 'Failed to load orders');
            }
        } catch (err) {
            setError('Connection error - retrying...');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, autoPrint]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(), 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const pColor = printer?.color || '#3b82f6';

    const handlePrint = (order) => {
        // Logic for specific order printing
        window.print();
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <Loader2 size={56} style={{ animation: 'spin 1s linear infinite', color: pColor }} />
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#888' }}>Establishing Printer Gateway...</p>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
            {/* ─── Top Bar ─── */}
            <div style={{ background: '#1a1a2e', borderBottom: `3px solid ${pColor}`, padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard/self-service/printer-display')}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', color: '#aaa', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <ArrowLeft size={13} /> STATIONS
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, background: pColor, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Printer size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>{printer?.name || 'Printer Feed'}</div>
                            <div style={{ color: '#666', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Wifi size={10} /> {printer?.ip_address || 'LOCAL IP BOUND'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', background: autoPrint ? `${pColor}22` : 'transparent', padding: '6px 12px', borderRadius: 8, border: `1px solid ${autoPrint ? pColor : '#333'}` }}>
                        <input type="checkbox" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} style={{ cursor: 'pointer' }} />
                        AUTO-PRINT NEW TICKETS
                    </label>

                    <div style={{ background: pColor, color: '#fff', fontWeight: 900, fontSize: '1.4rem', minWidth: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
                        {orders.length}
                    </div>

                    <div style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 800 }}>
                         {lastUpdated?.toLocaleTimeString()}
                    </div>

                    <button onClick={() => fetchOrders(true)} disabled={refreshing}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '0.5rem', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </div>

            {/* ─── Orders Grid ─── */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
                {orders.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#444', textAlign: 'center' }}>
                        <CheckCircle2 size={80} style={{ color: '#22c55e22', marginBottom: 20 }} />
                        <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.5rem', marginBottom: 8 }}>Queue Empty</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>No pending tickets for {printer?.name}</div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`,
                        gap: '1.25rem',
                        alignItems: 'start'
                    }}>
                        {orders.map(order => (
                            <OrderCard key={order._id} order={order} color={pColor} onPrint={handlePrint} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media print {
                    aside, header, .dashboard-main > div:first-child, button, .mobile-overlay {
                        display: none !important;
                    }
                    .dashboard-layout, .dashboard-main, body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
