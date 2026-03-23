import { useState, useEffect, useMemo, useRef } from 'react';
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
    Edit,
    Layers,
    X,
    CalendarClock
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
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(() => localStorage.getItem('pos_loyalty_enabled') === 'true');
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
    const [captainName, setCaptainName] = useState("");
    const [waiterName, setWaiterName] = useState("");
    const [captains, setCaptains] = useState([]);
    const [waiters, setWaiters] = useState([]);
    const [showPersonsForm, setShowPersonsForm] = useState(false);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showCaptainForm, setShowCaptainForm] = useState(false);
    const [showWaiterForm, setShowWaiterForm] = useState(false);
    const [showTableForm, setShowTableForm] = useState(false);
    const [showAlterForm, setShowAlterForm] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [showSplitForm, setShowSplitForm] = useState(false);
    const [showLoyaltyForm, setShowLoyaltyForm] = useState(false);
    const [showMoreForm, setShowMoreForm] = useState(false);
    const [showComplementaryForm, setShowComplementaryForm] = useState(false);
    const [partyData, setPartyData] = useState(null);

    // Prevent auto-create from firing while we are fetching an existing bill for a table
    const isRestoringTableBill = useRef(false);

    const toggleExpandableForm = (formName) => {
        // Validation: For ALTER, TRANSFER, RETURN, we need an active bill loaded via search
        const needsBill = ['ALTER', 'TRANSFER', 'RETURN'].includes(formName);
        if (needsBill && !currentBillId) {
            return alert("Search and load a bill in the header first before using this feature.");
        }

        setShowPersonsForm(formName === 'PERSONS' ? !showPersonsForm : false);
        setShowCustomerForm(formName === 'CUSTOMER' ? !showCustomerForm : false);
        setShowTableForm(formName === 'TABLE' ? !showTableForm : false);
        // If whole bill transfer (no item selected), use same table form UI
        setShowTransferForm(formName === 'TRANSFER' ? !showTransferForm : false);
        setShowAlterForm(formName === 'ALTER' ? !showAlterForm : false);
        setShowReturnForm(formName === 'RETURN' ? !showReturnForm : false);
        setShowSplitForm(formName === 'SPLIT' ? !showSplitForm : false);
        setShowLoyaltyForm(formName === 'LOYALTY' ? !showLoyaltyForm : false);
        setShowCaptainForm(formName === 'CAPTAIN' ? !showCaptainForm : false);
        setShowWaiterForm(formName === 'WAITER' ? !showWaiterForm : false);
        setShowMoreForm(formName === 'MORE' ? !showMoreForm : false);
        setShowComplementaryForm(formName === 'COMPLEMENTARY' ? !showComplementaryForm : false);
        setStepProceeded(formName === 'PAYMODE' ? !stepProceeded : false);
        setCheckoutActive(formName === 'PAYMODE' ? !checkoutActive : false);

        setSelectionOverlay('NONE');
        // No longer fetching KOTs here as we use the header search
    };
    const [isOrderListCollapsed, setIsOrderListCollapsed] = useState(false);
    const [variationModalProduct, setVariationModalProduct] = useState(null);

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

                // 6. Fetch Captains & Waiters
                const [capRes, waitRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/captains`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/waiters`, { headers })
                ]);
                const capData = await capRes.json();
                const waitData = await waitRes.json();

                if (capData.success) setCaptains(capData.data);
                if (waitData.success) setWaiters(waitData.data);


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
            const tableId = location.state.tableId || '';
            const billId = location.state.billId || null;
            const tableStatus = location.state.tableStatus || '';

            setTableNo(location.state.tableNo || '');
            setSelectedTableId(tableId);
            setPersons(location.state.persons || '');
            setOrderMode('DINE_IN');
            setIsTablePreSelected(true);

            // Pre-fill customer details if it's a reservation
            if (location.state.reservationName) setCustomerName(location.state.reservationName);
            if (location.state.reservationPhone) setCustomerPhone(location.state.reservationPhone);

            const isPrintedOrOccupied = tableStatus === 'PRINTED' || tableStatus === 'OCCUPIED';

            if (isPrintedOrOccupied && billId) {
                // ── Load existing bill (bill counter opening a PRINTED table to pay) ──
                isRestoringTableBill.current = true;  // block auto-create during fetch
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const { token } = JSON.parse(savedUser);
                    fetch(`${import.meta.env.VITE_API_URL}/bills/${billId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(r => r.json())
                        .then(data => {
                            if (data.success && data.data) {
                                const bill = data.data;
                                // Restore full bill into POS
                                setCurrentBillId(bill._id);
                                setBillNumber(bill.bill_number);
                                setBillItems(bill.items || []);
                                setSelectedTableId(tableId); // Set the table ID from navigation state
                                setTableNo(bill.table_no || location.state.tableNo || '');
                                setPersons(bill.persons || location.state.persons || '');
                                setOrderMode(bill.type || 'DINE_IN');
                                setCustomerName(bill.customer_name || '');
                                setCustomerPhone(bill.customer_phone || '');
                                setCustomerAddress(bill.customer_address || '');
                                setCustomerGst(bill.customer_gst || '');
                                setCaptainName(bill.captain_name || '');
                                setWaiterName(bill.waiter_name || '');
                                setDiscount(bill.discount_amount || 0);
                                setDeliveryCharge(bill.delivery_charge || 0);
                                setContainerCharge(bill.container_charge || 0);

                                if (location.state && location.state.printKots) {
                                    setTimeout(() => handleAllKotsPrint(bill), 500);
                                }
                            } else {
                                console.warn('Could not load bill for table, starting fresh');
                            }
                            isRestoringTableBill.current = false;  // restore flag
                        })
                        .catch(e => {
                            console.error('Load table bill error', e);
                            isRestoringTableBill.current = false;
                        });
                }
            } else {
                // ── Fresh session: AVAILABLE or RESERVED table ──
                // Mark the table as OCCUPIED immediately (captain opened it)
                if (tableId) {
                    const savedUser = localStorage.getItem('user');
                    if (savedUser) {
                        const { token } = JSON.parse(savedUser);
                        fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/occupy`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ running_amount: 0 })
                        }).catch(e => console.error('Occupy table error', e));
                    }
                }
            }

            // Clear state so refresh doesn't re-apply
            window.history.replaceState({}, document.title);
        } else if (location.state && location.state.orderMode) {
            setOrderMode(location.state.orderMode);
            if (location.state.partyDetails) {
                setPartyData(location.state.partyDetails);
                setCustomerName(location.state.partyDetails.customer_name);
                setCustomerPhone(location.state.partyDetails.customer_phone);
                setCustomerAddress(location.state.partyDetails.customer_address);
            }
            setIsTablePreSelected(false);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Helper: update live amount on table whenever items change
    const updateTableLiveAmount = async (tableId, amount) => {
        if (!tableId) return;
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/update-amount`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ running_amount: amount })
            });
        } catch (e) {
            console.error('Update table amount error', e);
        }
    };

    // Helper: free table after payment
    const freeTableAfterPayment = async (tableId) => {
        if (!tableId) return;
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/free`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Free table error', e);
        }
    };

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
                const newBillId = data.data._id;
                setCurrentBillId(newBillId);
                setBillNumber(data.data.bill_number);
                setBillItems([]);

                // Link this bill to the table (so bill counter can fetch it later)
                const tId = selectedTableId;
                if (tId) {
                    fetch(`${import.meta.env.VITE_API_URL}/tables/${tId}/occupy`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ bill_id: newBillId, running_amount: 0 })
                    }).catch(e => console.error('Link bill to table error', e));
                }

                return newBillId;
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
        // Automatically create a new bill if we have a counter but no active bill.
        // Skip if we are in the middle of restoring a bill from a table click.
        const autoCreate = async () => {
            if (selectedCounter && !currentBillId && !loading && !isRestoringTableBill.current) {
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

        // Update live amount on table
        if (selectedTableId) {
            const newSub = newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0);
            updateTableLiveAmount(selectedTableId, newSub);
        }

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

    const addToBill = async (product, selectedVariation = null) => {
        // If product has variations and none selected yet, show selection modal
        if (product.variations?.length > 0 && !selectedVariation) {
            setVariationModalProduct(product);
            return;
        }

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

        const itemName = selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name;
        const itemUnitPrice = selectedVariation ? (product.selling_price + selectedVariation.amount) : product.selling_price;

        const existingItem = billItems.find(item => item.product_id === product._id && item.name === itemName);
        if (existingItem) {
            // Find its index
            const idx = billItems.indexOf(existingItem);
            const newItems = [...billItems];
            newItems[idx].quantity += 1;
            newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
            setBillItems(newItems);

            // Update live amount on table
            if (selectedTableId) {
                const newSub = newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0);
                updateTableLiveAmount(selectedTableId, newSub);
            }

            try {
                const savedUser = localStorage.getItem('user');
                const { token } = JSON.parse(savedUser);
                await fetch(`${import.meta.env.VITE_API_URL}/bills/${activeId}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ product_id: product._id, quantity: 1, variation: selectedVariation })
                });
            } catch (e) { console.error(e); }

            setVariationModalProduct(null);
            return;
        }

        const newItems = [...billItems, {
            product_id: product._id,
            name: itemName,
            category: product.category || '',
            quantity: 1,
            unit_price: itemUnitPrice,
            total_price: itemUnitPrice
        }];
        setBillItems(newItems);

        // Update table live amount
        if (selectedTableId) {
            const newSub = newItems.reduce((acc, i) => acc + i.total_price, 0);
            updateTableLiveAmount(selectedTableId, newSub);
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${activeId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: product._id, quantity: 1, variation: selectedVariation })
            });
        } catch (error) {
            console.error("Add item failed", error);
        }
        setVariationModalProduct(null);
    };

    const removeFromBill = async (index) => {
        const item = billItems[index];
        const newItems = billItems.filter((_, i) => i !== index);
        setBillItems(newItems);

        // Update live amount on table
        if (selectedTableId) {
            const newSub = newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0);
            updateTableLiveAmount(selectedTableId, newSub);
        }

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

        // Check availability based on order mode
        const modeMap = {
            'DINE_IN': 'dine_in',
            'TAKEAWAY': 'pickup',
            'SELF_SERVICE': 'pickup',
            'PARCEL': 'pickup',
            'DELIVERY': 'delivery',
            'PARTY': 'party_order'
        };
        const serveKey = modeMap[orderMode];
        const isAvailable = !serveKey || !p.serve_types || p.serve_types[serveKey] !== false;

        return matchesCategory && matchesSearch && isAvailable;
    });

    // ── Bill / KOT Search ──────────────────────────────────────────────────
    const [billSearchResults, setBillSearchResults] = useState([]);
    const [kotSearchResults, setKotSearchResults] = useState([]);
    const [showBillDropdown, setShowBillDropdown] = useState(false);
    const [showKotDropdown, setShowKotDropdown] = useState(false);
    const [billSearchLoading, setBillSearchLoading] = useState(false);

    // Search bills live as user types
    const searchBills = async (query, statusFilter = '') => {
        if (!query || query.trim().length < 1) {
            setBillSearchResults([]);
            setKotSearchResults([]);
            return;
        }
        setBillSearchLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            // Search across all statuses (OPEN + PAID)
            const url = statusFilter
                ? `${import.meta.env.VITE_API_URL}/bills?search=${encodeURIComponent(query)}&status=${statusFilter}`
                : `${import.meta.env.VITE_API_URL}/bills?search=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            const results = data.success ? data.data : [];
            if (statusFilter === 'OPEN') {
                setKotSearchResults(results);
            } else {
                setBillSearchResults(results);
            }
        } catch (e) {
            console.error('Bill search error', e);
        } finally {
            setBillSearchLoading(false);
        }
    };

    // Load a bill from search (replaces current bill state)
    const loadBillForAlter = async (billOrId, mode = 'ALTER') => {
        if (!billOrId) return;
        const bId = typeof billOrId === 'string' ? billOrId : billOrId._id;

        isRestoringTableBill.current = true; // Block auto-create
        setPaymentLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            // Re-fetch the full bill by ID to ensure we have the absolute latest state
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${bId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success && data.data) {
                const bill = data.data;
                setCurrentBillId(bill._id);
                setBillNumber(bill.bill_number);
                setBillItems(bill.items || []);
                setOrderMode(bill.type || 'DINE_IN');

                // Try to find the matching table ID from our local tables list to enable live sync
                const targetTableNo = bill.table_no || '';
                setTableNo(targetTableNo);
                const matchingTable = tables.find(t => t.table_number === targetTableNo || t.table_no === targetTableNo);
                if (matchingTable) {
                    setSelectedTableId(matchingTable._id);
                } else {
                    setSelectedTableId('');
                }

                setPersons(bill.persons || '');
                setCustomerName(bill.customer_name || '');
                setCustomerPhone(bill.customer_phone || '');
                setCustomerAddress(bill.customer_address || '');
                setCustomerGst(bill.customer_gst || '');
                setCaptainName(bill.captain_name || '');
                setWaiterName(bill.waiter_name || '');
                setDiscount(bill.discount_amount || 0);
                setDeliveryCharge(bill.delivery_charge || 0);
                setContainerCharge(bill.container_charge || 0);

                setSelectionOverlay('NONE');
                setActiveItemActions(null);
                setSelectedItemForAction(null);

                // Close dropdowns & clear searches
                setBillSearchQuery('');
                setKotSearchQuery('');
                setShowBillDropdown(false);
                setShowKotDropdown(false);
                setBillSearchResults([]);
                setKotSearchResults([]);

                // Auto-open the relevant panel if a mode is specified
                if (mode === 'ALTER') { setShowAlterForm(true); setShowReturnForm(false); setShowTransferForm(false); }
                else if (mode === 'RETURN') { setShowReturnForm(true); setShowAlterForm(false); setShowTransferForm(false); }
                else if (mode === 'TRANSFER') { setShowTransferForm(true); setShowAlterForm(false); setShowReturnForm(false); }
                else {
                    // mode === 'LOAD' (default) - Close all modes, just show the bill items
                    setShowAlterForm(false);
                    setShowReturnForm(false);
                    setShowTransferForm(false);
                    setShowCustomerForm(false);
                    setShowTableForm(false);
                    setShowPersonsForm(false);
                    // No alert needed for a smooth load
                }
            } else {
                alert(data.error || "Could not fetch bill details.");
            }
        } catch (e) {
            console.error('Load bill error', e);
            alert("Error fetching bill details.");
        } finally {
            setPaymentLoading(false);
            isRestoringTableBill.current = false;
        }
    };

    // Save altered bill (ALTER mode)
    const saveAlteredBill = async () => {
        if (!currentBillId) return;
        setPaymentLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    items: billItems,
                    sub_total: subTotal, tax_amount: taxAmount,
                    discount_amount: discountAmount, grand_total: grandTotal,
                    table_no: tableNo, persons, customer_name: customerName,
                    customer_phone: customerPhone, captain_name: captainName,
                    waiter_name: waiterName
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowAlterForm(false);
                alert(`Bill ${billNumber} updated successfully.`);
            } else { alert(data.error || 'Update failed'); }
        } catch (e) { console.error('Alter save error', e); }
        finally { setPaymentLoading(false); }
    };

    // Return state for the inline RETURN panel
    const [returnQtys, setReturnQtys] = useState({});
    const [returnReasons, setReturnReasons] = useState({});

    const handleInlineReturn = async () => {
        const hasAny = Object.values(returnQtys).some(q => q > 0);
        if (!hasAny) return alert('Select at least one item to return.');

        const newItems = billItems.map((item, idx) => {
            const rQty = parseInt(returnQtys[idx] || 0);
            if (!rQty) return item;
            // Log return
            const entry = {
                id: Date.now() + idx, billId: currentBillId, billNumber,
                item: item.name, quantity: rQty,
                reason: returnReasons[idx] || 'Customer unsatisfied',
                timestamp: new Date().toISOString()
            };
            const hist = JSON.parse(localStorage.getItem('pos_return_history') || '[]');
            localStorage.setItem('pos_return_history', JSON.stringify([entry, ...hist]));
            return { ...item, quantity: item.quantity - rQty, total_price: (item.quantity - rQty) * item.unit_price };
        }).filter(item => item.quantity > 0);

        setBillItems(newItems);

        // Save updated bill to backend
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items: newItems, grand_total: newItems.reduce((a, i) => a + i.total_price, 0) })
            });
        } catch (e) { console.error('Return save error', e); }

        setReturnQtys({});
        setReturnReasons({});
        setShowReturnForm(false);
        alert('Return processed and logged.');
    };

    // Transfer items to another table's bill
    const [transferTargetTable, setTransferTargetTable] = useState(null);
    const [transferItemSel, setTransferItemSel] = useState({}); // { idx: qty }

    const handleTransferToTable = async (targetTable) => {
        const hasAny = Object.values(transferItemSel).some(q => q > 0);
        if (!hasAny) return alert('Select at least one item with a quantity to transfer.');
        if (!targetTable.bill_id) return alert(`Table ${targetTable.table_number} has no active bill. A captain must open the table first.`);

        const savedUser = localStorage.getItem('user');
        const { token } = JSON.parse(savedUser);

        // 1. Add items to the target bill
        for (const [idxStr, qty] of Object.entries(transferItemSel)) {
            const qty2 = parseInt(qty || 0);
            if (!qty2) continue;
            const item = billItems[parseInt(idxStr)];
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${targetTable.bill_id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ product_id: item.product_id, quantity: qty2 })
            }).catch(e => console.error('Transfer add error', e));
        }

        // 2. Remove transferred items from source bill
        const newItems = billItems.map((item, idx) => {
            const tQty = parseInt(transferItemSel[idx] || 0);
            if (!tQty) return item;
            return { ...item, quantity: item.quantity - tQty, total_price: (item.quantity - tQty) * item.unit_price };
        }).filter(i => i.quantity > 0);

        setBillItems(newItems);
        await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ items: newItems, grand_total: newItems.reduce((a, i) => a + i.total_price, 0) })
        }).catch(e => console.error('Transfer source save error', e));

        setTransferItemSel({});
        setTransferTargetTable(null);
        setShowTransferForm(false);
        alert(`Items transferred to Table ${targetTable.table_number} successfully.`);
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

    const handlePaymentSubmit = async (paymentModes, tipAmount = 0, isPartial = false) => {
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
                    customer_address: customerAddress || partyData?.customer_address,
                    delivery_date: partyData?.delivery_date,
                    delivery_time: partyData?.delivery_time,
                    delivery_address: partyData?.customer_address,
                    table_no: tableNo,
                    persons: persons,
                    captain_name: captainName,
                    waiter_name: waiterName,
                    type: orderMode,
                    is_partial: isPartial
                })
            });
            const data = await res.json();
            if (data.success) {
                // Free the table after payment (reset to AVAILABLE)
                if (selectedTableId) {
                    freeTableAfterPayment(selectedTableId);
                }
                setLastBillId(currentBillId);
                setLastPaymentModes(paymentModes);
                setShowBillPreview(true);
                // Reset everything for the next bill
                setTableNo("");
                setPersons("");
                setSelectedTableId("");
                setCustomerName("");
                setCustomerPhone("");
                setCustomerAddress("");
                setCustomerGst("");
                setDiscount(0);
                setDeliveryCharge(0);
                setContainerCharge(0);
                setBillItems([]);
                setStepProceeded(false);
                setCheckoutActive(false);
                setPromoCode('');
                createNewBill();
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
                    action_type: type === 'KOT' ? 'GENERATE_KOT' : (type === 'SAVE' || type === 'PRINT' ? 'GENERATE_BILL_NO' : undefined),
                    status: type === 'KOT' ? 'OPEN' : undefined,
                    kitchen_status: type === 'KOT' ? 'PENDING' : undefined,
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
                    customer_phone: customerPhone,
                    captain_name: captainName,
                    waiter_name: waiterName
                })
            });
            const data = await res.json();
            if (data.success) {
                if (type === 'KOT') {
                    // 1. Update table amount + mark KOT SENT on floor plan
                    if (selectedTableId) {
                        updateTableLiveAmount(selectedTableId, grandTotal);
                        // Mark table kot_status = KOT_SENT so floor plan shows the indicator
                        try {
                            const { token: tk } = JSON.parse(localStorage.getItem('user'));
                            fetch(`${import.meta.env.VITE_API_URL}/tables/${selectedTableId}/kot-status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tk}` },
                                body: JSON.stringify({ kot_status: 'KOT_SENT' })
                            });
                        } catch (e) { console.error('KOT status update error', e); }
                    }
                    // 2. Signal KDS to refresh IMMEDIATELY using BroadcastChannel
                    try {
                        const kotChannel = new BroadcastChannel('restoboard_kot');
                        kotChannel.postMessage({ type: 'KOT_FIRED', billId: currentBillId, billNumber, tableNo, ts: Date.now() });
                        kotChannel.close();
                    } catch (e) {
                        localStorage.setItem('kot_fired', JSON.stringify({ ts: Date.now() }));
                    }
                    // 3. Print KOT on physical printer
                    if (data.new_kot) {
                        handleKOTPrint(data.new_kot);
                        if (data.data && data.data.items) {
                            setBillItems(data.data.items);
                        }
                    } else {
                        alert("No new items to send to Kitchen.");
                    }
                }
                else if (type === 'SAVE' || type === 'PRINT') {
                    // Mark table as PRINTED when Save & Print is clicked
                    if (selectedTableId) {
                        try {
                            const savedUser = localStorage.getItem('user');
                            const { token } = JSON.parse(savedUser);
                            await fetch(`${import.meta.env.VITE_API_URL}/tables/${selectedTableId}/mark-printed`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ running_amount: grandTotal })
                            });
                        } catch (e) { console.error('Mark printed error', e); }
                    }
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

    const handleKOTPrint = (kotData) => {
        if (!kotData || !kotData.items || kotData.items.length === 0) return;
        // Build items HTML
        const rowsHtml = kotData.items.map(item => `
            <tr>
                <td class="item-name">${item.name}</td>
                <td class="item-qty">x${item.quantity}</td>
            </tr>
        `).join('');

        const kotHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${kotData.kot_number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 80mm auto; margin: 4mm; }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            width: 72mm;
            padding: 4px;
        }
        .sep { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .sep-solid { border: none; border-top: 2px solid #000; margin: 6px 0; }
        .center { text-align: center; }
        .bold { font-weight: 900; }
        .big { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
        .table-label { font-size: 17px; font-weight: 900; }
        .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
        .item-name { font-weight: 700; font-size: 14px; padding: 5px 2px; vertical-align: middle; }
        .footer { text-align: center; font-size: 11px; margin-top: 8px; }
        @media print {
            body { width: 72mm; }
        }
    </style>
</head>
<body>
    <div class="center">
        <div class="big">${kotData.kot_number}</div>
        <div class="table-label">${tableNo ? '🪑 TABLE ' + tableNo : (orderMode === 'TAKEAWAY' ? '🛍 TAKEAWAY' : (orderMode === 'PARCEL' ? '📦 PARCEL' : (orderMode === 'DELIVERY' ? '🚚 DELIVERY' : (orderMode === 'PARTY' ? '🎉 PARTY' : '🏪 COUNTER'))))}</div>
    </div>
    <hr class="sep-solid">
    <div class="info-row"><span>Bill#</span><span>${billNumber}</span></div>
    <div class="info-row"><span>Date</span><span>${new Date(kotData.created_at).toLocaleString('en-IN', { hour12: true })}</span></div>
    ${captainName ? `<div class="info-row"><span>Captain</span><span>${captainName}</span></div>` : ''}
    ${persons ? `<div class="info-row"><span>Pax</span><span>${persons}</span></div>` : ''}
    <hr class="sep-solid">
    <table>
        <thead>
            <tr>
                <th style="text-align:left; font-size:11px; padding-bottom:3px;">ITEM</th>
                <th style="text-align:right; font-size:11px; padding-bottom:3px;">QTY</th>
            </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
    </table>
    <hr class="sep-solid">
    <div class="footer">*** KITCHEN COPY ***</div>
    <div class="footer" style="margin-top:4px; font-size:10px; color:#555;">RestoBoard KOT</div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
            alert('Popup blocked. Please allow popups for printing KOT.');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(kotHtml);
        printWindow.document.close();

        // Wait for resources to load, then print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            // Close the window automatically after print dialog closes
            printWindow.onafterprint = () => printWindow.close();
        };
    };

    const handleAllKotsPrint = (billData) => {
        if (!billData || !billData.kots || billData.kots.length === 0) return alert("No KOT items to print.");

        const allKotsHtml = billData.kots.map(kot => {
            const rowsHtml = kot.items.map(item => `
                <tr>
                    <td class="item-name">${item.name}</td>
                    <td class="item-qty">x${item.quantity}</td>
                </tr>
            `).join('');
            return `
            <div class="center bold" style="margin-top: 10px; font-size: 14px;">${kot.kot_number || 'KOT'}</div>
            <hr class="sep-solid">
            <table>
                <thead>
                    <tr><th style="text-align:left; font-size:11px;">ITEM</th><th style="text-align:right; font-size:11px;">QTY</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            `;
        }).join('');

        const kotHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"><title>All KOTs - ${(billData.bill_number && !billData.bill_number.startsWith('TEMP-')) ? billData.bill_number : 'Reprint'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; } @page { size: 80mm auto; margin: 4mm; } body { font-family: monospace; font-size: 13px; width: 72mm; padding: 4px; }
        .sep-solid { border: none; border-top: 2px solid #000; margin: 6px 0; } .center { text-align: center; } .bold { font-weight: 900; } .big { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; } .item-name { font-weight: 700; font-size: 14px; padding: 5px 2px; } .item-qty  { font-weight: 900; font-size: 16px; text-align: right; padding: 5px 2px; }
        @media print { body { width: 72mm; } }
    </style>
</head>
<body>
    <div class="center"><div class="big">ALL KOTs</div><div class="bold">TABLE: ${billData.table_no || tableNo || 'N/A'}</div></div>
    ${allKotsHtml}
    <hr class="sep-solid"><div class="center" style="font-size: 11px; margin-top: 10px;">Reprinted at ${new Date().toLocaleTimeString()}</div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(kotHtml);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); printWindow.onafterprint = () => printWindow.close(); };
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
        setCaptainName("");
        setWaiterName("");
        setDiscount(0);
        setDeliveryCharge(0);
        setContainerCharge(0);
        setBillItems([]);
        setStepProceeded(false);
        setPromoCode('');
        createNewBill();
    };

    const updateItemRate = (idx, newRate) => {
        const newItems = [...billItems];
        newItems[idx].unit_price = parseFloat(newRate) || 0;
        newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
        setBillItems(newItems);
        if (selectedTableId) updateTableLiveAmount(selectedTableId, newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0));
    };

    const updateItemQtyDirect = (idx, newQty) => {
        const newItems = [...billItems];
        newItems[idx].quantity = parseFloat(newQty) || 0;
        newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
        setBillItems(newItems);
        if (selectedTableId) updateTableLiveAmount(selectedTableId, newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0));
    };

    const handleTransferItem = (idx) => {
        setSelectedItemForAction(idx);
        // Open transfer form (bill must be loaded)
        if (!currentBillId) return;
        setShowTransferForm(true);
        setShowAlterForm(false);
        setShowReturnForm(false);
    };

    const handleReturnItem = (idx) => {
        // Just open the return panel focusing this item
        if (!currentBillId) return;
        setReturnQtys({ [idx]: 1 });
        setShowReturnForm(true);
        setShowAlterForm(false);
        setShowTransferForm(false);
    };

    const handleSplitBill = () => {
        if (billItems.length < 2) return alert("Need at least 2 items to split!");
        toggleExpandableForm('SPLIT');
    };

    // loadBillForAlter now defined above near handleBillSearch

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
            {/* Party Order Status Bubble */}
            {orderMode === 'PARTY_ORDER' && partyData && (
                <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: '10px 24px', borderRadius: '40px', boxShadow: '0 10px 30px rgba(79, 70, 229, 0.15)', border: '1.5px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: '20px', animation: 'slide-in-from-top-4 0.4s ease-out' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5' }}>
                        <Users2 size={18} />
                        <span style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>Party Order</span>
                    </div>
                    <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c' }}>
                        <CalendarClock size={16} />
                        <span style={{ fontWeight: 800, fontSize: '13px' }}>{new Date(partyData.delivery_date).toLocaleDateString()} at {partyData.delivery_time}</span>
                    </div>
                    <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                        <User size={16} />
                        <span style={{ fontWeight: 800, fontSize: '13px' }}>{partyData.customer_name}</span>
                    </div>
                </div>
            )}
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
                        <button type="button" className="nav-action-btn" onClick={() => navigate('/dashboard/self-service/table-select')} title="Select Table">
                            TABLE
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
                                        <input type="checkbox" checked={loyaltyEnabled} onChange={() => {
                                            const next = !loyaltyEnabled;
                                            setLoyaltyEnabled(next);
                                            localStorage.setItem('pos_loyalty_enabled', String(next));
                                        }} />
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

                    {/* KOT Search with dropdown */}
                    <div className="search-input-wrapper secondary-search" style={{ position: 'relative' }}>
                        <History size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="KOT Search"
                            value={kotSearchQuery}
                            onChange={(e) => { setKotSearchQuery(e.target.value); searchBills(e.target.value, 'OPEN'); setShowKotDropdown(true); }}
                            onFocus={() => { if (kotSearchQuery) setShowKotDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowKotDropdown(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && kotSearchResults.length > 0) {
                                    loadBillForAlter(kotSearchResults[0], 'LOAD');
                                }
                            }}
                        />
                        {showKotDropdown && kotSearchResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                                {kotSearchResults.map(b => (
                                    <button key={b._id}
                                        onMouseDown={() => loadBillForAlter(b, 'LOAD')}
                                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#1e293b' }}>{b.bill_number}</span>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>{b.table_no || b.type} · ₹{b.grand_total || 0}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bill No. Search with dropdown */}
                    <div className="search-input-wrapper secondary-search" style={{ position: 'relative' }}>
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Bill No."
                            value={billSearchQuery}
                            onChange={(e) => { setBillSearchQuery(e.target.value); searchBills(e.target.value); setShowBillDropdown(true); }}
                            onFocus={() => { if (billSearchQuery) setShowBillDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowBillDropdown(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && billSearchResults.length > 0) {
                                    loadBillForAlter(billSearchResults[0], 'LOAD');
                                }
                            }}
                        />
                        {billSearchLoading && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#94a3b8' }}>...</span>}
                        {showBillDropdown && billSearchResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '240px', overflowY: 'auto', marginTop: '4px' }}>
                                {billSearchResults.map(b => (
                                    <div key={b._id} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', cursor: 'pointer' }}
                                            onMouseDown={() => loadBillForAlter(b, 'LOAD')}>
                                            <span style={{ fontWeight: 800, fontSize: '12px', color: '#1e293b' }}>{b.bill_number}</span>
                                            <span style={{
                                                fontSize: '10px', padding: '1px 8px', borderRadius: '20px', fontWeight: 800,
                                                background: b.status === 'PAID' ? '#f0fdf4' : '#fffbeb',
                                                color: b.status === 'PAID' ? '#16a34a' : '#d97706'
                                            }}>{b.status}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', cursor: 'pointer' }}
                                            onMouseDown={() => loadBillForAlter(b, 'LOAD')}>
                                            {b.table_no || b.type} · ₹{b.grand_total || 0} · {b.items?.length || 0} items
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onMouseDown={() => loadBillForAlter(b, 'ALTER')}
                                                style={{ flex: 1, padding: '5px 0', fontSize: '10px', fontWeight: 800, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer' }}>
                                                ALTER
                                            </button>
                                            <button onMouseDown={() => loadBillForAlter(b, 'RETURN')}
                                                style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>
                                                RETURN
                                            </button>
                                            <button onMouseDown={() => loadBillForAlter(b, 'TRANSFER')}
                                                style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 800, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer' }}>
                                                TRANSFER
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                        {product.variations?.length > 0 && (
                                            <div className="absolute top-2 right-2 z-10 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20 uppercase tracking-tighter">
                                                <Layers size={10} className="inline mr-1" /> Multi-Size
                                            </div>
                                        )}
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
                        <div className="meta-icon-btn active" style={{ cursor: 'default', pointerEvents: 'none' }}>
                            <div className="icon-bg"><TableLogo size={18} /></div>
                            <span style={{ color: tableNo ? '#ea580c' : 'inherit', fontWeight: tableNo ? 900 : 'normal' }}>
                                {tableNo || 'TABLE'}
                            </span>
                        </div>
                        <div className="meta-icon-btn active" style={{ cursor: 'default', pointerEvents: 'none' }}>
                            <div className="icon-bg"><Users size={18} /></div>
                            <span style={{ color: persons ? '#ea580c' : 'inherit', fontWeight: persons ? 900 : 'normal' }}>
                                {persons ? `${persons} PAX` : 'PERSONS'}
                            </span>
                        </div>
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

                    {/* Captain Form Section */}
                    {showCaptainForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Select Captain</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                    {captains.map(cap => (
                                        <button
                                            key={cap._id}
                                            onClick={() => { setCaptainName(cap.name); setShowCaptainForm(false); }}
                                            className={`selection-card ${captainName === cap.name ? 'active' : ''}`}
                                            style={{
                                                padding: '8px',
                                                background: captainName === cap.name ? '#ea580c' : '#f8fafc',
                                                color: captainName === cap.name ? '#fff' : '#1e293b',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}
                                        >
                                            {cap.name}
                                        </button>
                                    ))}
                                    {captains.length === 0 && <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8' }}>No captains found.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Waiter Form Section */}
                    {showWaiterForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Select Waiter</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                    {waiters.map(wait => (
                                        <button
                                            key={wait._id}
                                            onClick={() => { setWaiterName(wait.name); setShowWaiterForm(false); }}
                                            className={`selection-card ${waiterName === wait.name ? 'active' : ''}`}
                                            style={{
                                                padding: '8px',
                                                background: waiterName === wait.name ? '#ea580c' : '#f8fafc',
                                                color: waiterName === wait.name ? '#fff' : '#1e293b',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}
                                        >
                                            {wait.name}
                                        </button>
                                    ))}
                                    {waiters.length === 0 && <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8' }}>No waiters found.</p>}
                                </div>
                            </div>
                        </div>
                    )}



                    {/* ── ALTER Form ── */}
                    {showAlterForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                {!currentBillId ? (
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                                        Search a bill by number above to load it for editing.
                                    </p>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>Editing: {billNumber}</span>
                                            <button onClick={saveAlteredBill} disabled={paymentLoading}
                                                style={{ padding: '6px 16px', fontSize: '11px', fontWeight: 900, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 3px 8px rgba(37,99,235,0.3)' }}>
                                                {paymentLoading ? 'Saving...' : '✓ SAVE ALTERATIONS'}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#64748b' }}>Add/remove items from the bill panel below. Click SAVE ALTERATIONS when done.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── RETURN Form ── */}
                    {showReturnForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                {!currentBillId || billItems.length === 0 ? (
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                                        Search a bill above to load items for return.
                                    </p>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>Return Items — Bill: {billNumber}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                            {billItems.map((item, idx) => (
                                                <div key={idx} style={{ background: '#fef2f2', borderRadius: '8px', padding: '6px 10px', border: '1px solid #fecaca' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{item.name}</span>
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>Max: {item.quantity}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 6px' }}>
                                                            <button onClick={() => setReturnQtys(q => ({ ...q, [idx]: Math.max(0, (q[idx] || 0) - 1) }))}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>−</button>
                                                            <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 800 }}>{returnQtys[idx] || 0}</span>
                                                            <button onClick={() => setReturnQtys(q => ({ ...q, [idx]: Math.min(item.quantity, (q[idx] || 0) + 1) }))}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>+</button>
                                                        </div>
                                                        <input placeholder="Reason" value={returnReasons[idx] || ''}
                                                            onChange={e => setReturnReasons(r => ({ ...r, [idx]: e.target.value }))}
                                                            style={{ flex: 1, fontSize: '11px', padding: '4px 8px', border: '1px solid #fecaca', borderRadius: '6px', outline: 'none' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={handleInlineReturn}
                                            style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '12px', fontWeight: 900, background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 3px 8px rgba(220,38,38,0.3)' }}>
                                            PROCESS RETURN
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TRANSFER Form ── */}
                    {showTransferForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                {!currentBillId || billItems.length === 0 ? (
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                                        Search a bill above, then select items and a destination table.
                                    </p>
                                ) : !transferTargetTable ? (
                                    <>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', marginBottom: '8px' }}>Transfer Items — from Bill: {billNumber}</div>
                                        {/* Step 1: pick qty per item */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '130px', overflowY: 'auto', marginBottom: '8px' }}>
                                            {billItems.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', padding: '5px 10px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', flex: 1 }}>{item.name} (x{item.quantity})</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '2px 6px' }}>
                                                        <button onClick={() => setTransferItemSel(s => ({ ...s, [idx]: Math.max(0, (s[idx] || 0) - 1) }))}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>−</button>
                                                        <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 800 }}>{transferItemSel[idx] || 0}</span>
                                                        <button onClick={() => setTransferItemSel(s => ({ ...s, [idx]: Math.min(item.quantity, (s[idx] || 0) + 1) }))}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>+</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Step 2: pick destination table */}
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Select destination table (must be OCCUPIED or PRINTED):</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                                            {tables.filter(t => (t.status === 'OCCUPIED' || t.status === 'PRINTED') && t.table_no !== tableNo && t.table_number !== tableNo).map(t => (
                                                <button key={t._id}
                                                    onClick={() => handleTransferToTable(t)}
                                                    style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: t.status === 'PRINTED' ? '#f0fdf4' : '#fffbeb', color: t.status === 'PRINTED' ? '#15803d' : '#92400e', borderRadius: '8px', border: `1.5px solid ${t.status === 'PRINTED' ? '#86efac' : '#fde68a'}`, cursor: 'pointer', fontSize: '11px', fontWeight: 800, transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                                >
                                                    <TableLogo size={16} />
                                                    <span style={{ marginTop: '2px' }}>{t.table_number || t.table_no}</span>
                                                </button>
                                            ))}
                                            {tables.filter(t => (t.status === 'OCCUPIED' || t.status === 'PRINTED') && t.table_no !== tableNo && t.table_number !== tableNo).length === 0 && (
                                                <p style={{ gridColumn: '1/-1', fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>No other active tables found.</p>
                                            )}
                                        </div>
                                    </>
                                ) : null}
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
                                        {orderMode === 'PARTY_ORDER' ? (
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItemQtyDirect(idx, e.target.value)}
                                                style={{ width: '45px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', fontSize: '12px', fontWeight: 800 }}
                                            />
                                        ) : (
                                            <>
                                                <button onClick={() => updateItemQuantity(item.product_id, -1)}><Minus size={12} /></button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateItemQuantity(item.product_id, 1)}><Plus size={12} /></button>
                                            </>
                                        )}
                                    </div>
                                    {showRateColumn && (
                                        <div className="item-rate">
                                            {orderMode === 'PARTY_ORDER' ? (
                                                <input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={e => updateItemRate(idx, e.target.value)}
                                                    style={{ width: '55px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', fontSize: '12px', fontWeight: 800 }}
                                                />
                                            ) : (
                                                item.is_complementary ? 0 : item.unit_price
                                            )}
                                        </div>
                                    )}
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

                                {showLoyaltyForm && loyaltyEnabled && (
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
                                    {loyaltyEnabled && (
                                        <button className={`control-btn ${showLoyaltyForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('LOYALTY')}>
                                            <Gift size={15} /> Loyalty
                                        </button>
                                    )}
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
                                    partialAllowed={orderMode === 'PARTY_ORDER'}
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
                {variationModalProduct && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in duration-200">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select Size / Type</h3>
                                    <p className="text-xs text-indigo-600 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                        {variationModalProduct.name}
                                    </p>
                                </div>
                                <button onClick={() => setVariationModalProduct(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {(variationModalProduct.variations || []).map((v, i) => (
                                    <button
                                        key={i}
                                        onClick={() => addToBill(variationModalProduct, v)}
                                        className="w-full flex items-center justify-between p-5 border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group hover:shadow-lg hover:shadow-indigo-500/10"
                                    >
                                        <div className="text-left">
                                            <div className="font-black text-lg text-slate-800 group-hover:text-indigo-700 tracking-tight">{v.name}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1.5">Variation Price</div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                                                ₹{(variationModalProduct.selling_price || 0) + (v.amount || 0)}
                                            </div>
                                            {(v.amount > 0) && <div className="text-[10px] text-slate-400 font-bold">+₹{v.amount} extra</div>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-slate-50 flex justify-center border-t border-slate-100">
                                <button onClick={() => setVariationModalProduct(null)} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-rose-500 transition-colors">
                                    <X size={14} /> Close & Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
