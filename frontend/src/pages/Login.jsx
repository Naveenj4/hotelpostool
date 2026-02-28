import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Mail, Lock, Loader2, Utensils,
    ArrowRight, ShieldCheck, Zap, BarChart3
} from 'lucide-react';
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
        <div className="auth-container">
            {/* Creative Professional Sidebar */}
            <div className="auth-sidebar">
                <div className="sidebar-glow"></div>

                <Link to="/" className="auth-logo-box no-underline">
                    <div className="logo-icon-white">
                        <Utensils className="w-8 h-8" />
                    </div>
                    <span className="logo-text-white">Resto<span className="opacity-80">SaaS</span></span>
                </Link>

                <div className="sidebar-main-content">
                    <h2 className="sidebar-tagline">
                        Enterprise Access <br />
                        <span className="opacity-70">Redefined.</span>
                    </h2>

                    <div className="benefits-stack">
                        {[
                            { icon: <ShieldCheck size={24} />, title: "Bank-Grade Security", desc: "Your data architecture is protected by multi-tier encryption." },
                            { icon: <Zap size={24} />, title: "Instant Deployment", desc: "Access your global workspace nodes in real-time." },
                            { icon: <BarChart3 size={24} />, title: "Live Intelligence", desc: "Monitor entire franchise streams from a single brain." }
                        ].map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="benefit-card"
                            >
                                <div className="benefit-icon">
                                    {benefit.icon}
                                </div>
                                <div className="benefit-text">
                                    <h4>{benefit.title}</h4>
                                    <p>{benefit.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-footer text-sm font-bold opacity-60 tracking-widest uppercase">
                    © 2026 RestoSaaS Operations Center
                </div>
            </div>

            {/* Clean Professional Form Main Area */}
            <main className="auth-main">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="auth-form-wrapper"
                >
                    <div className="form-header">
                        <h1 className="form-title">Welcome back.</h1>
                        <p className="form-subtitle">Enter your enterprise keys to resume operations.</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-600 font-bold flex items-center gap-3">
                            <span className="text-xl">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-card-clean">
                        <div className="input-group">
                            <label className="input-header">Email Architecture</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon-left" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="admin@workspace.com"
                                    className="input-field-professional"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-header">Security Key</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon-left" size={20} />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="••••••••••••"
                                    className="input-field-professional"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-auth-primary flex items-center justify-center gap-4"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    Access Dashboard <ArrowRight size={22} />
                                </>
                            )}
                        </button>

                        <div className="auth-footer">
                            New operator?
                            <Link to="/register" className="auth-redirect no-underline">Initialize Workspace</Link>
                        </div>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default Login;
