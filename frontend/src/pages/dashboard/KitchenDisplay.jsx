import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChefHat, Clock, Loader2, RefreshCw, ArrowLeft, Monitor,
    AlertCircle, CheckCircle2, Utensils, Timer, UserCheck, Users2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

/* ─── Status badge ─── */
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
    const urgent = diff > 600;
    const warn = diff > 300;

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

/* ─── Order Card ─── */
function OrderCard({ order, color, onReady, onDelete }) {
    const [loading, setLoading] = useState(''); // 'ready' | 'delete' | ''
    const modeBadge = {
        DINE_IN: { label: 'Dine In', bg: '#ede9fe', color: '#7c3aed' },
        TAKEAWAY: { label: 'Takeaway', bg: '#fef9c3', color: '#ca8a04' },
        SELF_SERVICE: { label: 'Counter', bg: '#dcfce7', color: '#16a34a' }
    };
    const mode = modeBadge[order.order_mode] || modeBadge.SELF_SERVICE;

    const handleReady = async () => {
        setLoading('ready');
        try {
            // 1. Mark the bill as READY in kitchen
            await fetch(`${API}/bills/${order._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ kitchen_status: 'READY' })
            });

            // 2. If this order is linked to a table, mark it as READY on the floor plan
            if (order.table_no) {
                const res = await fetch(`${API}/tables`, { headers: { Authorization: `Bearer ${getToken()}` } });
                const data = await res.json();
                if (data.success) {
                    const matched = data.data.find(t => String(t.table_number) === String(order.table_no));
                    if (matched) {
                        await fetch(`${API}/tables/${matched._id}/kot-status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                            body: JSON.stringify({ kot_status: 'READY' })
                        });
                    }
                }
            }

            // 3. Signal other pages via BroadcastChannel
            try {
                const ch = new BroadcastChannel('restoboard_kot');
                ch.postMessage({ type: 'ORDER_READY', billId: order._id, tableNo: order.table_no });
                ch.close();
            } catch(e) {}

            onReady(order._id);
        } catch(e) { console.error('Order ready error', e); }
        setLoading('');
    };

    const handleDelete = async () => {
        if (!window.confirm('Remove this order from the kitchen display?')) return;
        setLoading('delete');
        try {
            // 1. Move bill back to DRAFT and reset kitchen_status so it disappears from KDS
            await fetch(`${API}/bills/${order._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ status: 'DRAFT', kitchen_status: 'PENDING' })
            });

            // 2. Clear KOT status on the table so the badge disappears
            if (order.table_no) {
                const res = await fetch(`${API}/tables`, { headers: { Authorization: `Bearer ${getToken()}` } });
                const data = await res.json();
                if (data.success) {
                    const matched = data.data.find(t => String(t.table_number) === String(order.table_no));
                    if (matched) {
                        await fetch(`${API}/tables/${matched._id}/kot-status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                            body: JSON.stringify({ kot_status: 'NONE' })
                        });
                    }
                }
            }

            // 3. Signal other pages via BroadcastChannel
            try {
                const ch = new BroadcastChannel('restoboard_kot');
                ch.postMessage({ type: 'KOT_DELETED', billId: order._id, tableNo: order.table_no });
                ch.close();
            } catch(e) {}

            onDelete(order._id);
        } catch(e) { console.error('Delete order error', e); }
        setLoading('');
    };

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
                        {order.persons && ` · ${order.persons} pax`}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <TimeBadge createdAt={order.createdAt} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, background: mode.bg, color: mode.color, padding: '0.2rem 0.6rem', borderRadius: 12 }}>
                        {mode.label}
                    </span>
                </div>
            </div>

            {/* Staff Row */}
            {(order.captain_name || order.waiter_name) && (
                <div style={{ background: '#f8fafc', padding: '0.4rem 1rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    {order.captain_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: '0.65rem', fontWeight: 700 }}>
                            <UserCheck size={11} /> <span style={{ color: '#0f172a' }}>{order.captain_name.toUpperCase()}</span>
                        </div>
                    )}
                    {order.waiter_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: '0.65rem', fontWeight: 700 }}>
                            <Users2 size={11} /> <span style={{ color: '#0f172a' }}>{order.waiter_name.toUpperCase()}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Items */}
            <div style={{ padding: '0.75rem', flex: 1 }}>
                {order.items.map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.55rem 0.5rem', borderBottom: i < order.items.length - 1 ? '1px solid #f0ecff' : 'none'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: '#1a1333', fontSize: '0.9rem' }}>{item.name}</div>
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

            {/* Action Buttons */}
            <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
                <button
                    onClick={handleReady}
                    disabled={!!loading}
                    style={{
                        flex: 1, padding: '0.65rem 0.5rem', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        background: loading === 'ready' ? '#86efac' : 'linear-gradient(135deg,#16a34a,#22c55e)',
                        color: '#fff', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 5, transition: 'all 0.2s',
                        boxShadow: '0 3px 10px rgba(22,163,74,0.3)'
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <CheckCircle2 size={14} />
                    {loading === 'ready' ? 'UPDATING...' : '✅ ORDER READY'}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={!!loading}
                    style={{
                        padding: '0.65rem 0.75rem', borderRadius: 10, border: '1.5px solid #fee2e2', cursor: loading ? 'not-allowed' : 'pointer',
                        background: '#fff', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                    title="Remove from kitchen display"
                >
                    🗑 {loading === 'delete' ? '...' : 'DEL'}
                </button>
            </div>
        </div>
    );
}

/* ─── Kitchen Selector for the list view ─── */
export function KitchenDisplayList() {
    const navigate = useNavigate();
    const [kitchens, setKitchens] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/kitchens`, { headers: { Authorization: `Bearer ${getToken()}` } });
                const data = await res.json();
                if (data.success) setKitchens(data.data);
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
                    <button onClick={() => navigate('/dashboard/self-service/kitchen-management')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '0.6rem 1rem', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} /> BACK
                    </button>
                    <div>
                        <h1 style={{ color: '#fff', fontWeight: 900, margin: 0, fontSize: '1.8rem' }}>Kitchen Displays</h1>
                        <p style={{ color: '#888', margin: 0, fontWeight: 600, fontSize: '0.82rem' }}>Select a kitchen to open its display screen</p>
                    </div>
                </div>
                {kitchens.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#666' }}>
                        <ChefHat size={64} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>No kitchens created yet</p>
                        <button onClick={() => navigate('/dashboard/self-service/kitchen-management')}
                            style={{ marginTop: 16, background: '#6c5fc7', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.5rem', fontWeight: 800, cursor: 'pointer' }}>
                            Create Kitchen
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        {kitchens.map(k => (
                            <button key={k._id} onClick={() => navigate(`/dashboard/self-service/kitchen-display/${k._id}`)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: `2px solid ${k.color || '#6c5fc7'}44`, borderRadius: 16, padding: '1.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                <div style={{ width: 48, height: 48, background: k.color || '#6c5fc7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <ChefHat size={24} color="white" />
                                </div>
                                <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>{k.name}</div>
                                <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {k.categories?.length > 0 ? k.categories.join(', ') : 'All categories'}
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: k.color || '#6c5fc7', fontWeight: 800, fontSize: '0.75rem' }}>
                                    <Monitor size={14} /> OPEN DISPLAY
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Main KDS Screen ─── */
export default function KitchenDisplay() {
    const { kitchenId } = useParams();
    const navigate = useNavigate();

    const [kitchen, setKitchen] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState('');
    const [newOrderFlash, setNewOrderFlash] = useState(false); // flash banner when KOT arrives

    // Optimistic removal handlers
    const handleOrderReady = (billId) => {
        setOrders(prev => prev.filter(o => o._id !== billId));
    };
    const handleOrderDelete = (billId) => {
        setOrders(prev => prev.filter(o => o._id !== billId));
    };

    const fetchOrders = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch(`${API}/kitchens/${kitchenId}/orders`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
                setKitchen(data.kitchen);
                setLastUpdated(new Date());
                setError('');
            } else {
                setError(data.error || 'Failed to load orders');
            }
        } catch (err) {
            setError('Connection error - retrying...');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [kitchenId]);

    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 5 seconds
        const interval = setInterval(() => fetchOrders(), 5000);

        // === PRIMARY: BroadcastChannel (same-tab + cross-tab, same browser) ===
        let kotChannel = null;
        try {
            kotChannel = new BroadcastChannel('restoboard_kot');
            kotChannel.onmessage = (e) => {
                if (e.data?.type === 'KOT_FIRED') {
                    fetchOrders(false); // instant silent refresh
                    setNewOrderFlash(true);
                    setTimeout(() => setNewOrderFlash(false), 3000);
                }
            };
        } catch(e) {
            console.warn('BroadcastChannel not supported, using localStorage fallback');
        }

        // === FALLBACK: localStorage storage event (cross-tab only) ===
        const handleStorageEvent = (e) => {
            if (e.key === 'kot_fired') {
                fetchOrders(false);
                setNewOrderFlash(true);
                setTimeout(() => setNewOrderFlash(false), 3000);
            }
        };
        window.addEventListener('storage', handleStorageEvent);

        return () => {
            clearInterval(interval);
            if (kotChannel) kotChannel.close();
            window.removeEventListener('storage', handleStorageEvent);
        };
    }, [fetchOrders]);

    const kColor = kitchen?.color || '#6c5fc7';

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <Loader2 size={56} style={{ animation: 'spin 1s linear infinite', color: kColor }} />
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#888' }}>Connecting to Kitchen Display...</p>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
            {/* ─── NEW ORDER Flash Banner ─── */}
            {newOrderFlash && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
                    background: '#22c55e', color: '#fff',
                    padding: '0.75rem', textAlign: 'center',
                    fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.1em',
                    animation: 'pulse 0.5s ease-in-out infinite alternate',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}>
                    <ChefHat size={20} /> 🔔 NEW KOT RECEIVED — ORDER ADDED!
                </div>
            )}
            {/* ─── Top Bar ─── */}
            <div style={{ background: '#1a1a2e', borderBottom: `3px solid ${kColor}`, padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: newOrderFlash ? '48px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard/self-service/kitchen-display')}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', color: '#aaa', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <ArrowLeft size={13} /> KITCHENS
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, background: kColor, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChefHat size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>{kitchen?.name || 'Kitchen Display'}</div>
                            <div style={{ color: '#666', fontSize: '0.65rem', fontWeight: 700 }}>
                                {kitchen?.categories?.length > 0 ? kitchen.categories.join(' · ').toUpperCase() : 'ALL CATEGORIES'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Order count badge */}
                    <div style={{ background: kColor, color: '#fff', fontWeight: 900, fontSize: '1.4rem', minWidth: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
                        {orders.length}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.68rem', fontWeight: 700 }}>
                        {orders.length === 1 ? 'ACTIVE ORDER' : 'ACTIVE ORDERS'}
                    </div>

                    {/* Last updated */}
                    {lastUpdated && (
                        <div style={{ color: '#555', fontSize: '0.65rem', fontWeight: 700 }}>
                            <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                            {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}

                    {/* Refresh */}
                    <button onClick={() => fetchOrders(true)} disabled={refreshing}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '0.5rem', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </div>

            {/* ─── Error Bar ─── */}
            {error && (
                <div style={{ background: '#450a0a', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: '0.8rem', fontWeight: 700 }}>
                    <AlertCircle size={15} /> {error}
                </div>
            )}

            {/* ─── Orders Grid ─── */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
                {orders.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#444', textAlign: 'center' }}>
                        <CheckCircle2 size={80} style={{ color: '#22c55e22', marginBottom: 20 }} />
                        <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.5rem', marginBottom: 8 }}>All Clear!</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>No pending orders at this kitchen</div>
                        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#333', fontWeight: 700 }}>Auto-refreshing every 10 seconds...</div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(auto-fill, minmax(${orders.length <= 2 ? '360px' : orders.length <= 4 ? '280px' : '240px'}, 1fr))`,
                        gap: '1rem',
                        alignItems: 'start'
                    }}>
                        {orders.map(order => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                color={kColor}
                                onReady={handleOrderReady}
                                onDelete={handleOrderDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Bottom ticker ─── */}
            <div style={{ background: '#111', borderTop: '1px solid #222', padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#333', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Utensils size={11} /> RESTOBOARD KITCHEN DISPLAY SYSTEM
                </div>
                <div style={{ color: '#333', fontSize: '0.65rem', fontWeight: 700 }}>
                    Auto-refresh: 5s · Instant KOT sync · {new Date().toLocaleDateString()}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { from { opacity: 1; } to { opacity: 0.7; } }
            `}</style>
        </div>
    );
}
