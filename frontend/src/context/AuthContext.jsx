import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedPermissions = localStorage.getItem('permissions');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                // Validate essential fields to prevent navigation loops
                if (parsedUser.token && parsedUser.role && parsedUser.restaurant_type) {
                    setUser(parsedUser);
                    if (savedPermissions) {
                        setPermissions(JSON.parse(savedPermissions));
                    }
                } else {
                    localStorage.removeItem('user');
                    localStorage.removeItem('permissions');
                }
            } catch (e) {
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
            }
        }
        setLoading(false);
    }, []);

    const register = async (userData) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, userData);
            const normalizedUser = {
                ...data.user,
                _id: data.user.id,
                token: data.token,
                restaurant_type: data.restaurant.restaurant_type,
                restaurant_name: data.restaurant.name
            };
            setUser(normalizedUser);
            setPermissions(null);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.removeItem('permissions');
            return { success: true, data: normalizedUser };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const login = async (credentials) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, credentials);
            // Backend login returns: { success, token, user, restaurant, permissions }
            const normalizedUser = {
                ...data.user,
                _id: data.user.id,
                token: data.token,
                restaurant_type: data.restaurant.restaurant_type,
                restaurant_name: data.restaurant.name
            };
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));

            // Store permissions for STAFF users
            if (data.permissions) {
                setPermissions(data.permissions);
                localStorage.setItem('permissions', JSON.stringify(data.permissions));
            } else {
                setPermissions(null);
                localStorage.removeItem('permissions');
            }

            return { success: true, data: normalizedUser };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        setPermissions(null);
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
    };

    // Check if current user has access to a specific page
    const hasPageAccess = (pageKey) => {
        if (!user) return false;
        // OWNER and ADMIN have full access
        if (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
        // STAFF users check permissions
        if (!permissions) return false;
        const page = permissions.find(p => p.page_key === pageKey);
        return page?.has_access || false;
    };

    // Check if current user has access to a specific feature within a page
    const hasFeatureAccess = (pageKey, featureKey) => {
        if (!user) return false;
        // OWNER and ADMIN have full access
        if (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
        // STAFF users check permissions
        if (!permissions) return false;
        const page = permissions.find(p => p.page_key === pageKey);
        if (!page?.has_access) return false;
        const feature = page.features.find(f => f.feature_key === featureKey);
        return feature?.enabled || false;
    };

    // Check if user is an admin (OWNER or ADMIN role)
    const isAdmin = () => {
        return user && (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    };

    return (
        <AuthContext.Provider value={{
            user,
            permissions,
            loading,
            register,
            login,
            logout,
            hasPageAccess,
            hasFeatureAccess,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
