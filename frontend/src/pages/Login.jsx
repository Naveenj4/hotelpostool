import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Utensils, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await login(formData.email, formData.password);

        if (res.success) {
            const rType = res.data.restaurant_type;
            const target = (rType === 'SMART' || rType === 'SELF_SERVICE') ? '/dashboard/self-service' : '/dashboard/dining';
            navigate(target);
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            {/* Mesmerizing Background Animation */}
            <div className="animated-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="auth-card"
            >
                <div className="auth-header">
                    <Link to="/" className="auth-logo no-underline">
                        <div className="auth-logo-icon">
                            <Utensils className="w-8 h-8 text-black" />
                        </div>
                        <span className="auth-logo-text">Resto<span className="text-primary-500">SaaS</span></span>
                    </Link>
                    <h1 className="auth-title">Welcome Back.</h1>
                    <p className="auth-subtitle">Elevate your workspace with a single click.</p>
                </div>

                {error && (
                    <div className="error-box mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="input-label">Email Architecture</label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="admin@yourdomain.com"
                            className="input-field"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <div className="flex justify-between items-center mb-2">
                            <label className="input-label">Security Key</label>
                        </div>
                        <input
                            type="password"
                            name="password"
                            required
                            placeholder="••••••••••••"
                            className="input-field"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-btn flex items-center justify-center gap-4"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                Access Dashboard <ArrowRight size={24} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    New to the ecosystem?
                    <Link to="/register" className="auth-link">Initialize Workspace</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
