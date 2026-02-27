import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Store, Mail, Phone, Lock, Hash, MapPin,
    ArrowRight, Loader2, Utensils, CheckCircle2,
    Calendar, Shield, Info, AlertCircle
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
            owner_name: formData.company_name // Use company name as owner name since input was removed
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
        <div className="register-container">
            {/* Left Side - Info */}
            <div className="register-sidebar">
                <div className="sidebar-glow"></div>

                <div className="sidebar-content">
                    <Link to="/" className="logo-link">
                        <div className="logo-icon-box" style={{ backgroundColor: 'var(--white)' }}>
                            <Utensils className="w-6 h-6 text-galaxy" />
                        </div>
                        <span className="logo-text" style={{ color: 'var(--galaxy-black)' }}>RestoSaaS</span>
                    </Link>

                    <h2 className="sidebar-title">Empower your restaurant with <span className="text-white">Next-Gen POS</span></h2>
                    <p className="sidebar-desc">
                        Register today to manage multiple locations, real-time inventory, and seamless billing.
                    </p>

                    <div className="benefit-list">
                        {[
                            { icon: <Shield />, text: "Highly Secure & Reliable" },
                            { icon: <Store />, text: "Multi-tenant Dashboard" },
                            { icon: <Info />, text: "Real-time Bill Printing" }
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
            <div className="register-main">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="form-wrapper"
                >
                    <div className="form-header">
                        <h1 className="text-title">Create New Company</h1>
                        <p className="text-muted">Set up your restaurant profile and administrative controls.</p>
                    </div>

                    {error && (
                        <div className="error-box">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="register-form">
                        {/* Section 1: Company Details */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <Store className="w-4 h-4" /> Company Details
                            </h3>
                            <div className="input-grid">
                                <div className="form-group">
                                    <label className="input-label">Company Name</label>
                                    <div className="input-relative">
                                        <Store className="input-icon" />
                                        <input
                                            type="text"
                                            name="company_name"
                                            required
                                            placeholder="The Grand Palace Inc."
                                            className="input-field pad-left"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Sort Name</label>
                                    <div className="input-relative">
                                        <Hash className="input-icon" />
                                        <input
                                            type="text"
                                            name="store_name"
                                            required
                                            placeholder="Short name for sorting"
                                            className="input-field pad-left"
                                            value={formData.store_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Print Name</label>
                                    <div className="input-relative">
                                        <Info className="input-icon" />
                                        <input
                                            type="text"
                                            name="print_name"
                                            required
                                            placeholder="Name for Bills/Invoices"
                                            className="input-field pad-left"
                                            value={formData.print_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Restaurant Type</label>
                                    <select
                                        name="restaurant_type"
                                        className="input-field"
                                        value={formData.restaurant_type}
                                        onChange={handleChange}
                                    >
                                        <option value="SMART">SMART</option>
                                        <option value="EFFICIENT">EFFICIENT</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact & Legal */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <MapPin className="w-4 h-4" /> Contact & Legal Details
                            </h3>
                            <div className="input-grid">
                                <div className="form-group full-width">
                                    <label className="input-label">Address</label>
                                    <textarea
                                        name="address"
                                        required
                                        placeholder="Full address of the restaurant..."
                                        className="input-field"
                                        style={{ height: '80px', resize: 'none' }}
                                        value={formData.address}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Cell Number</label>
                                    <div className="input-relative">
                                        <Phone className="input-icon" />
                                        <input
                                            type="number"
                                            name="mobile"
                                            required
                                            placeholder="10 digit number"
                                            className="input-field pad-left"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group full-width">
                                    <label className="input-label">Email</label>
                                    <div className="input-relative">
                                        <Mail className="input-icon" />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            placeholder="owner@company.com"
                                            className="input-field pad-left"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">FSSAI Number</label>
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
                                    <label className="input-label">GSTIN</label>
                                    <input
                                        type="text"
                                        name="gstin"
                                        placeholder="Optional"
                                        className="input-field"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Security */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <Shield className="w-4 h-4" /> Security Control
                            </h3>
                            <div className="input-grid">
                                <div className="form-group full-width" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        name="security_control_enabled"
                                        id="security_control"
                                        checked={formData.security_control_enabled}
                                        onChange={handleChange}
                                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="security_control" style={{ cursor: 'pointer', fontWeight: 600 }}>Enable Security Control (Default)</label>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Password</label>
                                    <div className="input-relative">
                                        <Lock className="input-icon" />
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            placeholder="Min 8 chars + 1 number"
                                            className="input-field pad-left"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Confirm Password</label>
                                    <div className="input-relative">
                                        <Lock className="input-icon" />
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            required
                                            placeholder="Re-enter password"
                                            className="input-field pad-left"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ flex: 2, padding: '1rem', fontSize: '1.125rem' }}
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Save <ArrowRight className="ml-2 w-6 h-6" />
                                    </>
                                )}
                            </button>
                            <Link
                                to="/"
                                className="btn-outline"
                                style={{ flex: 1, padding: '1rem', fontSize: '1.125rem' }}
                            >
                                Exit
                            </Link>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};


export default RegisterRestaurant;


