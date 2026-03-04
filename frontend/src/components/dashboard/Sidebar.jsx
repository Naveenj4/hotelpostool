import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard, PlusCircle, Box, Layers, Database, FileText,
    BarChart3, Settings, LogOut, Utensils, Store, Shield, Tag,
    Users, Pocket, UserCircle, User, Book, ShoppingCart, Wallet,
    History, BarChart, Grid, ChevronDown, ChevronRight, Calculator,
    PieChart, List, CreditCard, Landmark, Printer, ChefHat, Lock, Globe,
    TrendingUp, TrendingDown
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
            label: "Admin Dashboard",
            icon: <Shield size={20} />,
            pageKey: "admin_dashboard",
            subItems: [
                { label: "Sales Bill", route: "/dashboard/self-service/billing", icon: <PlusCircle size={18} /> },
                { label: "Purchase Bill", route: "/dashboard/self-service/purchase", icon: <ShoppingCart size={18} /> },
                { label: "Voucher", route: "/dashboard/self-service/vouchers", icon: <Wallet size={18} /> }
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
                { label: "Captain", route: "/dashboard/self-service/captains", icon: <Pocket size={18} /> },
                { label: "Waiter", route: "/dashboard/self-service/waiters", icon: <UserCircle size={18} /> },
                { label: "Ledger", route: "/dashboard/self-service/ledgers", icon: <Book size={18} /> }
            ]
        },
        {
            label: "Report",
            icon: <BarChart size={20} />,
            route: "/dashboard/self-service/advanced-reports",
            pageKey: "advanced_reports"
        },
        {
            label: "Sales Summary",
            icon: <PieChart size={20} />,
            pageKey: "sales_summary",
            subItems: [
                { label: "Day Wise", route: "/dashboard/self-service/reports/sales/day", icon: <List size={18} /> },
                { label: "Month Wise", route: "/dashboard/self-service/reports/sales/month", icon: <List size={18} /> },
                { label: "Item Wise", route: "/dashboard/self-service/reports/sales/item", icon: <List size={18} /> },
                { label: "Category Wise", route: "/dashboard/self-service/reports/sales/category", icon: <List size={18} /> }
            ]
        },
        {
            label: "Purchase Summary",
            icon: <History size={20} />,
            pageKey: "purchase_summary",
            subItems: [
                { label: "Day Wise", route: "/dashboard/self-service/reports/purchase/day", icon: <List size={18} /> },
                { label: "Supplier Wise", route: "/dashboard/self-service/reports/purchase/supplier", icon: <Users size={18} /> }
            ]
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
                { label: "Cash Balance", route: "/dashboard/self-service/accounts/cash", icon: <Wallet size={18} /> },
                { label: "Bank Balance", route: "/dashboard/self-service/accounts/bank", icon: <Landmark size={18} /> }
            ]
        },
        {
            label: "Settings",
            icon: <Settings size={20} />,
            pageKey: "settings",
            subItems: [
                { label: "General", route: "/dashboard/self-service/settings", icon: <Settings size={18} /> },
                { label: "Printer", route: "/dashboard/self-service/settings/printer", icon: <Printer size={18} /> },
                { label: "Counter", route: "/dashboard/self-service/counters", icon: <Store size={18} /> },
                { label: "Kitchen", route: "/dashboard/self-service/settings/kitchen", icon: <ChefHat size={18} /> },
                { label: "User Rights", route: "/dashboard/self-service/access-control", icon: <Lock size={18} /> },
                { label: "Order Integration", route: "/dashboard/self-service/settings/integration", icon: <Globe size={18} /> }
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
                        className={`nav-item ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
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
