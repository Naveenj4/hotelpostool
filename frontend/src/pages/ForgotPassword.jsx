import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, AlertCircle, Utensils, CheckCircle, Lock } from 'lucide-react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingFooter from '../components/landing/LandingFooter';
import './Login.css'; // Reusing Login styles for consistency

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        company_name: '',
        email: '',
        otp: '',
        new_password: '',
        confirm_password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: formData.company_name,
                    email: formData.email
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess('OTP sent successfully! Check your email.');
            setTimeout(() => {
                setSuccess('');
                setStep(2);
            }, 1000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: formData.company_name,
                    email: formData.email,
                    otp: formData.otp
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess('OTP Verified!');
            setTimeout(() => {
                setSuccess('');
                setStep(3);
            }, 500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (formData.new_password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: formData.company_name,
                    email: formData.email,
                    otp: formData.otp,
                    new_password: formData.new_password
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess('Password reset successfully! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col pt-24 bg-slate-50">
            <LandingHeader />

            <div className="auth-container flex-1">
                {/* Left Side - Info */}
                <div className="auth-sidebar">
                    <div className="sidebar-glow"></div>
                    <div className="sidebar-main-content">
                        <Link to="/" className="auth-logo-box no-underline mb-8">
                            <div className="logo-icon-white">
                                <Utensils size={32} />
                            </div>
                            <span className="logo-text-white">Resto<span className="opacity-80">SaaS</span></span>
                        </Link>

                        <div>
                            <h2 className="sidebar-tagline">
                                Account <br />
                                <span className="opacity-70">Recovery.</span>
                            </h2>
                            <p className="text-white opacity-80 text-lg font-medium leading-relaxed">
                                Don't worry, it happens to the best of us. Let's get you back into your system secure and fast.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <main className="auth-main">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="auth-form-wrapper"
                    >
                        <div className="form-header">
                            <h1 className="form-title">
                                {step === 1 && 'Forgot Password?'}
                                {step === 2 && 'Enter OTP'}
                                {step === 3 && 'Reset Password'}
                            </h1>
                            <p className="form-subtitle">
                                {step === 1 && 'Enter your restaurant details to receive a recovery code.'}
                                {step === 2 && 'We sent a 6-digit code to your email.'}
                                {step === 3 && 'Create a strong password for your account.'}
                            </p>
                        </div>

                        <div className="auth-card-clean">
                        {error && (
                            <div className="error-box">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="success-box">
                                <CheckCircle size={18} /> {success}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="login-form">
                                <div className="form-group">
                                    <label className="input-label">Restaurant Name</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        required
                                        className="input-field"
                                        placeholder="Your Restaurant Name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Registered Email</label>
                                    <div className="input-relative">
                                        <Mail className="input-icon" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="input-field pad-left"
                                            placeholder="admin@restaurant.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Send Recovery Code'}
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="login-form">
                                <div className="form-group">
                                    <label className="input-label">Verification Code (OTP)</label>
                                    <input
                                        type="text"
                                        name="otp"
                                        required
                                        maxLength="6"
                                        className="input-field text-center text-2xl tracking-widest font-mono"
                                        placeholder="------"
                                        value={formData.otp}
                                        onChange={handleChange}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Verify Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-primary-500 font-semibold text-center mt-2 hover:underline"
                                >
                                    Wrong email? Go back
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="login-form">
                                <div className="form-group">
                                    <label className="input-label">New Password</label>
                                    <div className="input-relative">
                                        <Lock className="input-icon" size={18} />
                                        <input
                                            type="password"
                                            name="new_password"
                                            required
                                            minLength="6"
                                            className="input-field pad-left"
                                            placeholder="Min 6 characters"
                                            value={formData.new_password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Confirm Password</label>
                                    <div className="input-relative">
                                        <Lock className="input-icon" size={18} />
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            required
                                            className="input-field pad-left"
                                            placeholder="Re-enter password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
                                </button>
                            </form>
                        )}

                            <div className="auth-footer">
                                <p>Remember your password? <Link to="/login" className="auth-redirect no-underline">Log In</Link></p>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>

            <LandingFooter />
        </div>
    );
};

export default ForgotPassword;
