import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BillingPage.css';
import PaymentFlow from './PaymentFlow';
import BillPreviewModal from './BillPreviewModal';
import { CardSkeleton } from '../../components/Skeleton';
import {
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    ChevronDown,
    Search,
    RotateCcw,
    ArrowLeft,
    User,
    Table,
    Users,
    Save,
    Printer,
    Menu as MenuIcon,
    LayoutGrid,
    Columns,
    LogOut,
    Bell,
    Settings,
    Pause,
    History,
    Timer,
    Gift,
    MoreHorizontal,
    ArrowRight,
    CheckSquare,
    UserCheck,
    Package,
    Truck,
    Users2,
    Smartphone,
    Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BillingPage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [billItems, setBillItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentBillId, setCurrentBillId] = useState(null);
    const [billNumber, setBillNumber] = useState('Wait...');
    const [counters, setCounters] = useState([]);
    const [selectedCounter, setSelectedCounter] = useState('');
    const [orderMode, setOrderMode] = useState('DINE_IN');
    const [tableNo, setTableNo] = useState("");
    const [persons, setPersons] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showBillPreview, setShowBillPreview] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [lastPaymentModes, setLastPaymentModes] = useState([]);
    const [lastBillId, setLastBillId] = useState(null);
    const [restaurantName, setRestaurantName] = useState("RestoBoard");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showSidebar, setShowSidebar] = useState(true);
    const [checkoutActive, setCheckoutActive] = useState(false);
    const [checkoutType, setCheckoutType] = useState('');
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [stepProceeded, setStepProceeded] = useState(false);
    const [extraCharges, setExtraCharges] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [gstPercentage, setGstPercentage] = useState(5);
    const [promoCode, setPromoCode] = useState('');

    // -- NEW POS ENHANCEMENT STATES --
    const [showTimer, setShowTimer] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);

    const [billSearchQuery, setBillSearchQuery] = useState("");
    const [dailySearchQuery, setDailySearchQuery] = useState("");
    const [kotSearchQuery, setKotSearchQuery] = useState("");

    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [containerCharge, setContainerCharge] = useState(0);
    const [discountType, setDiscountType] = useState('FIXED'); // 'PERCENT' or 'FIXED'

    const [isHoldPanelOpen, setIsHoldPanelOpen] = useState(false);
    const [heldBills, setHeldBills] = useState(() => JSON.parse(localStorage.getItem('pos_held_bills') || '[]'));

    const [captains, setCaptains] = useState([]);
    const [selectedCaptain, setSelectedCaptain] = useState("");
    const [tables, setTables] = useState([]);
    const [selectedTableId, setSelectedTableId] = useState("");

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");

    // -- LATEST CALCULATION HOOK --
    const billCalculations = useMemo(() => {
        const sub = billItems.reduce((acc, item) => acc + (item.is_complementary ? 0 : item.total_price), 0);
        let discAmt = 0;
        if (discountType === 'PERCENT') {
            discAmt = sub * (parseFloat(discount) / 100);
        } else {
            discAmt = parseFloat(discount);
        }

        const taxable = Math.max(0, sub - discAmt);
        const gstAmt = taxable * (parseFloat(gstPercentage) / 100);
        const delivery = parseFloat(deliveryCharge) || 0;
        const container = parseFloat(containerCharge) || 0;

        const rawTotal = taxable + gstAmt + delivery + container;
        const roundedTotal = Math.round(rawTotal);
        const rOff = roundedTotal - rawTotal;

        return {
            subTotal: sub,
            discountAmount: discAmt,
            taxAmount: gstAmt,
            deliveryCharge: delivery,
            containerCharge: container,
            roundOff: rOff,
            grandTotal: roundedTotal
        };
    }, [billItems, discount, gstPercentage, discountType, deliveryCharge, containerCharge]);

    const { subTotal, taxAmount, discountAmount, roundOff, grandTotal } = billCalculations;

    const [showLoyalty, setShowLoyalty] = useState(false);
    const [billingLayout, setBillingLayout] = useState(() => localStorage.getItem('cachedBillingLayout') || 'SIDEBAR');

    // Get base API URL for images
    const getBaseUrl = () => {
        const fullUrl = import.meta.env.VITE_API_URL;
        return fullUrl.replace('/api', '');
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Close sidebar by default on mobile
        if (window.innerWidth <= 768) {
            setShowSidebar(false);
        }

        return () => clearInterval(timer);
    }, []);

    const location = useLocation();

    // Load initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;
                const { token } = JSON.parse(savedUser);
                const headers = { 'Authorization': `Bearer ${token}` };

                // 1. Fetch Categories
                const catRes = await fetch(`${import.meta.env.VITE_API_URL}/categories`, { headers });
                const catData = await catRes.json();
                if (catData.success) setCategories(catData.data);

                // 2. Fetch Products
                const prodRes = await fetch(`${import.meta.env.VITE_API_URL}/products`, { headers });
                const prodData = await prodRes.json();
                if (prodData.success) setProducts(prodData.data);

                // 3. Fetch Counters
                const countRes = await fetch(`${import.meta.env.VITE_API_URL}/counters`, { headers });
                const countData = await countRes.json();
                if (countData.success) {
                    setCounters(countData.data);
                    if (countData.data.length > 0) setSelectedCounter(countData.data[0]._id);
                }

                // 4. Fetch Restaurant Info
                const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, { headers });
                const profileData = await profileRes.json();

                if (profileData.success) {
                    setRestaurantName(profileData.data.restaurant.name);
                    const layout = profileData.data.restaurant.billing_layout || 'SIDEBAR';
                    setBillingLayout(layout);
                    localStorage.setItem('cachedBillingLayout', layout);
                }

                // 5. Fetch Tables
                const tableRes = await fetch(`${import.meta.env.VITE_API_URL}/tables`, { headers });
                const tableData = await tableRes.json();
                if (tableData.success) setTables(tableData.data);

                // 6. Fetch Captains
                const captainRes = await fetch(`${import.meta.env.VITE_API_URL}/captains`, { headers });
                const captainData = await captainRes.json();
                if (captainData.success) setCaptains(captainData.data);

            } catch (error) {
                console.error("Billing init error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [location.key]);

    // Create New Bill
    const createNewBill = async () => {
        if (!selectedCounter) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    counter_id: selectedCounter,
                    type: orderMode
                })
            });
            const data = await res.json();
            if (data.success) {
                setCurrentBillId(data.data._id);
                setBillNumber(data.data.bill_number);
                setBillItems([]);
            }
        } catch (error) {
            console.error("Create bill error", error);
        }
    };

    const createManualNewBill = async () => {
        if (!window.confirm("Start a manual new bill? This will clear current items.")) return;
        setBillItems([]);
        setCurrentBillId(null);
        setBillNumber('Generating...');
        await createNewBill();
    };

    useEffect(() => {
        if (selectedCounter && !currentBillId) {
            createNewBill();
        }
    }, [selectedCounter]);

    const updateItemQuantity = async (productId, delta) => {
        const item = billItems.find(i => i.product_id === productId);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty < 1) {
            removeFromBill(billItems.indexOf(item));
            return;
        }

        const newItems = billItems.map(i =>
            i.product_id === productId
                ? { ...i, quantity: newQty, total_price: newQty * i.unit_price }
                : i
        );
        setBillItems(newItems);

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: productId, quantity: delta })
            });
        } catch (error) {
            console.error("Update quantity failed", error);
        }
    };

    const addToBill = async (product) => {
        if (!currentBillId) return alert("No active bill. Please wait or refresh.");

        const existingItem = billItems.find(item => item.product_id === product._id);
        if (existingItem) {
            updateItemQuantity(product._id, 1);
            return;
        }

        const newItems = [...billItems, {
            product_id: product._id,
            name: product.name,
            quantity: 1,
            unit_price: product.selling_price,
            total_price: product.selling_price
        }];
        setBillItems(newItems);

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: product._id, quantity: 1 })
            });
        } catch (error) {
            console.error("Add item failed", error);
        }
    };

    const removeFromBill = async (index) => {
        const item = billItems[index];
        const newItems = billItems.filter((_, i) => i !== index);
        setBillItems(newItems);

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}/items/${item.product_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Remove item failed", error);
        }
    };

    const toggleComplementary = async (index) => {
        const newItems = [...billItems];
        newItems[index].is_complementary = !newItems[index].is_complementary;
        setBillItems(newItems);
        // Backend update could happen here if model supports it
    };

    const holdCurrentBill = () => {
        if (billItems.length === 0) return alert("Nothing to hold!");

        const billToHold = {
            id: Date.now(),
            billItems: [...billItems],
            orderMode,
            tableNo,
            persons,
            selectedTableId,
            selectedCaptain,
            customer: { name: customerName, phone: customerPhone, address: customerAddress },
            billNumber,
            timestamp: new Date().toISOString()
        };

        const newHeld = [billToHold, ...heldBills];
        setHeldBills(newHeld);
        localStorage.setItem('pos_held_bills', JSON.stringify(newHeld));

        // Clear current
        setBillItems([]);
        setTableNo("");
        setPersons("");
        setSelectedTableId("");
        setSelectedCaptain("");
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        alert("Bill placed on hold.");
    };

    const restoreHeldBill = (heldId) => {
        const target = heldBills.find(h => h.id === heldId);
        if (!target) return;

        setBillItems(target.billItems);
        setOrderMode(target.orderMode);
        setTableNo(target.tableNo || "");
        setPersons(target.persons || "");
        setSelectedTableId(target.selectedTableId || "");
        setSelectedCaptain(target.selectedCaptain || "");
        setCustomerName(target.customer?.name || "");
        setCustomerPhone(target.customer?.phone || "");
        setCustomerAddress(target.customer?.address || "");

        // Remove from hold list
        const newHeld = heldBills.filter(h => h.id !== heldId);
        setHeldBills(newHeld);
        localStorage.setItem('pos_held_bills', JSON.stringify(newHeld));
        setIsHoldPanelOpen(false);
    };

    const deleteHeldBill = (heldId) => {
        const newHeld = heldBills.filter(h => h.id !== heldId);
        setHeldBills(newHeld);
        localStorage.setItem('pos_held_bills', JSON.stringify(newHeld));
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "ALL" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handlePayment = (type = '') => {
        if (!currentBillId) return;
        if (subTotal === 0) return alert("Bill is empty!");
        setCheckoutType(type);
        setCheckoutActive(true);
    };

    const handlePaymentSubmit = async (paymentModes, tipAmount = 0) => {
        setPaymentLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_modes: paymentModes,
                    sub_total: subTotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    delivery_charge: deliveryCharge,
                    container_charge: containerCharge,
                    round_off: roundOff,
                    tip_amount: tipAmount,
                    grand_total: grandTotal + tipAmount,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    table_no: tableNo,
                    persons: persons,
                    waiter_name: selectedCaptain
                })
            });
            const data = await res.json();
            if (data.success) {
                setLastBillId(currentBillId);
                setLastPaymentModes(paymentModes);
                setCheckoutActive(false);
                setShowBillPreview(true);
                setBillItems([]);
                createNewBill(); // Start fresh
            } else {
                alert(data.message || "Payment failed");
            }
        } catch (error) {
            console.error("Payment submission error", error);
            alert("Could not process payment. Check your connection.");
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleOrderAction = async (type) => {
        if (!currentBillId) return;
        if (billItems.length === 0) return alert("Add items first!");

        setPaymentLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: billItems,
                    sub_total: subTotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    delivery_charge: deliveryCharge,
                    container_charge: containerCharge,
                    round_off: roundOff,
                    grand_total: grandTotal,
                    table_no: tableNo,
                    persons: persons,
                    order_mode: orderMode,
                    customer_name: customerName,
                    customer_phone: customerPhone
                })
            });
            const data = await res.json();
            if (data.success) {
                if (type === 'KOT') alert("KOT (Kitchen Order Ticket) Printed Successfully!");
                else if (type === 'SAVE' || type === 'PRINT') {
                    setLastBillId(currentBillId);
                    setLastPaymentModes([]);
                    setShowBillPreview(true);
                }
            }
        } catch (error) {
            console.error("Order action error", error);
        } finally {
            setPaymentLoading(false);
        }
    };

    const resetForm = () => {
        setTableNo("");
        setPersons("");
        setSelectedTableId("");
        setSelectedCaptain("");
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        setDiscount(0);
        setDeliveryCharge(0);
        setContainerCharge(0);
        setBillItems([]);
        setStepProceeded(false);
        setPromoCode('');
        createNewBill();
    };

    const applyPromoCode = () => {
        if (!promoCode) return;
        alert(`Promo Code "${promoCode}" applied successfully! 5% extra discount added (Simulated).`);
        setDiscount(prev => parseFloat(prev) + 5);
        setPromoCode('');
    };

    // Toggle billing layout instantly from the header
    const toggleLayout = async () => {
        const newLayout = billingLayout === 'SIDEBAR' ? 'TOP_HEADER' : 'SIDEBAR';
        setBillingLayout(newLayout);
        localStorage.setItem('cachedBillingLayout', newLayout);

        // If switching to TOP_HEADER, close sidebar
        if (newLayout === 'TOP_HEADER') {
            setShowSidebar(false);
        } else {
            setShowSidebar(true);
        }

        // Save to backend silently
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/layout`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ billingLayout: newLayout })
            });
        } catch (err) {
            console.error('Failed to save layout preference', err);
        }
    };

    return (
        <div className={`pos-layout ${showSidebar ? 'sidebar-open' : 'sidebar-closed'} layout-${billingLayout.toLowerCase().replace('_', '-')}`}>
            {/* Top Navigation Bar */}
            <div className="pos-nav">
                <div className="nav-left">
                    <div className="pos-logo-container">
                        <div className="pos-logo-circle" style={{ overflow: 'hidden', padding: 0 }}>
                            <img src="/yugam-logo.png" alt="Yugam Software" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                    <div className="pos-brand-info">
                        <h2>Yugam Software</h2>
                    </div>
                </div>

                <div className="nav-right">
                    {showTimer && (
                        <div className="pos-timer-enhanced">
                            <Timer size={16} />
                            <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            <span className="timer-sep">|</span>
                            <span className="timer-clock">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                    )}

                    <div className="nav-actions-group">
                        <button className="nav-action-btn" onClick={() => navigate('/dashboard/orders')} title="Recent Orders">
                            ORDER
                        </button>
                        <button className="nav-action-btn" onClick={() => setIsHoldPanelOpen(true)} title="Held Transactions">
                            HOLD
                        </button>
                        <button className="nav-action-btn" title="System Alerts">
                            NOTIFICATION
                        </button>
                        <button className="nav-action-btn" onClick={logout} title="Sign Out">
                            LOGOUT
                        </button>
                    </div>

                    <div className="settings-btn-wrapper">
                        <button className="nav-action-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)} title="Settings">
                            <Settings size={20} />
                            <span className="btn-text">Settings</span>
                        </button>

                        {isSettingsOpen && (
                            <div className="settings-dropdown">
                                <div className="settings-option">
                                    <span>Show Timer</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={showTimer} onChange={() => setShowTimer(!showTimer)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="settings-option">
                                    <span>Layout Mode</span>
                                    <select value={billingLayout} onChange={(e) => {
                                        setBillingLayout(e.target.value);
                                        localStorage.setItem('cachedBillingLayout', e.target.value);
                                        setShowSidebar(e.target.value === 'SIDEBAR');
                                    }}>
                                        <option value="SIDEBAR">Sidebar</option>
                                        <option value="TOP_HEADER">Top Layout</option>
                                    </select>
                                </div>

                                <div className="settings-option">
                                    <span>Loyalty System</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={loyaltyEnabled} onChange={() => setLoyaltyEnabled(!loyaltyEnabled)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="settings-divider"></div>
                                <div className="settings-option">
                                    <span>Swiggy Sync</span>
                                    <span className="badge-beta">PRO</span>
                                </div>
                                <div className="settings-option">
                                    <span>Zomato Sync</span>
                                    <span className="badge-beta">PRO</span>
                                </div>
                                <div className="settings-divider"></div>
                                <button className="set-logout-btn" onClick={logout}>
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Search & Mode Bar */}
            <div className="pos-search-section">
                <div className="search-flex-container">
                    {/* 1. Product Search */}
                    <div className="search-input-wrapper main-search">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by product name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* 2. Bill Number Search */}
                    <div className="search-input-wrapper secondary-search">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Bill No."
                            value={billSearchQuery}
                            onChange={(e) => setBillSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* 3. KOT Search */}
                    <div className="search-input-wrapper secondary-search">
                        <History size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="KOT Search"
                            value={kotSearchQuery}
                            onChange={(e) => setKotSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* 4. Order Mode Selector */}
                    <div className="mode-selector-header">
                        {[
                            { id: 'DINE_IN', label: 'Dine In', icon: <Users2 size={16} /> },
                            { id: 'PARCEL', label: 'Parcel', icon: <Package size={16} /> },
                            { id: 'DELIVERY', label: 'Delivery', icon: <Truck size={16} /> },
                            { id: 'PARTY', label: 'Party', icon: <Gift size={16} /> }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                className={`mode-pill ${orderMode === mode.id ? 'active' : ''}`}
                                onClick={() => setOrderMode(mode.id)}
                            >
                                {mode.icon}
                                <span>{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* Main POS Container */}
            {
                checkoutActive ? (
                    <div className="pos-checkout-overlay">
                        <PaymentFlow
                            grandTotal={grandTotal}
                            onPaymentSubmit={handlePaymentSubmit}
                            onCancel={() => setCheckoutActive(false)}
                            loading={paymentLoading}
                            initialType={checkoutType}
                        />
                    </div>
                ) : (
                    <div className={`pos-main ${showSidebar ? '' : 'full-width'}`}>
                        {/* Mobile Sidebar Overlay */}
                        {showSidebar && window.innerWidth <= 768 && (
                            <div className="mobile-overlay" onClick={() => setShowSidebar(false)} style={{ zIndex: 1999 }}></div>
                        )}

                        {/* 1. Category Sidebar (Left) - Only if Layout 1 */}
                        {billingLayout === 'SIDEBAR' && (
                            <div className={`category-sidebar ${showSidebar ? 'open' : 'closed'}`}>
                                <div className="sidebar-header">
                                    <span>CATEGORY</span>
                                    <button onClick={() => setShowSidebar(false)} className="icon-btn-sm">
                                        <ArrowLeft size={16} />
                                    </button>
                                </div>
                                <div className="category-list">
                                    <button
                                        className={`category-item ${activeCategory === "ALL" ? 'active' : ''}`}
                                        onClick={() => setActiveCategory("ALL")}
                                    >
                                        All Items <ChevronDown size={14} />
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat._id}
                                            className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                                            onClick={() => setActiveCategory(cat.name)}
                                        >
                                            {cat.name} <ChevronDown size={14} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Product Area (Middle) */}
                        <div className="product-area">
                            {checkoutActive ? (
                                <PaymentFlow
                                    grandTotal={grandTotal}
                                    onPaymentSubmit={handlePaymentSubmit}
                                    onCancel={() => { setCheckoutActive(false); setCheckoutType(''); }}
                                    loading={paymentLoading}
                                    initialType={checkoutType}
                                />
                            ) : (
                                <>
                                    {/* Top Category Header - Only if Layout 2 */}
                                    {billingLayout === 'TOP_HEADER' && (
                                        <div className="top-category-header">
                                            <button
                                                className={`top-cat-btn ${activeCategory === "ALL" ? 'active' : ''}`}
                                                onClick={() => setActiveCategory("ALL")}
                                            >
                                                ALL ITEMS
                                            </button>
                                            {categories.map(cat => (
                                                <button
                                                    key={cat._id}
                                                    className={`top-cat-btn ${activeCategory === cat.name ? 'active' : ''}`}
                                                    onClick={() => setActiveCategory(cat.name)}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {billingLayout === 'SIDEBAR' && !showSidebar && (
                                        <button className="toggle-sidebar-btn" onClick={() => setShowSidebar(true)}>
                                            <MenuIcon size={18} /> <span>Show Categories</span>
                                        </button>
                                    )}

                                    <div className="product-scroll-grid">
                                        {loading ? (
                                            <CardSkeleton count={12} />
                                        ) : filteredProducts.length === 0 ? (
                                            <div className="flex-center h-full text-gray-400 w-full py-20">
                                                No products found in this category.
                                            </div>
                                        ) : filteredProducts.map(product => (
                                            <div
                                                key={product._id}
                                                className={`pos-product-card ${priceColorEnabled ? 'price-colored' : ''}`}
                                                onClick={() => addToBill(product)}
                                            >
                                                <div className="p-image-container">
                                                    {product.image ? (
                                                        <img src={`${getBaseUrl()}${product.image}`} alt={product.name} className="p-card-img" />
                                                    ) : (
                                                        <div className="p-img-placeholder">
                                                            <ShoppingBag size={32} color="#cbd5e0" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-details">
                                                    <div className="p-name">{product.name}</div>
                                                    <div className="p-price">₹{product.selling_price}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>


                                </>
                            )}
                        </div>

                        {/* 3. Bill Panel (Right) */}
                        <div className="bill-sidebar">
                            {/* Meta Icons row from reference image */}
                            <div className="sidebar-meta-icons">
                                <button className={`meta-icon-btn ${orderMode === 'DINE_IN' ? 'active' : ''}`}>
                                    <div className="icon-bg"><Table size={18} /></div>
                                    <span>TABLE</span>
                                </button>
                                <button className="meta-icon-btn">
                                    <div className="icon-bg"><Users size={18} /></div>
                                    <span>PAX</span>
                                </button>
                                <button className="meta-icon-btn">
                                    <div className="icon-bg"><User size={18} /></div>
                                    <span>CAPTAIN</span>
                                </button>
                                <button className="meta-icon-btn">
                                    <div className="icon-bg"><History size={18} /></div>
                                    <span>KOT</span>
                                </button>
                                <button className="meta-icon-btn">
                                    <div className="icon-bg"><RotateCcw size={18} /></div>
                                    <span>BILL</span>
                                </button>
                            </div>

                            {/* Order Meta */}
                            <div className="order-meta-enhanced">
                                {orderMode === 'DINE_IN' && (
                                    <div className="dine-in-fields">
                                        <div className="meta-input-field">
                                            <label><Table size={14} /> Table</label>
                                            <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)}>
                                                <option value="">Select Table</option>
                                                {tables.map(t => <option key={t._id} value={t._id}>{t.table_number}</option>)}
                                            </select>
                                        </div>
                                        <div className="meta-input-field">
                                            <label><UserCheck size={14} /> Captain</label>
                                            <select value={selectedCaptain} onChange={(e) => setSelectedCaptain(e.target.value)}>
                                                <option value="">Select Capt</option>
                                                {captains.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="meta-input-field">
                                            <label><Users size={14} /> Pax</label>
                                            <input type="number" placeholder="0" value={persons} onChange={(e) => setPersons(e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                <div className="customer-info-section">
                                    <div className="cust-input-row">
                                        <User size={14} className="icon" />
                                        <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                        <Smartphone size={14} className="icon" />
                                        <input type="text" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Item List */}
                            <div className="order-items-header">
                                <span className="col-name">ITEM</span>
                                <span className="col-qty">QTY</span>
                                <span className="col-rate">RATE</span>
                                <span className="col-amt">AMT</span>
                            </div>

                            {/* Scrollable area: items list + bill footer together */}
                            <div className="bill-scroll-area">
                                <div className="order-items-list">
                                    {billItems.length === 0 ? (
                                        <div className="empty-cart">
                                            <ShoppingBag size={48} />
                                            <p>Order is empty</p>
                                        </div>
                                    ) : billItems.map((item, idx) => (
                                        <div key={idx} className={`order-item-row ${item.is_complementary ? 'complementary' : ''}`}>
                                            <div className="item-name-cell">
                                                <button className="remove-btn" onClick={() => removeFromBill(idx)}><Trash2 size={14} /></button>
                                                <div className="item-name-wrap">
                                                    <span>{item.name}</span>
                                                    <button
                                                        className={`comp-toggle ${item.is_complementary ? 'active' : ''}`}
                                                        onClick={() => toggleComplementary(idx)}
                                                        title="Complementary"
                                                    >
                                                        <Gift size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="item-qty-cell">
                                                <button onClick={() => updateItemQuantity(item.product_id, -1)}><Minus size={12} /></button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateItemQuantity(item.product_id, 1)}><Plus size={12} /></button>
                                            </div>
                                            <div className="item-rate">{item.is_complementary ? 0 : item.unit_price}</div>
                                            <div className="item-amt">{item.is_complementary ? 0 : item.total_price}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bill Footer */}
                                <div className="order-footer">
                                    <div className="summary-section">
                                        <div className="sum-row">
                                            <span>Subtotal ({billItems.length} items)</span>
                                            <span className="mono">₹{subTotal.toFixed(2)}</span>
                                        </div>

                                        {/* Detailed Summary Sections */}
                                        <div className="summary-details-grid">
                                            <div className="sum-detail-row">
                                                <label>Discount</label>
                                                <div className="input-with-toggle">
                                                    <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                                                    <button onClick={() => setDiscountType(discountType === 'PERCENT' ? 'FIXED' : 'PERCENT')}>
                                                        {discountType === 'PERCENT' ? '%' : '₹'}
                                                    </button>
                                                </div>
                                                <span className="calc-val">- ₹{billCalculations.discountAmount.toFixed(2)}</span>
                                            </div>

                                            {(orderMode === 'DELIVERY' || showMoreOptions) && (
                                                <div className="sum-detail-row">
                                                    <label>Deliv. Chg</label>
                                                    <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} />
                                                    <span className="calc-val">+ ₹{billCalculations.deliveryCharge.toFixed(2)}</span>
                                                </div>
                                            )}

                                            {(orderMode === 'PARCEL' || showMoreOptions) && (
                                                <div className="sum-detail-row">
                                                    <label>Pack. Chg</label>
                                                    <input type="number" value={containerCharge} onChange={(e) => setContainerCharge(e.target.value)} />
                                                    <span className="calc-val">+ ₹{billCalculations.containerCharge.toFixed(2)}</span>
                                                </div>
                                            )}

                                            <div className="sum-detail-row">
                                                <label>Tax ({gstPercentage}%)</label>
                                                <div className="empty-input"></div>
                                                <span className="calc-val">+ ₹{taxAmount.toFixed(2)}</span>
                                            </div>

                                            {roundOff !== 0 && (
                                                <div className="sum-detail-row">
                                                    <label>Round Off</label>
                                                    <div className="empty-input"></div>
                                                    <span className="calc-val">{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {showLoyalty && (
                                            <div className="loyalty-promo-compact fade-in">
                                                <div className="loyalty-input">
                                                    <Gift size={14} />
                                                    <input type="text" placeholder="Loyalty / Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                                    <button onClick={applyPromoCode}>Apply</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="sum-total-enhanced">
                                            <div className="total-label">
                                                <span className="main-total">TOTAL PAYABLE</span>
                                                <span className="items-count">{billItems.length} Items</span>
                                            </div>
                                            <span className="total-value">₹{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Top Control Buttons */}
                                    <div className="billing-actions-panel">
                                        <div className="panel-controls">
                                            <button className={`control-btn ${showLoyalty ? 'active' : ''}`} onClick={() => setShowLoyalty(!showLoyalty)}>
                                                <Gift size={15} /> Loyalty
                                            </button>
                                            <button className={`control-btn ${showMoreOptions ? 'active' : ''}`} onClick={() => setShowMoreOptions(!showMoreOptions)}>
                                                <MoreHorizontal size={15} /> More
                                            </button>
                                        </div>

                                        {!stepProceeded && (
                                            <div className="main-actions-row">
                                                <button className="quick-cash-btn" onClick={() => handlePaymentSubmit([{ type: 'CASH', amount: grandTotal }])} disabled={billItems.length === 0}>
                                                    QUICK CASH
                                                </button>
                                                <button className="proceed-btn" onClick={() => setStepProceeded(true)} disabled={billItems.length === 0}>
                                                    PROCEED <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fast Payment - Show only after Check Out/Proceed */}
                                    {stepProceeded && (
                                        <div className="fast-payment fade-in">
                                            <button className="pay-method cash" onClick={() => handlePayment('CASH')}><Wallet size={20} /> CASH</button>
                                            <button className="pay-method card" onClick={() => handlePayment('CARD')}><CreditCard size={20} /> CARD</button>
                                            <button className="pay-method upi" onClick={() => handlePayment('UPI')}><Smartphone size={20} /> UPI</button>
                                        </div>
                                    )}

                                    <div className="footer-actions-grid">
                                        <button className="action-btn hold-bill" onClick={holdCurrentBill} title="Hold this bill for later">
                                            <Pause size={18} /> HOLD
                                        </button>
                                        <button className="action-btn kot-print" onClick={() => handleOrderAction('KOT')} title="Send KOT to kitchen">
                                            <Printer size={18} /> KOT PRINT
                                        </button>
                                        <button className="action-btn save-bill" onClick={() => handleOrderAction('SAVE')} title="Save draft bill">
                                            <Save size={18} /> SAVE
                                        </button>
                                        <button className="action-btn print-bill" onClick={() => handleOrderAction('PRINT')} title="Save and print final bill">
                                            <Printer size={18} /> SAVE & PRINT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modals */}
            {
                showBillPreview && (
                    <BillPreviewModal
                        isOpen={showBillPreview}
                        onClose={() => setShowBillPreview(false)}
                        billId={lastBillId}
                        paymentModes={lastPaymentModes}
                    />
                )
            }
        </div >
    );
};

export default BillingPage;
