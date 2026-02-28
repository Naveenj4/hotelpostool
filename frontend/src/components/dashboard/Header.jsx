import { useState, useEffect } from 'react';
import { Menu, User, Calendar, Clock, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar, restaurantName }) => {
    const { user, logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <header className="dashboard-header">
            <div className="header-left">
                <button className="icon-btn menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="restaurant-badge">
                    <span className="restaurant-name">{restaurantName || "RestoSaaS Partner"}</span>
                </div>
            </div>

            <div className="header-center">
                <div className="date-time-display">
                    <div className="display-item">
                        <Calendar size={16} />
                        <span>{formatDate(currentTime)}</span>
                    </div>
                    <div className="display-item">
                        <Clock size={16} />
                        <span>{formatTime(currentTime)}</span>
                    </div>
                </div>
            </div>

            <div className="header-right">
                <button className="icon-btn" title="Notifications">
                    <Bell size={20} />
                </button>

                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                    <div className="user-avatar">
                        <User size={20} />
                    </div>
                </div>

                <div className="header-divider"></div>

                <button
                    className="icon-btn logout-header-btn"
                    onClick={logout}
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
