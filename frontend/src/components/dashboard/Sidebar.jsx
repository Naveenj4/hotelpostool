import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    PlusCircle,
    Box,
    Layers,
    Database,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Utensils,
    Store,
    Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/dashboard/Dashboard.css';

const Sidebar = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const { user, logout, hasPageAccess, isAdmin } = useAuth();

    // Close sidebar on navigation on mobile
    useEffect(() => {
        if (window.innerWidth <= 768 && onMobileClose) {
            onMobileClose();
        }
    }, [location.pathname]);

    const menuItems = [
        {
            label: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            route: "/dashboard/self-service/home",
            pageKey: "dashboard"
        },
        {
            label: "New Bill",
            icon: <PlusCircle size={20} />,
            route: "/dashboard/self-service/billing",
            pageKey: "billing"
        },
        {
            label: "Bills & Sales",
            icon: <FileText size={20} />,
            route: "/dashboard/self-service/bills-sales",
            pageKey: "bills_sales"
        },
        {
            label: "Products",
            icon: <Box size={20} />,
            route: "/dashboard/self-service/products",
            pageKey: "products"
        },
        {
            label: "Categories",
            icon: <Layers size={20} />,
            route: "/dashboard/self-service/categories",
            pageKey: "categories"
        },
        {
            label: "Counters",
            icon: <Store size={20} />,
            route: "/dashboard/self-service/counters",
            pageKey: "counters"
        },
        {
            label: "Stock",
            icon: <Database size={20} />,
            route: "/dashboard/self-service/stock",
            pageKey: "stock"
        },
        {
            label: "Reports",
            icon: <BarChart3 size={20} />,
            route: "/dashboard/self-service/reports",
            pageKey: "reports"
        },
        {
            label: "Settings",
            icon: <Settings size={20} />,
            route: "/dashboard/self-service/settings",
            pageKey: "settings"
        }
    ];

    // Admin-only items (Role & User Management)
    const adminItems = [
        {
            label: "Access Control",
            icon: <Shield size={20} />,
            route: "/dashboard/self-service/access-control",
            pageKey: "access_control"
        }
    ];

    // Filter menu based on permissions
    const filteredMenu = menuItems.filter(item => hasPageAccess(item.pageKey));

    // Add admin-only items for OWNER/ADMIN
    const finalMenu = isAdmin() ? [...filteredMenu, ...adminItems] : filteredMenu;

    return (
        <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'show' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <Utensils size={24} color="white" />
                </div>
                {!isCollapsed && <span className="brand-name">RestoBoard</span>}
            </div>

            <nav className="sidebar-nav">
                {finalMenu.map((item, index) => (
                    <Link
                        key={index}
                        to={item.route}
                        className={`nav-item ${location.pathname === item.route ? 'active' : ''} ${item.label === 'New Bill' ? 'nav-cta' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="nav-item logout-btn">
                    <span className="nav-icon"><LogOut size={20} /></span>
                    {!isCollapsed && <span className="nav-label">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
