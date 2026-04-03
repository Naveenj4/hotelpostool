import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard, PlusCircle, Box, Layers, Database, FileText,
    BarChart3, Settings, LogOut, Utensils, Store, Shield, Tag,
    Users, Pocket, UserCircle, User, Book, ShoppingCart, Wallet,
    History, BarChart, Grid, ChevronDown, ChevronRight, Calculator,
    PieChart, List, CreditCard, Landmark, Printer, ChefHat, Lock, Globe,
    TrendingUp, TrendingDown, Package, Monitor, Receipt, LayoutGrid, Hash,
    MinusCircle, AlertTriangle, ArrowUpRight, Activity, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/dashboard/Dashboard.css';

const Sidebar = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, hasPageAccess, isAdmin } = useAuth();
    const [expandedMenus, setExpandedMenus] = useState({});

    const logoutWithBackup = async () => {
        const autoBackup = localStorage.getItem('auto_backup_on_close') === 'true';
        if (autoBackup) {
            try {
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const { token } = JSON.parse(savedUser);
                    await fetch(`${import.meta.env.VITE_API_URL}/settings/backup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ backupPath: localStorage.getItem('backup_path') || 'C:/RestoBoard/Backups' })
                    });
                }
            } catch (err) { console.error("Auto backup failed", err); }
        }
        logout();
    };

    // Close sidebar on navigation on mobile
    useEffect(() => {
        if (window.innerWidth <= 768 && onMobileClose) {
            onMobileClose();
        }
    }, [location.pathname]);

    const toggleMenu = (label) => {
        setExpandedMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const menuStructure = [
        {
            label: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            route: "/dashboard/self-service/home",
            pageKey: "dashboard"
        },
        {
            label: "Entry",
            icon: <Shield size={20} />,
            pageKey: "admin_dashboard",
            subItems: [
                {
                    label: "Sales Bill",
                    icon: <PlusCircle size={18} />,
                    route: "/dashboard/self-service/table-select",
                    pageKey: "billing"
                },
                { label: "Purchase Entry", route: "/dashboard/self-service/purchase", icon: <ShoppingCart size={18} /> },
                {
                    label: "Voucher",
                    icon: <Wallet size={18} />,
                    pageKey: "vouchers",
                    subItems: [
                        { label: "Receipt Entry", route: "/dashboard/self-service/receipts", icon: <FileText size={18} /> },
                        { label: "Payment Entry", route: "/dashboard/self-service/payments", icon: <CreditCard size={18} /> },
                        { label: "Voucher Master", route: "/dashboard/self-service/vouchers", icon: <Wallet size={18} /> }
                    ]
                }
            ]
        },
        {
            label: "Master",
            icon: <Database size={20} />,
            pageKey: "master",
            subItems: [
                { label: "Item", route: "/dashboard/self-service/products", icon: <Box size={18} /> },
                { label: "Category", route: "/dashboard/self-service/categories", icon: <Layers size={18} /> },
                { label: "Brand", route: "/dashboard/self-service/brands", icon: <Tag size={18} /> },
                { label: "Table", route: "/dashboard/self-service/tables", icon: <Grid size={18} /> },
                { label: "Table Type", route: "/dashboard/self-service/table-types", icon: <Layers size={18} /> },
                { label: "Captain/Waiter", route: "/dashboard/self-service/staff", icon: <Users size={18} /> },
                { label: "Ledger", route: "/dashboard/self-service/ledgers", icon: <User size={18} /> },
                { label: "Ledger Group", route: "/dashboard/self-service/group-master", icon: <Layers size={18} /> }
            ]
        },
        {
            label: "Report",
            icon: <BarChart size={20} />,
            pageKey: "advanced_reports",
            route: "/dashboard/self-service/reports?category=stock&filter=all",
            subItems: [
                {
                    label: "Stock Report",
                    icon: <Package size={18} />,
                    subItems: [
                        { label: "All Stock", route: "/dashboard/self-service/reports?category=stock&filter=all", icon: <Grid size={16} /> },
                        { label: "Negative Stock", route: "/dashboard/self-service/reports?category=stock&filter=negative", icon: <TrendingDown size={16} /> },
                        { label: "Nil Stock", route: "/dashboard/self-service/reports?category=stock&filter=nil", icon: <MinusCircle size={16} /> },
                        { label: "Below Minimum Stock", route: "/dashboard/self-service/reports?category=stock&filter=min", icon: <AlertTriangle size={16} /> },
                        { label: "Maximum Stock", route: "/dashboard/self-service/reports?category=stock&filter=max", icon: <ArrowUpRight size={16} /> },
                        { label: "Moving Item", route: "/dashboard/self-service/reports?category=stock&filter=moving", icon: <Activity size={16} /> },
                        { label: "Non Moving Item", route: "/dashboard/self-service/reports?category=stock&filter=non-moving", icon: <Box size={16} /> },
                        { label: "Transaction Item", route: "/dashboard/self-service/reports?category=stock&filter=transaction", icon: <List size={16} /> }
                    ]
                },
                {
                    label: "Sales Summary",
                    icon: <BarChart3 size={18} />,
                    subItems: [
                        { label: "Day Wise", route: "/dashboard/self-service/reports?category=sales&filter=day", icon: <Calendar size={16} /> },
                        { label: "Month Wise", route: "/dashboard/self-service/reports?category=sales&filter=month", icon: <PieChart size={16} /> },
                        { label: "Item Wise", route: "/dashboard/self-service/reports?category=sales&filter=item", icon: <Box size={16} /> },
                        { label: "Group Wise", route: "/dashboard/self-service/reports?category=sales&filter=group", icon: <Layers size={16} /> },
                        { label: "Transaction Wise", route: "/dashboard/self-service/reports?category=sales&filter=transaction", icon: <FileText size={16} /> },
                        { label: "Profit Audit", route: "/dashboard/self-service/reports?category=sales&filter=profit", icon: <TrendingUp size={16} /> },
                        { label: "Brand Wise", route: "/dashboard/self-service/reports?category=sales&filter=brand", icon: <Tag size={16} /> },
                        { label: "Captain Wise", route: "/dashboard/self-service/reports?category=sales&filter=captain", icon: <UserCircle size={16} /> },
                        { label: "Agent Wise", route: "/dashboard/self-service/reports?category=sales&filter=agent", icon: <Users size={16} /> }
                    ]
                },
                {
                    label: "Purchase Summary",
                    icon: <ShoppingCart size={18} />,
                    subItems: [
                        { label: "Day Wise", route: "/dashboard/self-service/reports?category=purchase&filter=day", icon: <Calendar size={16} /> },
                        { label: "Month Wise", route: "/dashboard/self-service/reports?category=purchase&filter=month", icon: <PieChart size={16} /> },
                        { label: "Item Wise", route: "/dashboard/self-service/reports?category=purchase&filter=item", icon: <Box size={16} /> },
                        { label: "Group Wise", route: "/dashboard/self-service/reports?category=purchase&filter=group", icon: <Layers size={16} /> },
                        { label: "Brand Wise", route: "/dashboard/self-service/reports?category=purchase&filter=brand", icon: <Tag size={16} /> },
                        { label: "Supplier Wise", route: "/dashboard/self-service/reports?category=purchase&filter=supplier", icon: <Users size={16} /> }
                    ]
                },
                {
                    label: "Outstanding",
                    icon: <CreditCard size={18} />,
                    subItems: [
                        { label: "Customer Wise", route: "/dashboard/self-service/reports?category=outstanding&filter=customer", icon: <User size={16} /> },
                        { label: "Supplier Wise", route: "/dashboard/self-service/reports?category=outstanding&filter=supplier", icon: <Users size={16} /> },
                        { label: "Receivable", route: "/dashboard/self-service/reports?category=outstanding&filter=receivable", icon: <TrendingUp size={16} /> },
                        { label: "Payable", route: "/dashboard/self-service/reports?category=outstanding&filter=payable", icon: <TrendingDown size={16} /> }
                    ]
                }
            ]
        },
        {
            label: "Accounts",
            icon: <Calculator size={20} />,
            pageKey: "accounts",
            subItems: [
                { label: "Daybook", route: "/dashboard/self-service/accounts/daybook", icon: <List size={18} /> },
                { label: "Ledger Statement", route: "/dashboard/self-service/ledger-statement", icon: <FileText size={18} /> },
                { label: "Cash & Bank", route: "/dashboard/self-service/accounts/cash-bank", icon: <Landmark size={18} /> }
            ]
        },
        {
            label: "Settings",
            icon: <Settings size={20} />,
            pageKey: "settings",
            subItems: [
                { label: "General", route: "/dashboard/self-service/settings", icon: <Settings size={18} /> },
                { label: "Counter", route: "/dashboard/self-service/counters", icon: <Store size={18} />, pageKey: "counters" },
                {
                    label: "Kitchen & Printers",
                    icon: <ChefHat size={18} />,
                    pageKey: "settings",
                    subItems: [
                        { label: "Management", route: "/dashboard/self-service/kitchen-management", icon: <ChefHat size={18} /> },
                        { label: "Kitchen Display", route: "/dashboard/self-service/kitchen-display", icon: <Monitor size={18} /> },
                        { label: "Printer Feed", route: "/dashboard/self-service/printer-display", icon: <Printer size={18} /> }
                    ]
                },
                { label: "User Rights", route: "/dashboard/self-service/access-control", icon: <Lock size={18} /> },
                { label: "Order Integration", route: "/dashboard/self-service/settings/integration", icon: <Globe size={18} /> },
                {
                    label: "Bill",
                    icon: <Receipt size={18} />,
                    pageKey: "settings",
                    subItems: [
                        { label: "Bill Series", route: "/dashboard/self-service/settings?tab=bill_numbering", icon: <Hash size={18} /> },
                        { label: "Generated Bills", route: "/dashboard/self-service/settings?tab=bill_history", icon: <List size={18} /> }
                    ]
                }
            ]
        },
        {
            label: "Profile",
            icon: <UserCircle size={20} />,
            route: "/dashboard/self-service/profile",
            pageKey: "settings"
        }
    ];

    const renderMenuItem = (item, isSub = false) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedMenus[item.label];
        const itemPath = item.route ? item.route.split('?')[0] : '';

        // Exact match including search params if it's a report link
        const isExactMatch = item.route ? (location.pathname + location.search) === item.route : false;
        const isPathMatch = location.pathname === itemPath;

        const isActive = isExactMatch || (isPathMatch && !item.route?.includes('?')) || (hasSubItems && item.subItems.some(sub => {
            const subPath = sub.route ? sub.route.split('?')[0] : '';
            const subExact = sub.route ? (location.pathname + location.search) === sub.route : false;
            return subExact || (location.pathname === subPath && !sub.route?.includes('?'));
        }));

        // Enhanced visibility check: Show item if it has access OR if any of its children have access
        const hasAccess = item.pageKey ? hasPageAccess(item.pageKey) : true;
        const hasVisibleChildren = hasSubItems && item.subItems.some(sub => {
            if (sub.pageKey) return hasPageAccess(sub.pageKey);
            return true; // Default sub-items without keys to visible
        });

        if (!isSub && !hasAccess && !hasVisibleChildren) return null;

        return (
            <div key={item.label} className="menu-group">
                {hasSubItems ? (
                    <div
                        className={`nav-item ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''} ${isSub ? 'sub-nav-item' : ''}`}
                        onClick={() => {
                            toggleMenu(item.label);
                            if (item.route) {
                                navigate(item.route);
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        {!isCollapsed && (
                            <span className="nav-arrow" style={{ marginLeft: 'auto' }}>
                                <ChevronDown size={14} />
                            </span>
                        )}
                    </div>
                ) : (
                    <Link
                        to={item.route}
                        className={`nav-item ${location.pathname === itemPath ? 'active' : ''} ${isSub ? 'sub-nav-item' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    </Link>
                )}

                {hasSubItems && isExpanded && !isCollapsed && (
                    <div className="sub-menu">
                        {item.subItems.map(sub => renderMenuItem(sub, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'show' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <Utensils size={24} color="white" />
                </div>
                {!isCollapsed && <span className="brand-name">RestoBoard</span>}
            </div>

            <nav className="sidebar-nav">
                {menuStructure.map(item => renderMenuItem(item))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logoutWithBackup} className="logout-btn">
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
