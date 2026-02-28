import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './SettingsPage.css';
import {
    User,
    Key,
    Printer,
    FileText,
    Eye,
    EyeOff,
    Save,
    CheckCircle,
    Palette
} from 'lucide-react';

const SettingsPage = () => {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Form states
    const [profileForm, setProfileForm] = useState({
        ownerName: '',
        email: '',
        mobile: '',
        businessName: '',
        restaurantType: '',
        billingLayout: 'SIDEBAR'
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [printerForm, setPrinterForm] = useState({
        enabled: false,
        width: '58mm'
    });

    const [billForm, setBillForm] = useState({
        header: '',
        footer: '',
        gstNo: '',
        autoPrint: false
    });

    // UI states
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [saving, setSaving] = useState({});
    const [success, setSuccess] = useState({});
    const [errors, setErrors] = useState({});

    // Fetch current settings
    const fetchSettings = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success && result.data) {
                setSettings(result.data);

                // Use data from API, but keep defaults if something is missing
                const profile = result.data.profile || {};
                const restaurant = result.data.restaurant || {};

                setProfileForm(prev => ({
                    ...prev,
                    ownerName: profile.ownerName || '',
                    email: profile.email || '',
                    mobile: profile.mobile || profile.phone || '',
                    businessName: profile.businessName || '',
                    restaurantType: restaurant.restaurant_type || '',
                    billingLayout: restaurant.billing_layout || 'SIDEBAR'
                }));

                if (result.data.printer) setPrinterForm(result.data.printer);
                if (result.data.billFormat) setBillForm(result.data.billFormat);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    // Handle form changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
        clearError('profile');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
        clearError('password');
    };

    const handlePrinterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPrinterForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        clearError('printer');
    };

    const handleBillChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBillForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        clearError('bill');
    };

    const clearError = (section) => {
        setErrors(prev => ({ ...prev, [section]: '' }));
        setSuccess(prev => ({ ...prev, [section]: false }));
    };

    // Save handlers
    const saveProfile = async () => {
        setSaving(prev => ({ ...prev, profile: true }));
        clearError('profile');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });

            const result = await response.json();
            if (result.success && result.data) {
                setSuccess(prev => ({ ...prev, profile: true }));

                // Update everything from the consistent data structure
                const profile = result.data.profile || {};
                const restaurant = result.data.restaurant || {};

                const updatedProfile = {
                    ownerName: profile.ownerName || profileForm.ownerName,
                    email: profile.email || profileForm.email,
                    mobile: profile.mobile || profileForm.mobile,
                    businessName: profile.businessName || profileForm.businessName,
                    restaurantType: restaurant.restaurant_type || profileForm.restaurantType,
                    billingLayout: restaurant.billing_layout || profileForm.billingLayout
                };

                setProfileForm(updatedProfile);

                // Immediate local sync for Billing Page speed
                if (restaurant.billing_layout) {
                    localStorage.setItem('cachedBillingLayout', restaurant.billing_layout);
                }

                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            }
            else {
                setErrors(prev => ({ ...prev, profile: result.message || 'Validation failed' }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, profile: 'Failed to update profile' }));
        } finally {
            setSaving(prev => ({ ...prev, profile: false }));
        }
    };

    // Save ONLY the billing layout — no profile fields needed at all
    const saveLayout = async () => {
        setSaving(prev => ({ ...prev, profile: true }));
        setErrors(prev => ({ ...prev, profile: '' }));
        setSuccess(prev => ({ ...prev, profile: false }));

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/layout`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ billingLayout: profileForm.billingLayout })
            });

            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, profile: true }));
                localStorage.setItem('cachedBillingLayout', profileForm.billingLayout);
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else {
                setErrors(prev => ({ ...prev, profile: result.message || 'Failed to save layout' }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, profile: 'Failed to save layout. Check your connection.' }));
        } finally {
            setSaving(prev => ({ ...prev, profile: false }));
        }
    };

    const changePassword = async () => {
        setSaving(prev => ({ ...prev, password: true }));
        clearError('password');

        // Validation
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setErrors(prev => ({ ...prev, password: 'New passwords do not match' }));
            setSaving(prev => ({ ...prev, password: false }));
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
            setSaving(prev => ({ ...prev, password: false }));
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordForm)
            });

            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, password: true }));
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setSuccess(prev => ({ ...prev, password: false })), 3000);
            } else {
                setErrors(prev => ({ ...prev, password: result.message }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, password: 'Failed to change password' }));
        } finally {
            setSaving(prev => ({ ...prev, password: false }));
        }
    };

    const savePrinterSettings = async () => {
        setSaving(prev => ({ ...prev, printer: true }));
        clearError('printer');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/printer`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(printerForm)
            });

            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, printer: true }));
                setTimeout(() => setSuccess(prev => ({ ...prev, printer: false })), 3000);
            } else {
                setErrors(prev => ({ ...prev, printer: result.message }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, printer: 'Failed to update printer settings' }));
        } finally {
            setSaving(prev => ({ ...prev, printer: false }));
        }
    };

    const saveBillSettings = async () => {
        setSaving(prev => ({ ...prev, bill: true }));
        clearError('bill');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/bill-format`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(billForm)
            });

            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, bill: true }));
                setTimeout(() => setSuccess(prev => ({ ...prev, bill: false })), 3000);
            } else {
                setErrors(prev => ({ ...prev, bill: result.message }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, bill: 'Failed to update bill settings' }));
        } finally {
            setSaving(prev => ({ ...prev, bill: false }));
        }
    };

    const testPrint = () => {
        alert('Test print functionality would be implemented here');
    };

    const previewBill = () => {
        alert('Bill preview functionality would be implemented here');
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
                <main className="dashboard-main">
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="dashboard-content">
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading settings...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="dashboard-content">
                    <div className="page-header">
                        <div className="page-title">
                            <h2>Settings</h2>
                            <p>Manage your account and system preferences</p>
                        </div>
                    </div>

                    <div className="settings-layout">
                        {/* Sidebar Navigation */}
                        <div className="settings-sidebar">
                            <div className="settings-nav">
                                <button
                                    className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <User size={20} />
                                    Profile Settings
                                </button>
                                <button
                                    className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('password')}
                                >
                                    <Key size={20} />
                                    Password
                                </button>
                                <button
                                    className={`nav-item ${activeTab === 'printer' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('printer')}
                                >
                                    <Printer size={20} />
                                    Printer Settings
                                </button>
                                <button
                                    className={`nav-item ${activeTab === 'bill' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('bill')}
                                >
                                    <FileText size={20} />
                                    Bill Format
                                </button>
                                <button
                                    className={`nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('appearance')}
                                >
                                    <Palette size={20} />
                                    Appearance
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="settings-main">
                            {/* Profile Settings */}
                            {activeTab === 'profile' && (
                                <div className="settings-card">
                                    <h3 className="card-title">
                                        <User size={24} color="var(--primary-500)" />
                                        Profile Information
                                    </h3>
                                    <p className="card-description">Update your personal and business information</p>

                                    {errors.profile && <div className="error-message">{errors.profile}</div>}
                                    {success.profile && <div className="success-message"><CheckCircle size={16} /> Profile updated successfully!</div>}

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="input-label">Owner Name *</label>
                                            <input
                                                type="text"
                                                name="ownerName"
                                                className="input-field"
                                                value={profileForm.ownerName}
                                                onChange={handleProfileChange}
                                                placeholder="Enter owner name"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="input-label">Email Address *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="input-field"
                                                value={profileForm.email}
                                                onChange={handleProfileChange}
                                                placeholder="Enter email address"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="input-label">Phone / Mobile Number *</label>
                                            <input
                                                type="tel"
                                                name="mobile"
                                                className="input-field"
                                                value={profileForm.mobile}
                                                onChange={handleProfileChange}
                                                placeholder="Enter mobile number"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="input-label">Business Name *</label>
                                            <input
                                                type="text"
                                                name="businessName"
                                                className="input-field"
                                                value={profileForm.businessName}
                                                onChange={handleProfileChange}
                                                placeholder="Enter business name"
                                            />
                                        </div>

                                        {/* Module Type visibility rule: Only visible if Super Admin */}
                                        {user?.role === 'SUPER_ADMIN' && (
                                            <div className="form-group">
                                                <label className="input-label" style={{ color: 'var(--primary-600)', fontWeight: 'bold' }}>Module Type (Plan)</label>
                                                <select
                                                    name="restaurantType"
                                                    className="input-field"
                                                    value={profileForm.restaurantType}
                                                    onChange={handleProfileChange}
                                                    style={{ border: '2px solid var(--primary-200)' }}
                                                >
                                                    <option value="SMART">SMART</option>
                                                    <option value="EFFICIENT">EFFICIENT</option>
                                                    <option value="ENTERPRISE">ENTERPRISE</option>
                                                </select>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Visible only to administrators for plan upgrades.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            className="btn-primary"
                                            onClick={saveProfile}
                                            disabled={saving.profile}
                                        >
                                            {saving.profile ? 'Saving...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Password Settings */}
                            {activeTab === 'password' && (
                                <div className="settings-card">
                                    <h3 className="card-title">
                                        <Key size={24} color="var(--primary-500)" />
                                        Change Password
                                    </h3>
                                    <p className="card-description">Update your account password</p>

                                    {errors.password && <div className="error-message">{errors.password}</div>}
                                    {success.password && <div className="success-message"><CheckCircle size={16} /> Password changed successfully!</div>}

                                    <div className="form-group mb-4">
                                        <label className="input-label">Current Password *</label>
                                        <div className="password-input">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                name="currentPassword"
                                                className="input-field"
                                                value={passwordForm.currentPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                            >
                                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">New Password *</label>
                                        <div className="password-input">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                name="newPassword"
                                                className="input-field"
                                                value={passwordForm.newPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                            >
                                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group mb-6">
                                        <label className="input-label">Confirm New Password *</label>
                                        <div className="password-input">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                className="input-field"
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                            >
                                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            className="btn-primary"
                                            onClick={changePassword}
                                            disabled={saving.password}
                                        >
                                            {saving.password ? 'Changing...' : 'Change Password'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Printer Settings */}
                            {activeTab === 'printer' && (
                                <div className="settings-card">
                                    <h3 className="card-title">
                                        <Printer size={24} color="var(--primary-500)" />
                                        Thermal Printer Settings
                                    </h3>
                                    <p className="card-description">Configure your thermal printer preferences</p>

                                    {errors.printer && <div className="error-message">{errors.printer}</div>}
                                    {success.printer && <div className="success-message"><CheckCircle size={16} /> Printer settings updated!</div>}

                                    <div className="form-group mb-6">
                                        <label className="toggle-label">
                                            <input
                                                type="checkbox"
                                                name="enabled"
                                                checked={printerForm.enabled}
                                                onChange={handlePrinterChange}
                                            />
                                            <span className="toggle-slider"></span>
                                            Enable Thermal Printer
                                        </label>
                                    </div>

                                    {printerForm.enabled && (
                                        <div className="form-group mb-6">
                                            <label className="input-label">Printer Width</label>
                                            <select
                                                name="width"
                                                className="input-field"
                                                value={printerForm.width}
                                                onChange={handlePrinterChange}
                                            >
                                                <option value="58mm">58mm (Compact)</option>
                                                <option value="80mm">80mm (Standard)</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="form-actions">
                                        <button
                                            className="btn-primary"
                                            onClick={savePrinterSettings}
                                            disabled={saving.printer}
                                        >
                                            {saving.printer ? 'Saving...' : 'Save Printer Settings'}
                                        </button>
                                        {printerForm.enabled && (
                                            <button
                                                className="btn-outline"
                                                onClick={testPrint}
                                                style={{ marginLeft: '1rem' }}
                                            >
                                                Test Print
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bill Format Settings */}
                            {activeTab === 'bill' && (
                                <div className="settings-card">
                                    <h3 className="card-title">
                                        <FileText size={24} color="var(--primary-500)" />
                                        Bill Format Settings
                                    </h3>
                                    <p className="card-description">Customize your bill appearance and format</p>

                                    {errors.bill && <div className="error-message">{errors.bill}</div>}
                                    {success.bill && <div className="success-message"><CheckCircle size={16} /> Bill settings updated!</div>}

                                    <div className="form-group mb-4">
                                        <label className="input-label">Bill Header Text</label>
                                        <textarea
                                            name="header"
                                            className="input-field"
                                            rows="3"
                                            value={billForm.header}
                                            onChange={handleBillChange}
                                            placeholder="Enter text to appear at the top of bills"
                                        />
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="input-label">Bill Footer Text</label>
                                        <textarea
                                            name="footer"
                                            className="input-field"
                                            rows="3"
                                            value={billForm.footer}
                                            onChange={handleBillChange}
                                            placeholder="Enter text to appear at the bottom of bills"
                                        />
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="input-label">GST Number</label>
                                            <input
                                                type="text"
                                                name="gstNo"
                                                className="input-field"
                                                value={billForm.gstNo}
                                                onChange={handleBillChange}
                                                placeholder="Enter GST number"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="input-label">Auto-print Bills</label>
                                            <label className="toggle-label">
                                                <input
                                                    type="checkbox"
                                                    name="autoPrint"
                                                    checked={billForm.autoPrint}
                                                    onChange={handleBillChange}
                                                />
                                                <span className="toggle-slider"></span>
                                                Enable Auto-print
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            className="btn-primary"
                                            onClick={saveBillSettings}
                                            disabled={saving.bill}
                                        >
                                            {saving.bill ? 'Saving...' : 'Save Bill Settings'}
                                        </button>
                                        <button
                                            className="btn-outline"
                                            onClick={previewBill}
                                            style={{ marginLeft: '1rem' }}
                                        >
                                            Preview Bill
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="settings-card">
                                    <h3 className="card-title">
                                        <Palette size={24} color="var(--primary-500)" />
                                        Appearance & Layout
                                    </h3>
                                    <p className="card-description">Customize the look and feel of your POS terminal</p>

                                    {errors.profile && <div className="error-message">{errors.profile}</div>}
                                    {success.profile && <div className="success-message"><CheckCircle size={16} /> Layout updated successfully!</div>}

                                    <div className="form-group mb-6">
                                        <label className="input-label" style={{ marginBottom: '1rem', display: 'block' }}>Billing Page Layout</label>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1.5rem',
                                                background: 'var(--slate-50)',
                                                padding: '1.5rem',
                                                borderRadius: '16px',
                                                border: '1px solid var(--border-light)',
                                                width: 'fit-content'
                                            }}
                                        >
                                            <span style={{ fontWeight: 700, color: profileForm.billingLayout === 'SIDEBAR' ? 'var(--primary-600)' : 'var(--slate-400)', fontSize: '0.95rem' }}>
                                                Sidebar (Layout 1)
                                            </span>

                                            <label className="toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={profileForm.billingLayout === 'TOP_HEADER'}
                                                    onChange={(e) => {
                                                        const newLayout = e.target.checked ? 'TOP_HEADER' : 'SIDEBAR';
                                                        setProfileForm(prev => ({
                                                            ...prev,
                                                            billingLayout: newLayout
                                                        }));
                                                    }}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>

                                            <span style={{ fontWeight: 700, color: profileForm.billingLayout === 'TOP_HEADER' ? 'var(--primary-600)' : 'var(--slate-400)', fontSize: '0.95rem' }}>
                                                Top Header (Layout 2)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            className="btn-primary"
                                            onClick={saveLayout}
                                            disabled={saving.profile}
                                        >
                                            {saving.profile ? 'Saving...' : 'Apply & Save Layout'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
