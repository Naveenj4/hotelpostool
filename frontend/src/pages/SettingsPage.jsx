import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './SettingsPage.css';
import {
    User, Key, Printer, FileText, Eye, EyeOff,
    Save, CheckCircle, Palette, AlertCircle, Loader2,
    Building2, Phone, Mail, Lock, Settings, TestTube,
    LayoutTemplate, Shield, ChevronRight, Sliders
} from 'lucide-react';

const SettingsPage = () => {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    const [profileForm, setProfileForm] = useState({
        ownerName: '', email: '', mobile: '', businessName: '', restaurantType: '', billingLayout: 'SIDEBAR'
    });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [printerForm, setPrinterForm] = useState({ enabled: false, width: '58mm' });
    const [billForm, setBillForm] = useState({ header: '', footer: '', gstNo: '', autoPrint: false });

    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [saving, setSaving] = useState({});
    const [success, setSuccess] = useState({});
    const [errors, setErrors] = useState({});

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
        } catch (err) { console.error("Failed to fetch settings", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSettings(); }, []);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const handleProfileChange = (e) => { const { name, value } = e.target; setProfileForm(prev => ({ ...prev, [name]: value })); clearError('profile'); };
    const handlePasswordChange = (e) => { const { name, value } = e.target; setPasswordForm(prev => ({ ...prev, [name]: value })); clearError('password'); };
    const handlePrinterChange = (e) => { const { name, value, type, checked } = e.target; setPrinterForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); clearError('printer'); };
    const handleBillChange = (e) => { const { name, value, type, checked } = e.target; setBillForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); clearError('bill'); };

    const clearError = (section) => { setErrors(prev => ({ ...prev, [section]: '' })); setSuccess(prev => ({ ...prev, [section]: false })); };

    const saveProfile = async () => {
        setSaving(prev => ({ ...prev, profile: true })); clearError('profile');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/profile`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileForm)
            });
            const result = await response.json();
            if (result.success && result.data) {
                setSuccess(prev => ({ ...prev, profile: true }));
                const profile = result.data.profile || {};
                const restaurant = result.data.restaurant || {};
                setProfileForm({ ownerName: profile.ownerName || profileForm.ownerName, email: profile.email || profileForm.email, mobile: profile.mobile || profileForm.mobile, businessName: profile.businessName || profileForm.businessName, restaurantType: restaurant.restaurant_type || profileForm.restaurantType, billingLayout: restaurant.billing_layout || profileForm.billingLayout });
                if (restaurant.billing_layout) localStorage.setItem('cachedBillingLayout', restaurant.billing_layout);
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else { setErrors(prev => ({ ...prev, profile: result.message || 'Validation failed' })); }
        } catch (err) { setErrors(prev => ({ ...prev, profile: 'Failed to update profile' })); }
        finally { setSaving(prev => ({ ...prev, profile: false })); }
    };

    const saveLayout = async () => {
        setSaving(prev => ({ ...prev, profile: true })); setErrors(prev => ({ ...prev, profile: '' })); setSuccess(prev => ({ ...prev, profile: false }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/layout`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ billingLayout: profileForm.billingLayout })
            });
            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, profile: true }));
                localStorage.setItem('cachedBillingLayout', profileForm.billingLayout);
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else { setErrors(prev => ({ ...prev, profile: result.message || 'Failed to save layout' })); }
        } catch (err) { setErrors(prev => ({ ...prev, profile: 'Failed to save layout. Check your connection.' })); }
        finally { setSaving(prev => ({ ...prev, profile: false })); }
    };

    const changePassword = async () => {
        setSaving(prev => ({ ...prev, password: true })); clearError('password');
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { setErrors(prev => ({ ...prev, password: 'New passwords do not match' })); setSaving(prev => ({ ...prev, password: false })); return; }
        if (passwordForm.newPassword.length < 6) { setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' })); setSaving(prev => ({ ...prev, password: false })); return; }
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/password`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(passwordForm)
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, password: true })); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setTimeout(() => setSuccess(prev => ({ ...prev, password: false })), 3000); }
            else { setErrors(prev => ({ ...prev, password: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, password: 'Failed to change password' })); }
        finally { setSaving(prev => ({ ...prev, password: false })); }
    };

    const savePrinterSettings = async () => {
        setSaving(prev => ({ ...prev, printer: true })); clearError('printer');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/printer`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(printerForm)
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, printer: true })); setTimeout(() => setSuccess(prev => ({ ...prev, printer: false })), 3000); }
            else { setErrors(prev => ({ ...prev, printer: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, printer: 'Failed to update printer settings' })); }
        finally { setSaving(prev => ({ ...prev, printer: false })); }
    };

    const saveBillSettings = async () => {
        setSaving(prev => ({ ...prev, bill: true })); clearError('bill');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/bill-format`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(billForm)
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, bill: true })); setTimeout(() => setSuccess(prev => ({ ...prev, bill: false })), 3000); }
            else { setErrors(prev => ({ ...prev, bill: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, bill: 'Failed to update bill settings' })); }
        finally { setSaving(prev => ({ ...prev, bill: false })); }
    };

    const TABS = [
        { id: 'profile', icon: <User size={18} />, label: 'Profile', sub: 'Account info' },
        { id: 'password', icon: <Key size={18} />, label: 'Security', sub: 'Access control' },
        { id: 'printer', icon: <Printer size={18} />, label: 'Printer', sub: 'Thermal setup' },
        { id: 'bill', icon: <FileText size={18} />, label: 'Bill Format', sub: 'Receipt style' },
        { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance', sub: 'UI & layout' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <Settings className="animate-spin text-indigo-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Loading Configuration...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Settings className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">System Configuration</span>
                            </div>
                            <h2>Settings</h2>
                            <p>Manage your account preferences, printer, and appearance configurations.</p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Settings Navigation */}
                        <div className="w-full lg:w-72 shrink-0">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-3 sticky top-6">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 py-2">Configuration Modules</p>
                                {TABS.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-1 text-left transition-all group ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'} transition-all`}>
                                            {tab.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-black text-sm uppercase tracking-tight ${activeTab === tab.id ? 'text-white' : 'text-slate-700'}`}>{tab.label}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${activeTab === tab.id ? 'text-white/60' : 'text-slate-400'}`}>{tab.sub}</div>
                                        </div>
                                        <ChevronRight size={16} className={activeTab === tab.id ? 'text-white/60' : 'text-slate-300 group-hover:text-slate-400'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 min-w-0">
                            {/* Profile Settings */}
                            {activeTab === 'profile' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center gap-3 mb-8">
                                        <User size={20} className="text-indigo-600" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Profile Information</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">Update your personal and business credentials</p>
                                        </div>
                                    </div>

                                    {errors.profile && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.profile}</div>}
                                    {success.profile && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Profile updated successfully!</div>}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-group-premium">
                                            <label>Owner Name *</label>
                                            <div className="relative">
                                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input type="text" name="ownerName" className="input-premium !pl-12" value={profileForm.ownerName} onChange={handleProfileChange} placeholder="Enter owner name" />
                                            </div>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Email Address *</label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input type="email" name="email" className="input-premium !pl-12" value={profileForm.email} onChange={handleProfileChange} placeholder="email@domain.com" />
                                            </div>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Phone / Mobile *</label>
                                            <div className="relative">
                                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input type="tel" name="mobile" className="input-premium !pl-12" value={profileForm.mobile} onChange={handleProfileChange} placeholder="9876543210" />
                                            </div>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Business Name *</label>
                                            <div className="relative">
                                                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input type="text" name="businessName" className="input-premium !pl-12" value={profileForm.businessName} onChange={handleProfileChange} placeholder="RestoBoard Enterprise" />
                                            </div>
                                        </div>
                                        {user?.role === 'SUPER_ADMIN' && (
                                            <div className="form-group-premium md:col-span-2">
                                                <label className="!text-indigo-600 flex items-center gap-2"><Shield size={14} /> Module Type (Admin Only)</label>
                                                <select name="restaurantType" className="input-premium appearance-none cursor-pointer" value={profileForm.restaurantType} onChange={handleProfileChange}>
                                                    <option value="SMART">SMART</option>
                                                    <option value="EFFICIENT">EFFICIENT</option>
                                                    <option value="ENTERPRISE">ENTERPRISE</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end pt-8 border-t border-slate-50 mt-8">
                                        <button onClick={saveProfile} disabled={saving.profile} className="btn-premium-primary !py-4 !px-10">
                                            {saving.profile ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Profile</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Security / Password */}
                            {activeTab === 'password' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Lock size={20} className="text-indigo-600" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Security & Access Control</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">Update your account authentication credentials</p>
                                        </div>
                                    </div>

                                    {errors.password && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.password}</div>}
                                    {success.password && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Password updated successfully!</div>}

                                    <div className="space-y-6 max-w-lg">
                                        {[
                                            { name: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password', key: 'current' },
                                            { name: 'newPassword', label: 'New Password', placeholder: 'Min 6 characters', key: 'new' },
                                            { name: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password', key: 'confirm' },
                                        ].map(({ name, label, placeholder, key }) => (
                                            <div key={name} className="form-group-premium">
                                                <label>{label} *</label>
                                                <div className="relative">
                                                    <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type={showPasswords[key] ? 'text' : 'password'} name={name} className="input-premium !pl-12 !pr-12" value={passwordForm[name]} onChange={handlePasswordChange} placeholder={placeholder} />
                                                    <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                        {showPasswords[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end pt-8 border-t border-slate-50 mt-8">
                                        <button onClick={changePassword} disabled={saving.password} className="btn-premium-primary !py-4 !px-10">
                                            {saving.password ? <><Loader2 className="animate-spin" /> Updating...</> : <><Lock size={18} /> Change Password</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Printer Settings */}
                            {activeTab === 'printer' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Printer size={20} className="text-indigo-600" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thermal Printer Config</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">Configure your thermal receipt printer specifications</p>
                                        </div>
                                    </div>

                                    {errors.printer && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.printer}</div>}
                                    {success.printer && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Printer settings updated!</div>}

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight text-sm">Enable Thermal Printer</p>
                                                <p className="text-xs font-bold text-slate-400 mt-1">Activate direct thermal receipt printing</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" name="enabled" checked={printerForm.enabled} onChange={handlePrinterChange} className="sr-only peer" />
                                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                            </label>
                                        </div>

                                        {printerForm.enabled && (
                                            <div className="form-group-premium">
                                                <label>Paper Roll Width</label>
                                                <div className="flex gap-3">
                                                    {['58mm', '80mm'].map(w => (
                                                        <button key={w} type="button" onClick={() => setPrinterForm(prev => ({ ...prev, width: w }))}
                                                            className={`flex-1 p-5 rounded-2xl border-2 font-black text-sm uppercase tracking-widest transition-all ${printerForm.width === w ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 text-slate-400'}`}>
                                                            {w} {w === '58mm' ? '— Compact' : '— Standard'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-8 border-t border-slate-50 mt-8">
                                        {printerForm.enabled && (
                                            <button onClick={() => alert('Test print feature')} className="btn-premium-outline flex items-center gap-2">
                                                <TestTube size={18} /> Test Print
                                            </button>
                                        )}
                                        <button onClick={savePrinterSettings} disabled={saving.printer} className="btn-premium-primary !py-4 !px-10">
                                            {saving.printer ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Printer Config</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Bill Format */}
                            {activeTab === 'bill' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center gap-3 mb-8">
                                        <FileText size={20} className="text-indigo-600" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Receipt Format</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">Customize the layout and content of your bills</p>
                                        </div>
                                    </div>

                                    {errors.bill && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.bill}</div>}
                                    {success.bill && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Bill format updated!</div>}

                                    <div className="space-y-6">
                                        <div className="form-group-premium">
                                            <label>Bill Header Text</label>
                                            <textarea name="header" className="input-premium !h-24" value={billForm.header} onChange={handleBillChange} placeholder="Text to appear at the top of all receipts..." />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Bill Footer Text</label>
                                            <textarea name="footer" className="input-premium !h-24" value={billForm.footer} onChange={handleBillChange} placeholder="Thank you message or T&C at the bottom..." />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="form-group-premium">
                                                <label>GST Registration Number</label>
                                                <input type="text" name="gstNo" className="input-premium uppercase" value={billForm.gstNo} onChange={handleBillChange} placeholder="27AAAAA0000A1Z5" />
                                            </div>
                                            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 self-end">
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm uppercase tracking-tight">Auto-Print Bills</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Print automatically after each order</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer ml-auto">
                                                    <input type="checkbox" name="autoPrint" checked={billForm.autoPrint} onChange={handleBillChange} className="sr-only peer" />
                                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-8 border-t border-slate-50 mt-8">
                                        <button onClick={saveBillSettings} disabled={saving.bill} className="btn-premium-primary !py-4 !px-10">
                                            {saving.bill ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Bill Format</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Appearance */}
                            {activeTab === 'appearance' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Palette size={20} className="text-indigo-600" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Appearance & Layout</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">Personalize the look and feel of your POS terminal</p>
                                        </div>
                                    </div>

                                    {errors.profile && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.profile}</div>}
                                    {success.profile && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Layout preference saved!</div>}

                                    <div className="form-group-premium">
                                        <label>Billing Page Layout Mode</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                            {[
                                                { val: 'SIDEBAR', label: 'Sidebar Layout', sub: 'Categories in a left-side panel', icon: <LayoutTemplate size={28} /> },
                                                { val: 'TOP_HEADER', label: 'Top Header Layout', sub: 'Categories displayed across the top', icon: <Sliders size={28} /> }
                                            ].map(({ val, label, sub, icon }) => (
                                                <button key={val} type="button" onClick={() => setProfileForm(prev => ({ ...prev, billingLayout: val }))}
                                                    className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 text-center transition-all ${profileForm.billingLayout === val ? 'border-indigo-600 bg-indigo-50/60 shadow-lg shadow-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${profileForm.billingLayout === val ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'} transition-all`}>{icon}</div>
                                                    <div>
                                                        <div className={`font-black text-base uppercase tracking-tight ${profileForm.billingLayout === val ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</div>
                                                        <div className="text-xs font-bold text-slate-400 mt-1">{sub}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-8 border-t border-slate-50 mt-8">
                                        <button onClick={saveLayout} disabled={saving.profile} className="btn-premium-primary !py-4 !px-10">
                                            {saving.profile ? <><Loader2 className="animate-spin" /> Applying...</> : <><Palette size={18} /> Apply Layout</>}
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
