import { useState, useEffect, memo } from 'react';
import { Menu, User, Calendar, Clock, Bell, LogOut, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TimeDisplay = memo(() => {
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
        <div className="date-time-display">
            <div className="display-item">
                <Calendar size={13} />
                <span>{formatDate(currentTime)}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 300, fontSize: '0.8rem' }}>|</span>
            <div className="display-item">
                <Clock size={13} />
                <span>{formatTime(currentTime)}</span>
            </div>
        </div>
    );
});

const Header = ({ toggleSidebar, restaurantName, title, actions }) => {
    const { user, logout } = useAuth();
    
    return (
        <header className={`dashboard-header ${title ? 'master-header-mode' : ''}`}>
            <div className="header-left">
                <button className="icon-btn menu-toggle" onClick={toggleSidebar}>
                    <Menu size={22} />
                </button>
                <div className="restaurant-badge">
                    {title ? (
                        <div className="flex items-center gap-4">
                            <div className="w-[1px] h-6 bg-slate-200/50 mx-2 hidden md:block"></div>
                            <h2 className="premium-page-title">{title}</h2>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {user?.logo_url ? (
                                <img src={user.logo_url} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                            ) : (
                                <img src="/logo.jpeg" alt="Yugam" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                            )}
                            <span className="restaurant-name" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400, fontSize: '1.2rem' }}>
                                {user?.restaurant_name || "Yugam Software"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {!title && (
                <div className="header-center">
                    <TimeDisplay />
                </div>
            )}

            <div className="header-right">
                {actions ? (
                    <div className="flex items-center gap-3 mr-4">
                        {actions}
                    </div>
                ) : (
                    <>
                        <button className="icon-btn" title="Notifications">
                            <Bell size={18} />
                        </button>

                        <div className="user-profile">
                            <div className="user-info">
                                <span className="user-name">{user?.name || 'OWNER'}</span>
                                <span className="user-role">{user?.role || 'Admin'}</span>
                            </div>
                            <div className="user-avatar">
                                <User size={17} />
                            </div>
                        </div>

                        <div className="header-divider"></div>

                        <button
                            className="icon-btn logout-header-btn"
                            onClick={logout}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};

export default memo(Header);
