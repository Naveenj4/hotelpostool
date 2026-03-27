import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard, PlusCircle, Box, Layers, Database, FileText,
    BarChart3, Settings, LogOut, Utensils, Store, Shield, Tag,
    Users, Pocket, UserCircle, User, Book, ShoppingCart, Wallet,
    History, BarChart, Grid, ChevronDown, ChevronRight, Calculator,
    PieChart, List, CreditCard, Landmark, Printer, ChefHat, Lock, Globe,
    TrendingUp, TrendingDown, Package, Monitor, Receipt, LayoutGrid, Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/dashboard/Dashboard.css';

const Sidebar = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const { user, logout, hasPageAccess, isAdmin } = useAuth();
    const [expandedMenus, setExpandedMenus] = useState({});

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
            label: "Sales Bill",
            icon: <PlusCircle size={20} />,
            route: "/dashboard/self-service/table-select",
            pageKey: "billing"
        },
        {
            label: "Entry",
            icon: <Shield size={20} />,
            pageKey: "admin_dashboard",
            subItems: [
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
                { label: "Ledger", route: "/dashboard/self-service/ledgers/create", icon: <User size={18} /> },
                { label: "Ledger Group", route: "/dashboard/self-service/group-master", icon: <Layers size={18} /> }
            ]
        },
        {
            label: "Report",
            icon: <BarChart size={20} />,
            route: "/dashboard/self-service/advanced-reports",
            pageKey: "advanced_reports"
        },
        {
            label: "Outstanding",
            icon: <CreditCard size={20} />,
            pageKey: "outstanding",
            subItems: [
                { label: "Customer Wise", route: "/dashboard/self-service/outstanding/customers", icon: <User size={18} /> },
                { label: "Supplier Wise", route: "/dashboard/self-service/outstanding/suppliers", icon: <Users size={18} /> },
                { label: "Receivable", route: "/dashboard/self-service/outstanding/receivable", icon: <TrendingUp size={18} /> },
                { label: "Payable", route: "/dashboard/self-service/outstanding/payable", icon: <TrendingDown size={18} /> }
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
            label: "Counter",
            icon: <Store size={20} />,
            route: "/dashboard/self-service/counters",
            pageKey: "counters"
        },
        {
            label: "Printer",
            icon: <Printer size={20} />,
            pageKey: "settings",
            subItems: [
                { label: "Printer Management", route: "/dashboard/self-service/printer-management", icon: <Printer size={18} /> },
                { label: "Printer Display", route: "/dashboard/self-service/printer-display", icon: <Monitor size={18} /> }
            ]
        },
        {
            label: "Kitchen",
            icon: <ChefHat size={20} />,
            pageKey: "settings",
            subItems: [
                { label: "Kitchen Management", route: "/dashboard/self-service/kitchen-management", icon: <ChefHat size={18} /> },
                { label: "Kitchen Display", route: "/dashboard/self-service/kitchen-display", icon: <Monitor size={18} /> }
            ]
        },
        {
            label: "Settings",
            icon: <Settings size={20} />,
            pageKey: "settings",
            subItems: [
                { label: "General", route: "/dashboard/self-service/settings", icon: <Settings size={18} /> },
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
        }
    ];

    const renderMenuItem = (item, isSub = false) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedMenus[item.label];
        const isActive = location.pathname === item.route || (hasSubItems && item.subItems.some(sub => location.pathname === sub.route));

        if (!hasPageAccess(item.pageKey) && !isSub) return null;

        return (
            <div key={item.label} className="menu-group">
                {hasSubItems ? (
                    <div
                        className={`nav-item ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''} ${isSub ? 'sub-nav-item' : ''}`}
                        onClick={() => toggleMenu(item.label)}
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
                        className={`nav-item ${location.pathname === item.route ? 'active' : ''} ${isSub ? 'sub-nav-item' : ''}`}
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
                <button onClick={logout} className="logout-btn">
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
