import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                // Validate essential fields to prevent navigation loops
                if (parsedUser.token && parsedUser.role && parsedUser.restaurant_type) {
                    setUser(parsedUser);
                } else {
                    localStorage.removeItem('user'); // Clear invalid session
                }
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const register = async (userData) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, userData);
            // Backend register returns structured data: { _id, name, restaurant_type, token, ... }
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return { success: true, data };
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
            // Backend login returns: { success, token, user: {id, name, role...}, restaurant: {name, restaurant_type} }
            const normalizedUser = {
                ...data.user,
                _id: data.user.id, // for consistency with register
                token: data.token,
                restaurant_type: data.restaurant.restaurant_type,
                restaurant_name: data.restaurant.name
            };
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
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
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
