import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarPaymentFlow from './SidebarPaymentFlow';
import './BillingPage.css';
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
    Wallet,
    MoveHorizontal,
    ArrowLeftRight,
    Undo2,
    Edit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Custom Table Logo (Furniture style)
const TableLogo = ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" opacity="0" />
        <path d="M3 7h18" />
        <path d="M6 7v10" />
        <path d="M18 7v10" />
        <path d="M6 11h12" />
    </svg>
);

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
    const [stepProceeded, setStepProceeded] = useState(false);
    const [extraCharges, setExtraCharges] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [gstPercentage, setGstPercentage] = useState(5);
    const [promoCode, setPromoCode] = useState('');

    // -- NEW POS ENHANCEMENT STATES --
    const [showTimer, setShowTimer] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
    const [showRateColumn, setShowRateColumn] = useState(() => localStorage.getItem('pos_show_rate') !== 'false');
    const [showProductPrice, setShowProductPrice] = useState(() => localStorage.getItem('pos_show_prod_price') !== 'false');

    const [billSearchQuery, setBillSearchQuery] = useState("");
    const [dailySearchQuery, setDailySearchQuery] = useState("");
    const [kotSearchQuery, setKotSearchQuery] = useState("");

    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [containerCharge, setContainerCharge] = useState(0);
    const [discountType, setDiscountType] = useState('FIXED'); // 'PERCENT' or 'FIXED'

    const [isHoldPanelOpen, setIsHoldPanelOpen] = useState(false);
    const [heldBills, setHeldBills] = useState(() => JSON.parse(localStorage.getItem('pos_held_bills') || '[]'));

    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [activeTableType, setActiveTableType] = useState("ALL");
    const [selectedTableId, setSelectedTableId] = useState("");
    const [isTablePreSelected, setIsTablePreSelected] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerGst, setCustomerGst] = useState("");
    const [showPersonsForm, setShowPersonsForm] = useState(false);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showTableForm, setShowTableForm] = useState(false);
    const [showAlterForm, setShowAlterForm] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [showSplitForm, setShowSplitForm] = useState(false);
    const [showLoyaltyForm, setShowLoyaltyForm] = useState(false);
    const [showMoreForm, setShowMoreForm] = useState(false);
    const [showComplementaryForm, setShowComplementaryForm] = useState(false);

    const toggleExpandableForm = (formName) => {
        // Validation: For ALTER, TRANSFER, RETURN, we need an active bill loaded via search
        const needsBill = ['ALTER', 'TRANSFER', 'RETURN'].includes(formName);
        if (needsBill && !currentBillId) {
            return alert("Search and load a bill in the header first before using this feature.");
        }

        setShowPersonsForm(formName === 'PERSONS' ? !showPersonsForm : false);
        setShowCustomerForm(formName === 'CUSTOMER' ? !showCustomerForm : false);
        setShowTableForm(formName === 'TABLE' ? !showTableForm : false);
        setShowAlterForm(formName === 'ALTER' ? !showAlterForm : false);
        setShowTransferForm(formName === 'TRANSFER' ? !showTransferForm : false);
        setShowReturnForm(formName === 'RETURN' ? !showReturnForm : false);
        setShowSplitForm(formName === 'SPLIT' ? !showSplitForm : false);
        setShowLoyaltyForm(formName === 'LOYALTY' ? !showLoyaltyForm : false);
        setShowMoreForm(formName === 'MORE' ? !showMoreForm : false);
        setShowComplementaryForm(formName === 'COMPLEMENTARY' ? !showComplementaryForm : false);
        setStepProceeded(formName === 'PAYMODE' ? !stepProceeded : false);
        setCheckoutActive(formName === 'PAYMODE' ? !checkoutActive : false);

        setSelectionOverlay('NONE');
        // No longer fetching KOTs here as we use the header search
    };
    const [isOrderListCollapsed, setIsOrderListCollapsed] = useState(false);

    // -- SELECTION OVERLAYS --
    const [activeItemActions, setActiveItemActions] = useState(null);
    const [selectionOverlay, setSelectionOverlay] = useState('NONE'); // NONE, TABLE, CAPTAIN, ALTER, TRANSFER, RETURN, SPLIT
    const [selectedItemForAction, setSelectedItemForAction] = useState(null);
    const [billSearchKots, setBillSearchKots] = useState([]);

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
        const fullUrl = import.meta.env.VITE_API_URL || '';
        // If the URL ends with /api, remove it to get the server root for images
        if (fullUrl.endsWith('/api')) {
            return fullUrl.slice(0, -4);
        }
        return fullUrl;
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

                // 5. Fetch Tables & Types
                const [tableRes, typeRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/tables`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/table-types`, { headers })
                ]);
                const tableData = await tableRes.json();
                const typeData = await typeRes.json();

                if (tableData.success) setTables(tableData.data);
                if (typeData.success) setTableTypes(typeData.data);


            } catch (error) {
                console.error("Billing init error", error);
                alert("Connection failed. If you just deployed to Render, the server might be waking up. Please refresh in 30 seconds.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [location.key]);

    // Handle Restoration of Held Bill
    useEffect(() => {
        if (location.state && location.state.restoreHold) {
            const hold = location.state.restoreHold;
            setBillItems(hold.items);
            setCurrentBillId(hold.billId);
            setBillNumber(hold.billNumber);
            setTableNo(hold.tableNo || "");
            setOrderMode(hold.orderMode || 'DINE_IN');
            setCustomerName(hold.customerName || "");
            setCustomerPhone(hold.customerPhone || "");
            setCustomerAddress(hold.customerAddress || "");

            // Remove from localStorage
            const held = JSON.parse(localStorage.getItem('pos_held_bills') || '[]');
            const updated = held.filter(h => h.id !== hold.id);
            localStorage.setItem('pos_held_bills', JSON.stringify(updated));
            setHeldBills(updated);

            // Use window.history.replaceState to clear location.state without triggering reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Handle navigation FROM TableSelectionPage
    useEffect(() => {
        if (location.state && location.state.fromTable) {
            setTableNo(location.state.tableNo || '');
            setSelectedTableId(location.state.tableId || '');
            setPersons(location.state.persons || '');
            setOrderMode('DINE_IN');
            setIsTablePreSelected(true);

            // Pre-fill customer details if it's a reservation
            if (location.state.reservationName) {
                setCustomerName(location.state.reservationName);
            }
            if (location.state.reservationPhone) {
                setCustomerPhone(location.state.reservationPhone);
            }

            // Clear state so refresh doesn't re-apply
            window.history.replaceState({}, document.title);
        } else if (location.state && location.state.orderMode) {
            setOrderMode(location.state.orderMode);
            setIsTablePreSelected(false);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Fetch KOTs for Alter Bill
    const fetchKots = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills?status=PENDING`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setBillSearchKots(data.data);
        } catch (error) {
            console.error("KOT fetch error", error);
        }
    };

    // Create New Bill
    const createNewBill = async () => {
        if (!selectedCounter) return null;
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
                return data.data._id;
            } else {
                alert(data.message || "Could not create bill.");
            }
        } catch (error) {
            console.error("Create bill error", error);
        }
        return null;
    };

    const createManualNewBill = async () => {
        if (!window.confirm("Start a manual new bill? This will clear current items.")) return;
        setBillItems([]);
        setCurrentBillId(null);
        setBillNumber('Generating...');
        await createNewBill();
    };

    useEffect(() => {
        // Automatically create a new bill if we have a counter but no active bill
        const autoCreate = async () => {
            if (selectedCounter && !currentBillId && !loading) {
                await createNewBill();
            }
        };
        autoCreate();
    }, [selectedCounter, currentBillId, loading]);

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
        // Fix: Automatically try to create a bill if one is missing (e.g. initial load failed)
        let activeId = currentBillId;
        if (!activeId) {
            if (!selectedCounter) {
                alert("Please select a counter in Settings, or create one in Counter Master if none exist.");
                return;
            }
            setBillNumber('Auto-Generating...');
            activeId = await createNewBill();
            if (!activeId) {
                return alert("Failed to generate a bill. Please check your connection or counter setup.");
            }
        }

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
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${activeId}/items`, {
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


    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "ALL" || p.category === activeCategory;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(searchLower) ||
            (p.code && p.code.toLowerCase().includes(searchLower));
        return matchesCategory && matchesSearch;
    });

    const handleBillSearch = async (e, query) => {
        if (e.key === 'Enter' && query.trim()) {
            try {
                const savedUser = localStorage.getItem('user');
                const { token } = JSON.parse(savedUser);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/bills?search=${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    loadBillForAlter(data.data[0]);
                    setBillSearchQuery("");
                    setKotSearchQuery("");
                } else {
                    alert("No matching bill found.");
                }
            } catch (error) {
                console.error("Bill search error", error);
            }
        }
    };

    const handleNotificationClick = () => {
        alert("No new notifications at the moment.");
    };

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
                    persons: persons
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
        setCustomerName("");
        setShowPersonsForm(false);
        setShowCustomerForm(false);
        setShowTableForm(false);
        setShowAlterForm(false);
        setShowTransferForm(false);
        setShowReturnForm(false);
        setShowSplitForm(false);
        setShowLoyaltyForm(false);
        setShowMoreForm(false);
        setShowComplementaryForm(false);
        setCustomerPhone("");
        setCustomerAddress("");
        setCustomerGst("");
        setDiscount(0);
        setDeliveryCharge(0);
        setContainerCharge(0);
        setBillItems([]);
        setStepProceeded(false);
        setPromoCode('');
        createNewBill();
    };

    const handleTransferItem = (idx) => {
        setSelectedItemForAction(idx);
        toggleExpandableForm('TRANSFER');
    };

    const handleReturnItem = (idx) => {
        const item = billItems[idx];
        const reason = window.prompt(`Return Item: ${item.name}\nEnter reason:`, "Customer unsatisfied");
        if (reason === null) return;

        const returnQtyInput = window.prompt(`Enter quantity to return (Max ${item.quantity}):`, "1");
        const returnQty = parseInt(returnQtyInput);
        if (isNaN(returnQty) || returnQty <= 0) return;

        const finalReturnQty = Math.min(returnQty, item.quantity);

        // Log to Return History (Simulation via localStorage)
        const returnEntry = {
            id: Date.now(),
            billId: currentBillId,
            item: item.name,
            quantity: finalReturnQty,
            reason: reason,
            timestamp: new Date().toISOString()
        };
        const history = JSON.parse(localStorage.getItem('pos_return_history') || '[]');
        localStorage.setItem('pos_return_history', JSON.stringify([returnEntry, ...history]));

        // Deduct from current bill
        if (finalReturnQty === item.quantity) {
            removeFromBill(idx);
        } else {
            const newItems = [...billItems];
            newItems[idx].quantity -= finalReturnQty;
            newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
            setBillItems(newItems);
        }
        alert(`${finalReturnQty} x ${item.name} returned and logged to Return History.`);
    };

    const handleSplitBill = () => {
        if (billItems.length < 2) return alert("Need at least 2 items to split!");
        toggleExpandableForm('SPLIT');
    };

    const loadBillForAlter = (bill) => {
        setCurrentBillId(bill._id);
        setBillNumber(bill.bill_number);
        setBillItems(bill.items || []);
        setOrderMode(bill.type || 'DINE_IN');
        setTableNo(bill.table_no || "");
        setCustomerName(bill.customer_name || "");
        setCustomerPhone(bill.customer_phone || "");
        setSelectionOverlay('NONE');
        alert(`Bill ${bill.bill_number} loaded for alteration.`);
    };

    const toggleFullBillComplimentary = () => {
        const anyNonComp = billItems.some(i => !i.is_complementary);
        const newItems = billItems.map(i => ({ ...i, is_complementary: anyNonComp }));
        setBillItems(newItems);
    };

    const holdCurrentBill = () => {
        if (billItems.length === 0) return alert("Cannot hold an empty bill.");
        const newHold = {
            id: Date.now(),
            billId: currentBillId,
            billNumber: billNumber,
            items: billItems,
            tableNo: tableNo,
            orderMode: orderMode,
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            grandTotal: grandTotal,
            timestamp: new Date().toISOString()
        };
        const updated = [newHold, ...heldBills];
        setHeldBills(updated);
        localStorage.setItem('pos_held_bills', JSON.stringify(updated));
        resetForm();
        alert("Bill placed on hold.");
    };

    const restoreHeldBill = (hold) => {
        if (billItems.length > 0) {
            if (!window.confirm("Current bill items will be discarded. Continue?")) return;
        }
        setBillItems(hold.items);
        setCurrentBillId(hold.billId);
        setBillNumber(hold.billNumber);
        setTableNo(hold.tableNo || "");
        setOrderMode(hold.orderMode || 'DINE_IN');
        setCustomerName(hold.customerName || "");
        setCustomerPhone(hold.customerPhone || "");
        setCustomerAddress(hold.customerAddress || "");

        const updated = heldBills.filter(h => h.id !== hold.id);
        setHeldBills(updated);
        localStorage.setItem('pos_held_bills', JSON.stringify(updated));
        setIsHoldPanelOpen(false);
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
                    <div className="pos-brand-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/logo.jpeg" alt="Yugam Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
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
                        <button type="button" className="nav-action-btn" onClick={() => navigate('/dashboard/self-service/bills-sales')} title="Recent Orders">
                            ORDER
                        </button>
                        <button type="button" className={`nav-action-btn ${heldBills.length > 0 ? 'has-items' : ''}`} onClick={() => navigate('/dashboard/self-service/hold')} title="Manage held transactions">
                            HOLD {heldBills.length > 0 && <span className="hold-badge">{heldBills.length}</span>}
                        </button>
                        <button type="button" className="nav-action-btn" onClick={handleNotificationClick} title="System Alerts">
                            NOTIFICATION
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
                                <div className="settings-option">
                                    <span>Show Rate Column</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={showRateColumn} onChange={() => {
                                            const next = !showRateColumn;
                                            setShowRateColumn(next);
                                            localStorage.setItem('pos_show_rate', String(next));
                                        }} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="settings-option">
                                    <span>Show Item Price</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={showProductPrice} onChange={() => {
                                            const next = !showProductPrice;
                                            setShowProductPrice(next);
                                            localStorage.setItem('pos_show_prod_price', String(next));
                                        }} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                            </div>
                        )}
                    </div>

                    <div className="nav-actions-group">
                        <button type="button" className="nav-action-btn" onClick={logout} title="Sign Out">
                            LOGOUT
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Search & Mode Bar - Restored to Global Position */}
            <div className="pos-search-section">
                <div className="search-flex-container">
                    {/* Searches Grouped on Left */}
                    <div className="search-input-wrapper main-search">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Product Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="search-input-wrapper secondary-search">
                        <History size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="KOT Search"
                            value={kotSearchQuery}
                            onChange={(e) => setKotSearchQuery(e.target.value)}
                            onKeyDown={(e) => handleBillSearch(e, kotSearchQuery)}
                        />
                    </div>

                    <div className="search-input-wrapper secondary-search">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Bill No."
                            value={billSearchQuery}
                            onChange={(e) => setBillSearchQuery(e.target.value)}
                            onKeyDown={(e) => handleBillSearch(e, billSearchQuery)}
                        />
                    </div>

                    {/* Order Mode Selector - Restored to Far Right */}
                    <div className="mode-selector-header">
                        {[
                            { id: 'DINE_IN', label: 'Dine In', icon: <TableLogo size={16} /> },
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
                                        {showProductPrice && <div className="p-price">₹{product.selling_price}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>


                    </>
                </div>

                {/* 3. Bill Panel (Right) */}
                <div className="bill-sidebar">
                    {/* Meta Icons row from reference image */}
                    <div className="sidebar-meta-icons">
                        {isTablePreSelected ? (
                            // Table was pre-selected — show read-only pill
                            <div className="meta-icon-btn active" style={{ cursor: 'default', pointerEvents: 'none' }}>
                                <div className="icon-bg"><TableLogo size={18} /></div>
                                <span style={{ color: '#ea580c', fontWeight: 900 }}>{tableNo}</span>
                            </div>
                        ) : (
                            <button className={`meta-icon-btn ${showTableForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('TABLE')}>
                                <div className="icon-bg"><TableLogo size={18} /></div>
                                <span>{tableNo || 'TABLE'}</span>
                            </button>
                        )}
                        {isTablePreSelected ? (
                            // Persons pre-filled from table — read-only
                            <div className="meta-icon-btn active" style={{ cursor: 'default', pointerEvents: 'none' }}>
                                <div className="icon-bg"><Users size={18} /></div>
                                <span style={{ color: '#ea580c', fontWeight: 900 }}>{persons ? `${persons} PAX` : 'PERSONS'}</span>
                            </div>
                        ) : (
                            <button className={`meta-icon-btn ${showPersonsForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('PERSONS')}>
                                <div className="icon-bg"><Users size={18} /></div>
                                <span>{persons ? `${persons} PAX` : 'PERSONS'}</span>
                            </button>
                        )}
                        <button className={`meta-icon-btn ${showCustomerForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('CUSTOMER')}>
                            <div className="icon-bg"><User size={18} /></div>
                            <span>CUSTOMER</span>
                        </button>
                        <button className={`meta-icon-btn ${showAlterForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('ALTER')}>
                            <div className="icon-bg"><Edit size={18} /></div>
                            <span>ALTER</span>
                        </button>
                        <button className={`meta-icon-btn ${showTransferForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('TRANSFER')}>
                            <div className="icon-bg"><ArrowLeftRight size={18} /></div>
                            <span>TRANSFER</span>
                        </button>
                        <button className={`meta-icon-btn ${showReturnForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('RETURN')}>
                            <div className="icon-bg"><Undo2 size={18} /></div>
                            <span>RETURN</span>
                        </button>
                    </div>

                    {/* Table Form Section */}
                    {showTableForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            {/* Table Type Tabs - Derived from actual table data */}
                            <div className="flex gap-2 px-4 py-2 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                                <button
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTableType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    onClick={() => setActiveTableType('ALL')}
                                >
                                    All Areas
                                </button>
                                {[...new Set(tables.map(t => t.table_type))].filter(Boolean).sort().map(typeName => (
                                    <button
                                        key={typeName}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTableType === typeName ? 'bg-[#ea580c] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        onClick={() => setActiveTableType(typeName)}
                                    >
                                        {typeName}
                                    </button>
                                ))}
                            </div>

                            <div className="table-selection-container" style={{ padding: '10px 0', maxHeight: '350px', overflowY: 'auto' }}>
                                {[...new Set(tables.map(t => t.table_type))]
                                    .filter(Boolean)
                                    .filter(typeName => activeTableType === 'ALL' || activeTableType === typeName)
                                    .sort()
                                    .map(typeName => {
                                        const filteredTables = tables.filter(t => t.table_type === typeName);
                                        return (
                                            <div key={typeName} className="table-zone-group" style={{ marginBottom: '20px' }}>
                                                <div style={{ padding: '0 15px 8px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {typeName}
                                                </div>
                                                <div className="selection-grid" style={{ padding: '0 15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                                    {filteredTables.map(t => (
                                                        <button
                                                            key={t._id}
                                                            className={`selection-card ${tableNo === t.table_number ? 'active' : ''}`}
                                                            onClick={() => { setTableNo(t.table_number); setSelectedTableId(t._id); setShowTableForm(false); }}
                                                            style={{
                                                                padding: '8px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                background: tableNo === t.table_number ? '#ea580c' : (t.status === 'AVAILABLE' ? '#f0fdf4' : '#f8fafc'),
                                                                color: tableNo === t.table_number ? '#fff' : (t.status === 'AVAILABLE' ? '#166534' : '#1e293b'),
                                                                borderRadius: '8px',
                                                                border: tableNo === t.table_number ? '1px solid #ea580c' : '1px solid #e2e8f0',
                                                                transition: 'all 0.2s',
                                                                minWidth: '80px'
                                                            }}
                                                        >
                                                            <TableLogo size={14} />
                                                            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t.table_number}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                {tables.length === 0 && (
                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                        <p className="text-[11px] text-slate-400 font-medium italic">No tables available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Persons Form Section */}
                    {showPersonsForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Number of Persons (PAX)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Enter number of persons"
                                        value={persons}
                                        onChange={(e) => setPersons(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customer Form Section */}
                    {showCustomerForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="text" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea rows="1" placeholder="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} style={{ minHeight: '38px' }}></textarea>
                                </div>
                                <div className="form-group">
                                    <label>GST Number</label>
                                    <input type="text" placeholder="GSTIN" value={customerGst} onChange={(e) => setCustomerGst(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alter Form Section */}
                    {showAlterForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '0 15px 15px' }}>
                                <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '8px', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Edit size={16} color="#4338ca" />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4338ca' }}>ALTERATION MODE ACTIVE</span>
                                </div>
                                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>You are currently modifying Bill #{billNumber}. Update items and click "SAVE" or "KOT" to confirm changes.</p>
                            </div>
                        </div>
                    )}

                    {/* Transfer Form Section */}
                    {showTransferForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '0 15px 15px' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>Select destination table to transfer <strong>{selectedItemForAction !== null ? billItems[selectedItemForAction]?.name : 'an item'}</strong>.</p>
                                <div className="selection-grid tables" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                    {tables.map(t => (
                                        <button key={t._id} onClick={() => { alert(`Transferred item to Table ${t.table_no}`); removeFromBill(selectedItemForAction); setShowTransferForm(false); }} style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', color: '#1e293b', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                                            <Table size={20} />
                                            <span style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>{t.table_no}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Return Form Section */}
                    {showReturnForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '0 15px 15px' }}>
                                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <Undo2 size={16} color="#dc2626" />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>RETURN MODE ACTIVE</span>
                                </div>
                                <p style={{ fontSize: '11px', color: '#64748b' }}>Select items from the bill to return and specify quantities below.</p>
                            </div>
                        </div>
                    )}

                    {/* Split Form Section */}
                    {showSplitForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '0 15px 15px' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>Select items to move to a new bill.</p>
                                <div className="split-items-list" style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {billItems.map((item, i) => (
                                        <div key={i} className="split-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontWeight: '500' }}>{item.name} (x{item.quantity})</span>
                                            <input type="checkbox" style={{ transform: 'scale(1.2)' }} />
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => { alert("Bill split successfully."); setShowSplitForm(false); }} style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'black', letterSpacing: '0.5px' }}>CREATE NEW BILL</button>
                            </div>
                        </div>
                    )}

                    {/* Item List */}
                    <div className={`order-items-header ${showRateColumn ? 'with-rate' : 'no-rate'}`}>
                        <span className="col-name">ITEM</span>
                        <span className="col-qty">QTY</span>
                        {showRateColumn && <span className="col-rate">RATE</span>}
                        <span className="col-amt">AMT</span>
                        <button className="collapse-toggle-btn" onClick={() => setIsOrderListCollapsed(!isOrderListCollapsed)}>
                            {isOrderListCollapsed ? <ChevronDown size={14} /> : <ArrowLeft className="rotate-90" size={14} />}
                        </button>
                    </div>

                    {/* Scrollable area: items list + bill footer together */}
                    <div className="bill-scroll-area">
                        <div className={`order-items-list ${isOrderListCollapsed ? 'hidden' : ''}`}>
                            {billItems.length === 0 ? (
                                <div className="empty-cart">
                                    <ShoppingBag size={48} />
                                    <p>Order is empty</p>
                                </div>
                            ) : billItems.map((item, idx) => (
                                <div key={idx} className={`order-item-row ${showRateColumn ? 'with-rate' : 'no-rate'} ${item.is_complementary ? 'complementary' : ''}`}>
                                    <div className="item-name-cell">
                                        <div className="item-name-wrap">
                                            <span>{item.name}</span>
                                        </div>
                                    </div>
                                    <div className="item-qty-cell">
                                        <button onClick={() => updateItemQuantity(item.product_id, -1)}><Minus size={12} /></button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateItemQuantity(item.product_id, 1)}><Plus size={12} /></button>
                                    </div>
                                    {showRateColumn && <div className="item-rate">{item.is_complementary ? 0 : item.unit_price}</div>}
                                    <div className="item-amt">{item.is_complementary ? 0 : item.total_price}</div>
                                    <div className="item-actions-cell">
                                        {activeItemActions === idx && (
                                            <div className="extra-actions-layer">
                                                <button className="row-action-btn" onClick={() => handleTransferItem(idx)} title="Transfer Item"><ArrowLeftRight size={14} /></button>
                                                <button className="row-action-btn" onClick={() => handleReturnItem(idx)} title="Return Item"><Undo2 size={14} /></button>
                                            </div>
                                        )}
                                        <button
                                            className={`item-action-toggle ${activeItemActions === idx ? 'active' : ''}`}
                                            onClick={() => setActiveItemActions(activeItemActions === idx ? null : idx)}
                                            title="Action Toggle"
                                        >
                                            <MoreHorizontal size={14} />
                                        </button>
                                        <button
                                            className={`comp-toggle-sm ${item.is_complementary ? 'active' : ''}`}
                                            onClick={() => toggleComplementary(idx)}
                                            title="Complementary"
                                        >
                                            <Gift size={14} />
                                        </button>
                                        <button className="remove-btn" onClick={() => removeFromBill(idx)} title="Remove Item"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bill Footer */}
                        <div className="order-footer">
                            <div className="summary-section">
                                {showMoreForm && (
                                    <div className={`collapsible-summary-area animate-in fade-in slide-in-from-top-2 duration-300`}>
                                        <div className="sum-row" style={{ padding: '5px 0', borderBottom: '1px dashed #e2e8f0' }}>
                                            <span>Subtotal ({billItems.length} items)</span>
                                            <span className="mono">₹{subTotal.toFixed(2)}</span>
                                        </div>

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

                                            <div className="sum-detail-row">
                                                <label>Deliv. Chg</label>
                                                <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} />
                                                <span className="calc-val">+ ₹{billCalculations.deliveryCharge.toFixed(2)}</span>
                                            </div>

                                            <div className="sum-detail-row">
                                                <label>Pack. Chg</label>
                                                <input type="number" value={containerCharge} onChange={(e) => setContainerCharge(e.target.value)} />
                                                <span className="calc-val">+ ₹{billCalculations.containerCharge.toFixed(2)}</span>
                                            </div>

                                            <div className="sum-detail-row">
                                                <label>Tax ({gstPercentage}%)</label>
                                                <div className="empty-input"></div>
                                                <span className="calc-val">+ ₹{taxAmount.toFixed(2)}</span>
                                            </div>

                                            <div className="sum-detail-row">
                                                <label>Round Off</label>
                                                <div className="empty-input"></div>
                                                <span className="calc-val">{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showLoyaltyForm && (
                                    <div className="customer-expandable-form animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="loyalty-promo-compact" style={{ padding: '15px' }}>
                                            <div className="loyalty-input">
                                                <Gift size={14} />
                                                <input type="text" placeholder="Loyalty / Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                                <button onClick={() => { applyPromoCode(); toggleExpandableForm('LOYALTY'); }}>Apply</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showComplementaryForm && (
                                    <div className="customer-expandable-form animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="comp-form-internal" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>Mark All Items as Complementary?</span>
                                            <button
                                                onClick={() => { toggleFullBillComplimentary(); toggleExpandableForm('COMPLEMENTARY'); }}
                                                style={{ background: '#ea580c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '900', fontSize: '0.75rem' }}
                                            >
                                                TOGGLE ALL
                                            </button>
                                        </div>
                                    </div>
                                )}



                                <div className="sum-total-enhanced">
                                    <div className="total-label">
                                        <span className="main-total">TOTAL PAYABLE</span>
                                    </div>
                                    <span className="items-count" style={{ fontSize: '0.9rem', fontWeight: '900', opacity: 1 }}>
                                        {billItems.reduce((sum, item) => sum + item.quantity, 0)} QTY
                                    </span>
                                    <span className="total-value">₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Top Control Buttons */}
                            <div className="billing-actions-panel">
                                <div className="panel-controls">
                                    <button className={`control-btn ${showLoyaltyForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('LOYALTY')}>
                                        <Gift size={15} /> Loyalty
                                    </button>
                                    <button className={`control-btn ${showComplementaryForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('COMPLEMENTARY')}>
                                        <Gift size={15} /> COMPLEMENTARY
                                    </button>
                                    <button className={`control-btn ${showMoreForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('MORE')}>
                                        <MoreHorizontal size={15} /> More
                                    </button>
                                    <button className={`control-btn paymode-btn ${stepProceeded ? 'active' : ''}`} onClick={() => toggleExpandableForm('PAYMODE')} disabled={billItems.length === 0}>
                                        <CreditCard size={15} /> PAYMODE
                                    </button>
                                </div>
                            </div>

                            {/* Integrated Sidebar Payment Flow */}
                            {stepProceeded && (
                                <SidebarPaymentFlow
                                    grandTotal={grandTotal}
                                    onPaymentSubmit={handlePaymentSubmit}
                                    onCancel={() => setStepProceeded(false)}
                                    loading={paymentLoading}
                                />
                            )}

                            <div className="footer-actions-grid">
                                <button type="button" className="action-btn save-bill" onClick={() => handleOrderAction('SAVE')} title="Save draft bill">
                                    <Save size={18} /> SAVE
                                </button>
                                <button type="button" className="action-btn print-bill" onClick={() => handleOrderAction('PRINT')} title="Save and print final bill">
                                    <Printer size={18} /> SAVE & PRINT
                                </button>
                                <button type="button" className="action-btn kot-print" onClick={() => handleOrderAction('KOT')} title="Send KOT to kitchen">
                                    <Printer size={18} /> KOT PRINT
                                </button>
                                <button type="button" className="action-btn hold-bill" onClick={holdCurrentBill} title="Hold this bill for later">
                                    <Pause size={18} /> HOLD
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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
            </div>
        </div>

    );
};

export default BillingPage;
