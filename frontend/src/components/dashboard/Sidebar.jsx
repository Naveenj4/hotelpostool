import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, memo } from 'react';
import {
    LayoutDashboard, PlusCircle, Box, Layers, Database, FileText,
    BarChart3, Settings, LogOut, Utensils, Store, Shield, Tag,
    Users, Pocket, UserCircle, User, Book, ShoppingCart, Wallet,
    History, BarChart, Grid, ChevronDown, ChevronRight, Calculator,
    PieChart, List, CreditCard, Landmark, Printer, ChefHat, Lock, Globe,
    TrendingUp, TrendingDown, Package, Monitor, Receipt, LayoutGrid, Hash,
    MinusCircle, AlertTriangle, ArrowUpRight, Activity, Calendar, Ticket, Gift, Workflow
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/dashboard/Dashboard.css';

const Sidebar = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, hasPageAccess, hasModuleAccess, isAdmin } = useAuth();
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
                        body: JSON.stringify({ backupPath: localStorage.getItem('backup_path') || 'C:/Yugam/Backups' })
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

    const menuStructure = useMemo(() => [
        {
            label: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            route: "/dashboard/self-service/home",
            pageKey: "dashboard",
            module: "dashboard"
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
                { label: "Table", route: "/dashboard/self-service/tables", icon: <Grid size={18} />, module: "table" },
                { label: "Table Type", route: "/dashboard/self-service/table-types", icon: <Layers size={18} />, module: "table" },
                { label: "Captain/Waiter", route: "/dashboard/self-service/staff", icon: <Users size={18} />, module: "staff" },
                { label: "Ledger", route: "/dashboard/self-service/ledgers", icon: <User size={18} /> },
                { label: "Ledger Group", route: "/dashboard/self-service/group-master", icon: <Layers size={18} /> }
            ]
        },
        {
            label: "Report",
            icon: <BarChart size={20} />,
            pageKey: "advanced_reports",
            route: "/dashboard/self-service/reports?category=stock&filter=all",
            module: "reports"
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
                { label: "Counter", route: "/dashboard/self-service/counters", icon: <Store size={18} />, pageKey: "counters", module: "counter" },
                {
                    label: "Kitchen & Printers",
                    icon: <ChefHat size={18} />,
                    pageKey: "settings",
                    subItems: [
                        { label: "Management", route: "/dashboard/self-service/kitchen-management", icon: <ChefHat size={18} />, module: "printer" },
                        { label: "Kitchen Display", route: "/dashboard/self-service/kitchen-display", icon: <Monitor size={18} />, module: "kitchen" },
                        { label: "Printer Feed", route: "/dashboard/self-service/printer-display", icon: <Printer size={18} />, module: "printer" }
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
                },
                {
                    label: "Extra Modules",
                    icon: <Layers size={18} />,
                    route: "/dashboard/self-service/extra-modules",
                    pageKey: "extra_modules"
                }
            ]
        },
        {
            label: "Profile",
            icon: <UserCircle size={20} />,
            route: "/dashboard/self-service/profile",
            pageKey: "settings"
        }
    ], []);

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

        // Module visibility check
        const isModuleAvailable = item.module ? hasModuleAccess(item.module) : true;
        if (!isModuleAvailable) return null;

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
                        {item.subItems.map(subItem => {
                            const isSubModuleAvailable = subItem.module ? hasModuleAccess(subItem.module) : true;
                            if (!isSubModuleAvailable) return null;
                            return renderMenuItem(subItem, true);
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'show' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <img src="/logo.jpeg" alt="Yugam" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                </div>
                {!isCollapsed && <span className="brand-name" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400, letterSpacing: '0.02em', fontSize: '1.2rem' }}>Yugam Software</span>}
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

export default memo(Sidebar);
