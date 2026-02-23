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
    Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/dashboard/Dashboard.css';

const Sidebar = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Close sidebar on navigation on mobile
    useEffect(() => {
        if (window.innerWidth <= 768 && onMobileClose) {
            onMobileClose();
        }
    }, [location, onMobileClose]);

    const menuItems = [
        {
            label: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            route: "/dashboard/self-service/home",
            roles: ["ADMIN", "BILLING", "OWNER"]
        },
        {
            label: "New Bill",
            icon: <PlusCircle size={20} />,
            route: "/dashboard/self-service/billing",
            roles: ["ADMIN", "BILLING", "OWNER"]
        },
        {
            label: "Bills & Sales",
            icon: <FileText size={20} />,
            route: "/dashboard/self-service/bills-sales",
            roles: ["ADMIN", "OWNER", "BILLING"]
        },
        {
            label: "Products",
            icon: <Box size={20} />,
            route: "/dashboard/self-service/products",
            roles: ["ADMIN", "OWNER"]
        },
        {
            label: "Categories",
            icon: <Layers size={20} />,
            route: "/dashboard/self-service/categories",
            roles: ["ADMIN", "OWNER"]
        },
        { // Added Counters specifically
            label: "Counters",
            icon: <Store size={20} />,
            route: "/dashboard/self-service/counters",
            roles: ["ADMIN", "OWNER"]
        },
        {
            label: "Stock",
            icon: <Database size={20} />,
            route: "/dashboard/self-service/stock",
            roles: ["ADMIN", "OWNER"]
        },
        {
            label: "Reports",
            icon: <BarChart3 size={20} />,
            route: "/dashboard/self-service/reports",
            roles: ["ADMIN", "OWNER"]
        },
        {
            label: "Settings",
            icon: <Settings size={20} />,
            route: "/dashboard/self-service/settings",
            roles: ["ADMIN", "OWNER"]
        }
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'show' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <Utensils size={24} color="white" />
                </div>
                {!isCollapsed && <span className="brand-name">RestoBoard</span>}
            </div>

            <nav className="sidebar-nav">
                {filteredMenu.map((item, index) => (
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
