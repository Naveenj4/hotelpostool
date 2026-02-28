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
    LogOut
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

    const subTotal = billItems.reduce((acc, item) => acc + item.total_price, 0);
    const parsedDiscount = parseFloat(discount) || 0;
    const parsedExtraCharges = parseFloat(extraCharges) || 0;
    const parsedGst = parseFloat(gstPercentage) || 0;
    const taxableAmount = subTotal - parsedDiscount;
    const tax = taxableAmount * (parsedGst / 100);
    const grandTotal = taxableAmount + tax + parsedExtraCharges;

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

    const handlePaymentSubmit = async (paymentModes) => {
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
                    tax_amount: tax,
                    discount_amount: parsedDiscount,
                    grand_total: grandTotal
                })
            });
            const data = await res.json();
            if (data.success) {
                setLastPaymentModes(paymentModes);
                setLastBillId(currentBillId);
                setShowBillPreview(true);
                setCheckoutActive(false);
                setCheckoutType('');
                setCurrentBillId(null);
                setBillNumber('Generating...');
                setBillItems([]);
                createNewBill();
            }
        } catch (error) {
            alert("Payment failed.");
        } finally {
            setPaymentLoading(false);
        }
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
                    <button className="nav-icon-btn" onClick={() => navigate('/dashboard/self-service/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="pos-brand-compact">
                        <h2>{restaurantName}</h2>
                        <span>POS Terminal</span>
                    </div>
                </div>

                <div className="nav-center">
                    <div className="pos-timer-compact">
                        <div className="timer-v-date">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        <div className="timer-v-time">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                    </div>

                    <div className="mode-selector">
                        {['DINE_IN', 'DELIVERY', 'PARCEL', 'PARTY'].map(mode => (
                            <button
                                key={mode}
                                className={`mode-btn ${orderMode === mode ? 'active' : ''}`}
                                onClick={() => setOrderMode(mode)}
                            >
                                {mode.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="nav-right">
                    <div className="pos-status-info">
                        <div className="status-row">
                            <span className="status-label">B:</span>
                            <span className="status-value">{billNumber}</span>
                        </div>
                        <div className="status-row">
                            <span className="status-label">C:</span>
                            <span className="status-value">{counters.find(c => c._id === selectedCounter)?.name || '...'}</span>
                        </div>
                    </div>

                    {/* Layout Toggle Button */}
                    <button
                        className="layout-toggle-btn"
                        onClick={toggleLayout}
                        title={billingLayout === 'SIDEBAR' ? 'Switch to Top Header' : 'Switch to Sidebar'}
                    >
                        {billingLayout === 'SIDEBAR' ? <LayoutGrid size={18} /> : <Columns size={18} />}
                        <span className="layout-toggle-label">
                            {billingLayout === 'SIDEBAR' ? 'Top' : 'Side'}
                        </span>
                    </button>

                    <button className="reset-btn" onClick={() => window.location.reload()} title="Hard Reload">
                        <RotateCcw size={18} />
                    </button>

                    <button className="new-bill-btn" onClick={createManualNewBill} title="Generate New Bill">
                        <Plus size={20} />
                        <span className="btn-label">New Bill</span>
                    </button>

                    <div className="nav-divider"></div>

                    <button className="logout-btn-pos" onClick={logout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main POS Container */}
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
                            <div className="search-bar">
                                {billingLayout === 'SIDEBAR' && !showSidebar && (
                                    <button
                                        className="toggle-cat-btn"
                                        onClick={() => setShowSidebar(true)}
                                        title="Show Categories"
                                    >
                                        <MenuIcon size={20} />
                                    </button>
                                )}
                                <Search size={20} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by product name or code..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

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
                                        className="pos-product-card"
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

                            {/* Bottom Category List (Horizontal) - Only if Layout 1 */}
                            {billingLayout === 'SIDEBAR' && (
                                <div className="bottom-category-bar">
                                    <button
                                        className={`bottom-cat-chip ${activeCategory === "ALL" ? 'active' : ''}`}
                                        onClick={() => setActiveCategory("ALL")}
                                    >
                                        All
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat._id}
                                            className={`bottom-cat-chip ${activeCategory === cat.name ? 'active' : ''}`}
                                            onClick={() => setActiveCategory(cat.name)}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Bottom Action Bar */}
                            <div className="pos-bottom-actions">
                                <button className="action-btn">Alter</button>
                                <button className="action-btn">Sales Return</button>
                                <button className="action-btn">Transfer</button>
                            </div>
                        </>
                    )}
                </div>

                {/* 3. Bill Panel (Right) */}
                <div className="bill-sidebar">
                    {/* Order Meta */}
                    <div className="order-meta">
                        <div className="meta-input">
                            <Table size={16} />
                            <input type="text" placeholder="Table No" value={tableNo} onChange={(e) => setTableNo(e.target.value)} />
                        </div>
                        <div className="meta-input">
                            <Users size={16} />
                            <input type="text" placeholder="Persons" value={persons} onChange={(e) => setPersons(e.target.value)} />
                        </div>
                    </div>

                    {/* Item List */}
                    <div className="order-items-header">
                        <span className="col-name">ITEM</span>
                        <span className="col-qty">QTY</span>
                        <span className="col-rate">RATE</span>
                        <span className="col-amt">AMT</span>
                    </div>

                    <div className="order-items-list">
                        {billItems.length === 0 ? (
                            <div className="empty-cart">
                                <ShoppingBag size={48} />
                                <p>Order is empty</p>
                            </div>
                        ) : billItems.map((item, idx) => (
                            <div key={idx} className="order-item-row">
                                <div className="item-name-cell">
                                    <button className="remove-btn" onClick={() => removeFromBill(idx)}><Trash2 size={14} /></button>
                                    <span>{item.name}</span>
                                </div>
                                <div className="item-qty-cell">
                                    <button onClick={() => updateItemQuantity(item.product_id, -1)}><Minus size={12} /></button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateItemQuantity(item.product_id, 1)}><Plus size={12} /></button>
                                </div>
                                <div className="item-rate">{item.unit_price}</div>
                                <div className="item-amt">{item.total_price}</div>
                            </div>
                        ))}
                    </div>

                    {/* Bill Footer */}
                    <div className="order-footer">
                        <div className="summary-section">
                            <div className="sum-row">
                                <span>Subtotal ({billItems.length} items)</span>
                                <span>₹{subTotal.toFixed(2)}</span>
                            </div>

                            {/* Expanded "More" Options */}
                            {showMoreOptions && (
                                <div className="more-options-grid">
                                    <div className="opt-field">
                                        <label>GST %</label>
                                        <input type="number" value={gstPercentage} onChange={(e) => setGstPercentage(e.target.value)} />
                                    </div>
                                    <div className="opt-field">
                                        <label>Disc (₹)</label>
                                        <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                                    </div>
                                    <div className="opt-field">
                                        <label>Addl Chg</label>
                                        <input type="number" value={extraCharges} onChange={(e) => setExtraCharges(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Loyalty Section */}
                            {showLoyalty && (
                                <div className="loyalty-promo-row">
                                    <input
                                        type="text"
                                        placeholder="Enter promo/loyalty code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                    />
                                    <button className="apply-btn">Apply</button>
                                </div>
                            )}

                            <div className="sum-row">
                                <span>Tax ({parsedGst}%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="sum-total">
                                <span>Total Payable</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Top Control Buttons */}
                        <div className="panel-controls">
                            <button className={`control-btn ${showLoyalty ? 'active' : ''}`} onClick={() => setShowLoyalty(!showLoyalty)}>
                                Loyalty
                            </button>
                            <button className={`control-btn ${showMoreOptions ? 'active' : ''}`} onClick={() => setShowMoreOptions(!showMoreOptions)}>
                                More
                            </button>
                            {!stepProceeded && (
                                <button className="proceed-btn" onClick={() => setStepProceeded(true)} disabled={billItems.length === 0}>
                                    Check Out (Next)
                                </button>
                            )}
                        </div>

                        {/* Fast Payment - Show only after Check Out/Proceed */}
                        {stepProceeded && (
                            <div className="fast-payment fade-in">
                                <button className="pay-method cash" onClick={() => handlePayment('CASH')}>CASH</button>
                                <button className="pay-method card" onClick={() => handlePayment('CARD')}>CARD</button>
                                <button className="pay-method upi" onClick={() => handlePayment('UPI')}>UPI</button>
                            </div>
                        )}

                        <div className="footer-actions">
                            <button className="save-btn" onClick={handlePayment} disabled={billItems.length === 0}>
                                <Save size={18} /> SAVE
                            </button>
                            <button className="print-btn" onClick={handlePayment} disabled={billItems.length === 0}>
                                <Printer size={18} /> SAVE & PRINT
                            </button>
                            {stepProceeded && (
                                <button className="back-btn" onClick={() => setStepProceeded(false)}>
                                    Back
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showBillPreview && (
                <BillPreviewModal
                    isOpen={showBillPreview}
                    onClose={() => setShowBillPreview(false)}
                    billId={lastBillId}
                    paymentModes={lastPaymentModes}
                />
            )}
        </div>
    );
};

export default BillingPage;
