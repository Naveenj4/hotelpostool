import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Store, Mail, Phone, Lock, Hash, MapPin,
    ArrowRight, Loader2, Utensils, Shield, Info, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './RegisterRestaurant.css';

const RegisterRestaurant = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        company_name: '',
        store_name: '',
        print_name: '',
        restaurant_type: 'DINING',
        address: '',
        fssai_no: '',
        gstin: '',
        email: '',
        mobile: '',
        password: '',
        confirm_password: '',
        security_control_enabled: true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 8 || !/\d/.test(formData.password)) {
            setError('Password must be at least 8 characters and contain one number');
            setLoading(false);
            return;
        }

        const registrationData = {
            ...formData,
            owner_name: formData.company_name
        };

        const res = await register(registrationData);

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
                style={{ maxWidth: '800px' }}
            >
                <div className="auth-header">
                    <Link to="/" className="auth-logo no-underline">
                        <div className="auth-logo-icon">
                            <Utensils className="w-8 h-8 text-black" />
                        </div>
                        <span className="auth-logo-text">Resto<span className="text-primary-500">SaaS</span></span>
                    </Link>
                    <h1 className="auth-title">Initialize Workspace.</h1>
                    <p className="auth-subtitle">Define your restaurant's digital DNA today.</p>
                </div>

                {error && (
                    <div className="error-box mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="form-group">
                            <label className="input-label">Company Entity</label>
                            <input
                                type="text"
                                name="company_name"
                                required
                                placeholder="The Grand Palace Inc."
                                className="input-field"
                                value={formData.company_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Sort Alias</label>
                            <input
                                type="text"
                                name="store_name"
                                required
                                placeholder="Sort Identifier"
                                className="input-field"
                                value={formData.store_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Print Branding</label>
                            <input
                                type="text"
                                name="print_name"
                                required
                                placeholder="Name on Invoices"
                                className="input-field"
                                value={formData.print_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Ecosystem Node</label>
                            <select
                                name="restaurant_type"
                                className="input-field"
                                style={{ background: 'rgba(255,255,255,0.03)', appearance: 'none' }}
                                value={formData.restaurant_type}
                                onChange={handleChange}
                            >
                                <option value="SMART" style={{ background: '#0f172a' }}>SMART - Global Analytics</option>
                                <option value="EFFICIENT" style={{ background: '#0f172a' }}>EFFICIENT - Ultra High Speed</option>
                            </select>
                        </div>
                        <div className="form-group md:col-span-2">
                            <label className="input-label">Geographic Coordinates</label>
                            <input
                                type="text"
                                name="address"
                                required
                                placeholder="Street, City, Building..."
                                className="input-field"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Neural Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="owner@domain.com"
                                className="input-field"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Comm Line</label>
                            <input
                                type="text"
                                name="mobile"
                                required
                                placeholder="Phone connection"
                                className="input-field"
                                value={formData.mobile}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">FSSAI ID</label>
                            <input
                                type="text"
                                name="fssai_no"
                                placeholder="Optional"
                                className="input-field"
                                value={formData.fssai_no}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">GSTIN Mapping</label>
                            <input
                                type="text"
                                name="gstin"
                                placeholder="Optional"
                                className="input-field"
                                value={formData.gstin}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Security Key</label>
                            <input
                                type="password"
                                name="password"
                                required
                                placeholder="Min 8 chars"
                                className="input-field"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Verify Key</label>
                            <input
                                type="password"
                                name="confirm_password"
                                required
                                placeholder="Re-enter key"
                                className="input-field"
                                value={formData.confirm_password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-btn flex items-center justify-center gap-4 mt-12"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                Activate Ecosystem <ArrowRight size={24} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer mt-12">
                    Already a member?
                    <Link to="/login" className="auth-link">Resume Access</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterRestaurant;
