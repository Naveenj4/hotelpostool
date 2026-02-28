import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Store, Mail, Phone, Lock,
    ArrowRight, Loader2, Utensils,
    ShieldCheck, Star
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

        const registrationData = {
            ...formData,
            owner_name: formData.company_name
        };

        const res = await register(registrationData);

        if (res.success) {
            const rType = res.data.restaurant_type;
            const target = (rType === 'SMART' || rType === 'SELF_SERVICE') ? '/dashboard/self-service/home' : '/dashboard/dining';
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
                        Architecting <br />
                        <span className="opacity-70">The Future.</span>
                    </h2>

                    <div className="testimonial-card-creative">
                        <p className="testimonial-text">
                            "The transition to RestoSaaS has been a paradigm shift for our operations. The modular architecture is exactly what we needed for scale."
                        </p>
                        <div className="author-box">
                            <div className="author-avatar">
                                <Star size={24} fill="currentColor" />
                            </div>
                            <div className="author-info">
                                <h5>Sarah K.</h5>
                                <span>Operations Lead, FoodVentures</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sidebar-footer text-sm font-bold opacity-60 tracking-widest uppercase">
                    © 2026 RestoSaaS Operations Center
                </div>
            </div>

            {/* Professional Form Scroll Area */}
            <main className="auth-main-scroll">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="auth-form-wrapper-wide"
                >
                    <div className="form-header text-center" style={{ marginBottom: '4rem' }}>
                        <h1 className="form-title">Initialize Ecosystem.</h1>
                        <p className="form-subtitle">Define your restaurant's digital DNA.</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-600 font-bold flex items-center gap-3">
                            <span className="text-xl">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-card-clean">
                        <div className="input-grid">
                            <div className="input-group">
                                <label className="input-header">Company Entity</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    required
                                    placeholder="The Grand Palace Inc."
                                    className="input-field-professional"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">Store Identifier</label>
                                <input
                                    type="text"
                                    name="store_name"
                                    required
                                    placeholder="Unique Sort Name"
                                    className="input-field-professional"
                                    value={formData.store_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">Print Branding</label>
                                <input
                                    type="text"
                                    name="print_name"
                                    required
                                    placeholder="Name for Invoices"
                                    className="input-field-professional"
                                    value={formData.print_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">Operational Node</label>
                                <select
                                    name="restaurant_type"
                                    className="input-field-professional"
                                    style={{ appearance: 'none' }}
                                    value={formData.restaurant_type}
                                    onChange={handleChange}
                                >
                                    <option value="DINING">ELITE DINING</option>
                                    <option value="SMART">SMART SERVICE</option>
                                    <option value="SELF_SERVICE">SELF SERVICE</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-header">Geographic Location</label>
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    placeholder="Full street address, building, city..."
                                    className="input-field-professional"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">Email Architecture</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="owner@workspace.com"
                                    className="input-field-professional"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">Comm Line</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    required
                                    placeholder="Primary phone connection"
                                    className="input-field-professional"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">FSSAI ID</label>
                                <input
                                    type="text"
                                    name="fssai_no"
                                    placeholder="Food License No (Optional)"
                                    className="input-field-professional"
                                    value={formData.fssai_no}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">GSTIN Mapping</label>
                                <input
                                    type="text"
                                    name="gstin"
                                    placeholder="Tax Registration (Optional)"
                                    className="input-field-professional"
                                    value={formData.gstin}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">Security Key</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="Minimum 8 characters"
                                    className="input-field-professional"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-header">Verify Key</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    required
                                    placeholder="Re-enter security key"
                                    className="input-field-professional"
                                    value={formData.confirm_password}
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
                                    Initialize Ecosystem <ArrowRight size={22} />
                                </>
                            )}
                        </button>

                        <div className="auth-footer">
                            Resume access?
                            <Link to="/login" className="auth-redirect no-underline">Login To Dashboard</Link>
                        </div>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default RegisterRestaurant;
