import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield, Store, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const { login, getLandingPage } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await login(formData);

        if (res.success) {
            navigate(getLandingPage());
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            {/* Left Side - Info (Consistency with Register) */}
            <div className="login-sidebar">
                <div className="sidebar-glow"></div>

                <div className="sidebar-content">
                    <Link to="/" className="logo-link">
                        <div className="logo-icon-box" style={{ backgroundColor: 'var(--white)' }}>
                            <Utensils className="w-6 h-6 text-galaxy" />
                        </div>
                        <span className="logo-text" style={{ color: 'var(--galaxy-black)' }}>RestoSaaS</span>
                    </Link>

                    <h2 className="sidebar-title">Manage your restaurant <span className="text-white">With Ease</span></h2>
                    <p className="sidebar-desc">
                        Log in to access your dashboard, track sales, and manage your staff and inventory in real-time.
                    </p>

                    <div className="benefit-list">
                        {[
                            { icon: <Shield />, text: "Secure Authentication" },
                            { icon: <Store />, text: "Centralized Dashboard" },
                            { icon: <Info />, text: "24/7 Priority Support" }
                        ].map((item, i) => (
                            <div key={i} className="benefit-item">
                                <div className="sidebar-icon-box">
                                    {item.icon}
                                </div>
                                <p>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="login-main">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="form-wrapper"
                >
                    <div className="form-header">
                        <h1 className="text-title">Welcome Back</h1>
                        <p className="text-muted">Enter your credentials to access your restaurant dashboard.</p>
                    </div>

                    <div className="login-form-card">
                        {error && (
                            <div className="error-box">
                                <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label className="input-label">Email or Mobile Number</label>
                                <div className="input-relative">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        className="input-field pad-left"
                                        placeholder="admin@restaurant.com"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="input-label">Password</label>
                                    <Link to="/forgot-password" style={{ color: 'var(--primary-500)', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="input-relative">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        className="input-field pad-left"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex-1 py-3 text-lg"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Login'}
                                </button>
                                <Link
                                    to="/"
                                    className="btn-outline px-8 py-3 text-lg"
                                >
                                    Exit
                                </Link>
                            </div>
                        </form>

                        <div className="login-footer">
                            New to RestoSaaS? <Link to="/register" className="footer-link">Create an account</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;

