import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './SettingsPage.css';
import {
    User, Key, Printer, FileText, Eye, EyeOff,
    Save, CheckCircle, Palette, AlertCircle, Loader2,
    Building2, Phone, Mail, Lock, Settings, TestTube,
    LayoutTemplate, Shield, ChevronRight, Sliders, Ticket, Plus, Trash2, Edit, Gift, Hash, List, CalendarDays, Search
} from 'lucide-react';

const SettingsPage = () => {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Read initial tab from URL or default to profile
    const initialTab = new URLSearchParams(location.search).get('tab') || 'printer';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab changes when URL changes (e.g., clicking sidebar link)
    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab) setActiveTab(tab);
    }, [location.search]);

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
    const [loyaltyForm, setLoyaltyForm] = useState({
        enabled: false,
        points_per_100: 1,
        target_points: 0,
        point_value: 1
    });
    const [coupons, setCoupons] = useState([]);
    const [couponForm, setCouponForm] = useState({
        coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '',
        type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0
    });
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [billSeriesForm, setBillSeriesForm] = useState({
        dine_in: { numbering_method: 'Automatic', prefix: 'DI', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        takeaway: { numbering_method: 'Automatic', prefix: 'TA', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        delivery: { numbering_method: 'Automatic', prefix: 'DE', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        parcel: { numbering_method: 'Automatic', prefix: 'PA', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        party: { numbering_method: 'Automatic', prefix: 'PT', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' }
    });

    // Bill History State
    const [billsHistory, setBillsHistory] = useState([]);
    const [loadingBills, setLoadingBills] = useState(false);
    const [billDateFilter, setBillDateFilter] = useState('TODAY');
    const [billTypeFilter, setBillTypeFilter] = useState('ALL');
    const [billSearchQuery, setBillSearchQuery] = useState('');

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
                if (result.data.loyalty) setLoyaltyForm(result.data.loyalty);
                if (result.data.billSeries) setBillSeriesForm(result.data.billSeries);
            }

            // Fetch Coupons
            const couponResponse = await fetch(`${import.meta.env.VITE_API_URL}/coupons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const couponResult = await couponResponse.json();
            if (couponResult.success) setCoupons(couponResult.data);
        } catch (err) { console.error("Failed to fetch settings", err); }
        finally { setLoading(false); }
    };

    const fetchBillHistory = async () => {
        setLoadingBills(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            let start = new Date();
            let end = new Date();
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            const today = new Date();
            if (billDateFilter === 'WEEK') {
                start.setDate(today.getDate() - today.getDay());
            } else if (billDateFilter === 'MONTH') {
                start.setDate(1);
            } else if (billDateFilter === 'YEAR') {
                start.setMonth(0, 1);
            }

            let query = `?status=ALL`;
            if (billDateFilter !== 'ALL_TIME') {
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }
            if (billTypeFilter !== 'ALL') query += `&type=${billTypeFilter}`;
            if (billSearchQuery) query += `&search=${billSearchQuery}`;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/bills${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) setBillsHistory(result.data);
            else setBillsHistory([]);
        } catch (err) {
            console.error("Failed to fetch bill history", err);
            setBillsHistory([]);
        } finally {
            setLoadingBills(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    useEffect(() => {
        if (activeTab === 'bill_history') {
            fetchBillHistory();
        }
    }, [activeTab, billDateFilter, billTypeFilter]);

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

    const saveLoyaltySettings = async () => {
        setSaving(prev => ({ ...prev, loyalty: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/loyalty`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(loyaltyForm)
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, loyalty: true })); setTimeout(() => setSuccess(prev => ({ ...prev, loyalty: false })), 3000); }
            else { setErrors(prev => ({ ...prev, loyalty: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, loyalty: 'Failed to update loyalty settings' })); }
        finally { setSaving(prev => ({ ...prev, loyalty: false })); }
    };

    const saveBillSeries = async () => {
        setSaving(prev => ({ ...prev, billSeries: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/bill-series`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ billSeries: billSeriesForm })
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, billSeries: true })); setTimeout(() => setSuccess(prev => ({ ...prev, billSeries: false })), 3000); }
            else { setErrors(prev => ({ ...prev, billSeries: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, billSeries: 'Failed to update bill series' })); }
        finally { setSaving(prev => ({ ...prev, billSeries: false })); }
    };

    const TABS = [
        { id: 'printer', icon: <Printer size={18} />, label: 'Printer', sub: 'Thermal setup' },
        { id: 'bill', icon: <FileText size={18} />, label: 'Bill Format', sub: 'Receipt style' },
        { id: 'coupons', icon: <Ticket size={18} />, label: 'Coupons', sub: 'Offers & BOGO' },
        { id: 'loyalty', icon: <Gift size={18} />, label: 'Loyalty', sub: 'Points & Rewards' },
        { id: 'bill_numbering', icon: <Hash size={18} />, label: 'Bill Series', sub: 'Number sequence' },
        { id: 'bill_history', icon: <List size={18} />, label: 'Generated Bills', sub: 'View all bills' },
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
                                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); navigate(`?tab=${tab.id}`, { replace: true }); }}
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

                            {/* Coupon Management */}
                            {activeTab === 'coupons' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <Ticket size={20} className="text-indigo-600" />
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Coupon Management</h3>
                                                <p className="text-xs font-bold text-slate-400 mt-0.5">Manage promotional codes and BOGO offers</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Coupon Form */}
                                        <div className="space-y-6">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-lg w-fit">
                                                {editingCouponId ? 'Update Existing Coupon' : 'Create New Coupon Master'}
                                            </p>
                                            <div className="form-group-premium">
                                                <label>Coupon Name *</label>
                                                <input type="text" className="input-premium" value={couponForm.coupon_name} onChange={(e) => setCouponForm({ ...couponForm, coupon_name: e.target.value })} placeholder="e.g. Summer Festival" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="form-group-premium">
                                                    <label>Number From *</label>
                                                    <input type="number" className="input-premium" value={couponForm.num_from} onChange={(e) => setCouponForm({ ...couponForm, num_from: e.target.value })} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Number To *</label>
                                                    <input type="number" className="input-premium" value={couponForm.num_to} onChange={(e) => setCouponForm({ ...couponForm, num_to: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="form-group-premium">
                                                    <label>Start Date *</label>
                                                    <input type="date" className="input-premium" value={couponForm.start_date ? couponForm.start_date.split('T')[0] : ''} onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>End Date *</label>
                                                    <input type="date" className="input-premium" value={couponForm.end_date ? couponForm.end_date.split('T')[0] : ''} onChange={(e) => setCouponForm({ ...couponForm, end_date: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Coupon Type</label>
                                                <select className="input-premium" value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
                                                    <option value="DISCOUNT">Fixed / Percentage Discount</option>
                                                    <option value="BOGO">Buy 1 Get 1 Free (BOGO)</option>
                                                </select>
                                            </div>
                                            {couponForm.type === 'DISCOUNT' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="form-group-premium">
                                                        <label>Disc. Mode</label>
                                                        <select className="input-premium" value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                                                            <option value="PERCENT">Percentage (%)</option>
                                                            <option value="FIXED">Fixed Amount (₹)</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Amount / %</label>
                                                        <input type="number" className="input-premium" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-2 pt-4">
                                                {editingCouponId && (
                                                    <button onClick={() => { setEditingCouponId(null); setCouponForm({ coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '', type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0 }); }} className="btn-premium-outline !py-3 flex-1">CANCEL</button>
                                                )}
                                                <button onClick={async () => {
                                                    const savedUser = localStorage.getItem('user');
                                                    const { token } = JSON.parse(savedUser);
                                                    const method = editingCouponId ? 'PUT' : 'POST';
                                                    const url = editingCouponId ? `${import.meta.env.VITE_API_URL}/coupons/${editingCouponId}` : `${import.meta.env.VITE_API_URL}/coupons`;
                                                    const res = await fetch(url, {
                                                        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                        body: JSON.stringify(couponForm)
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert('Coupon saved!');
                                                        setEditingCouponId(null);
                                                        setCouponForm({ coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '', type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0 });
                                                        // Refresh list
                                                        const fresh = await fetch(`${import.meta.env.VITE_API_URL}/coupons`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
                                                        if (fresh.success) setCoupons(fresh.data);
                                                    }
                                                }} className="btn-premium-primary !py-3 flex-[2]">
                                                    {editingCouponId ? 'UPDATE COUPON' : 'CREATE COUPON'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Coupon List */}
                                        <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col min-h-[500px]">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Existing Coupon Ranges</p>
                                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                                {coupons.map(c => (
                                                    <div key={c._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="font-black text-slate-800 tracking-tight">{c.coupon_name}</h4>
                                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{c.type}</span>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button onClick={() => { setEditingCouponId(c._id); setCouponForm(c); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><Edit size={14} /></button>
                                                                <button onClick={async () => {
                                                                    if (!window.confirm('Delete this coupon range?')) return;
                                                                    const savedUser = localStorage.getItem('user');
                                                                    const { token } = JSON.parse(savedUser);
                                                                    await fetch(`${import.meta.env.VITE_API_URL}/coupons/${c._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                                                    setCoupons(prev => prev.filter(x => x._id !== c._id));
                                                                }} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Range</p>
                                                                <p className="text-xs font-black text-slate-700">{c.num_from} — {c.num_to}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Value</p>
                                                                <p className="text-xs font-black text-slate-700">{c.type === 'DISCOUNT' ? (c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `₹${c.discount_value}`) : 'BOGO'}</p>
                                                            </div>
                                                            <div className="col-span-2 space-y-1 mt-1 border-t border-slate-50 pt-3">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Validity Period</p>
                                                                <p className="text-[11px] font-bold text-slate-500">{new Date(c.start_date).toLocaleDateString()} to {new Date(c.end_date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {coupons.length === 0 && (
                                                    <div className="text-center py-20">
                                                        <Ticket size={40} className="text-slate-200 mx-auto mb-3" />
                                                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No active coupons</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Loyalty Settings */}
                            {activeTab === 'loyalty' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <Gift size={20} className="text-indigo-600" />
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Loyalty Rewards</h3>
                                                <p className="text-xs font-bold text-slate-400 mt-0.5">Configure point-based customer rewards</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Enable Loyalty Program</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Activate points accumulation for all customers</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={loyaltyForm.enabled} 
                                                    onChange={e => setLoyaltyForm({ ...loyaltyForm, enabled: e.target.checked })} />
                                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="form-group-premium">
                                                <label>Points Earned Per ₹100 Spent</label>
                                                <input type="number" className="input-premium" value={loyaltyForm.points_per_100} 
                                                    onChange={e => setLoyaltyForm({ ...loyaltyForm, points_per_100: e.target.value })} 
                                                    placeholder="e.g. 1" />
                                                <p className="text-[10px] font-bold text-slate-400 mt-2">1 Point per ₹100 is standard.</p>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Target Points for Redemption</label>
                                                <input type="number" className="input-premium" value={loyaltyForm.target_points} 
                                                    onChange={e => setLoyaltyForm({ ...loyaltyForm, target_points: e.target.value })} 
                                                    placeholder="e.g. 500" />
                                                <p className="text-[10px] font-bold text-slate-400 mt-2">Minimum points required in wallet to redeem.</p>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Redemption Value per Point (₹)</label>
                                                <input type="number" className="input-premium" value={loyaltyForm.point_value} 
                                                    onChange={e => setLoyaltyForm({ ...loyaltyForm, point_value: e.target.value })} 
                                                    placeholder="e.g. 1" />
                                                <p className="text-[10px] font-bold text-slate-400 mt-2">How many Rupees is each point worth?</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-8 border-t border-slate-50 mt-8">
                                            <button onClick={saveLoyaltySettings} disabled={saving.loyalty} className="btn-premium-primary !py-4 !px-10">
                                                {saving.loyalty ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save size={18} /> Update Rewards</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bill Numbering Settings */}
                            {activeTab === 'bill_numbering' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Hash size={20} className="text-indigo-600" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bill Number Series</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">Configure separate sequences for different order types</p>
                                        </div>
                                    </div>

                                    {errors.billSeries && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.billSeries}</div>}
                                    {success.billSeries && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Bill series updated successfully!</div>}

                                    <div className="space-y-8">
                                        {Object.keys(billSeriesForm).map((key) => (
                                            <div key={key} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{key.replace('_', ' ')} Series</h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div className="form-group-premium">
                                                        <label>Numbering Method</label>
                                                        <select className="input-premium" 
                                                            value={billSeriesForm[key].numbering_method || 'Automatic'} 
                                                            onChange={e => setBillSeriesForm({
                                                                ...billSeriesForm,
                                                                [key]: { ...billSeriesForm[key], numbering_method: e.target.value }
                                                            })}>
                                                            <option value="Automatic">Automatic</option>
                                                            <option value="Manual">Manual</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Restart After</label>
                                                        <select className="input-premium" 
                                                            value={billSeriesForm[key].restart_after || 'Never'} 
                                                            onChange={e => setBillSeriesForm({
                                                                ...billSeriesForm,
                                                                [key]: { ...billSeriesForm[key], restart_after: e.target.value }
                                                            })}>
                                                            <option value="Yearly">Yearly (1st April)</option>
                                                            <option value="Monthly">Monthly</option>
                                                            <option value="Daily">Daily</option>
                                                            <option value="Never">Never</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Starting Number</label>
                                                        <input type="number" className="input-premium" 
                                                            value={billSeriesForm[key].starting_number || 1} 
                                                            onChange={e => setBillSeriesForm({
                                                                ...billSeriesForm,
                                                                [key]: { ...billSeriesForm[key], starting_number: parseInt(e.target.value) || 1 }
                                                            })} />
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Prefix</label>
                                                        <input type="text" className="input-premium uppercase" 
                                                            value={billSeriesForm[key].prefix || ''} 
                                                            onChange={e => setBillSeriesForm({
                                                                ...billSeriesForm,
                                                                [key]: { ...billSeriesForm[key], prefix: e.target.value.toUpperCase() }
                                                            })} 
                                                            placeholder="e.g. DI" />
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Suffix</label>
                                                        <input type="text" className="input-premium uppercase" 
                                                            value={billSeriesForm[key].suffix || ''} 
                                                            onChange={e => setBillSeriesForm({
                                                                ...billSeriesForm,
                                                                [key]: { ...billSeriesForm[key], suffix: e.target.value.toUpperCase() }
                                                            })} 
                                                            placeholder="e.g. 24-25" />
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label>Next Number (Current)</label>
                                                        <input type="number" className="input-premium" 
                                                            value={billSeriesForm[key].next_number || 1} 
                                                            onChange={e => setBillSeriesForm({
                                                                ...billSeriesForm,
                                                                [key]: { ...billSeriesForm[key], next_number: parseInt(e.target.value) || 1 }
                                                            })} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-end pt-8 border-t border-slate-50 mt-8">
                                            <button onClick={saveBillSeries} disabled={saving.billSeries} className="btn-premium-primary !py-4 !px-10">
                                                {saving.billSeries ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save size={18} /> Save All Series</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bill History Settings */}
                            {activeTab === 'bill_history' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in flex flex-col min-h-[600px]">
                                    <div className="flex items-center gap-3 mb-8">
                                        <List size={20} className="text-indigo-600" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Generated Bills</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">View and filter all previous transactions</p>
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-wrap gap-4 mb-6">
                                        <div className="flex-1 min-w-[200px] relative">
                                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" placeholder="Search Bill No, Customer or Table..." 
                                                className="input-premium !pl-12 w-full"
                                                value={billSearchQuery} onChange={(e) => setBillSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && fetchBillHistory()}
                                            />
                                        </div>
                                        <select className="input-premium !px-4 !py-3 bg-white w-40 cursor-pointer" 
                                            value={billDateFilter} onChange={(e) => setBillDateFilter(e.target.value)}>
                                            <option value="TODAY">Today</option>
                                            <option value="WEEK">This Week</option>
                                            <option value="MONTH">This Month</option>
                                            <option value="YEAR">This Year</option>
                                            <option value="ALL_TIME">All Time</option>
                                        </select>
                                        <select className="input-premium !px-4 !py-3 bg-white w-48 cursor-pointer" 
                                            value={billTypeFilter} onChange={(e) => setBillTypeFilter(e.target.value)}>
                                            <option value="ALL">All Order Types</option>
                                            <option value="DINE_IN">Dine In</option>
                                            <option value="TAKEAWAY">Takeaway</option>
                                            <option value="PARCEL">Parcel</option>
                                            <option value="DELIVERY">Delivery</option>
                                            <option value="PARTY">Party Order</option>
                                            <option value="SELF_SERVICE">Self Service</option>
                                        </select>
                                        <button onClick={fetchBillHistory} className="btn-premium-primary !py-3 !px-6 shrink-0">
                                            <Search size={16} /> Fetch
                                        </button>
                                    </div>

                                    {/* Datatable */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden flex-1 flex flex-col">
                                        <div className="overflow-x-auto flex-1 custom-scrollbar max-h-[500px]">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-md">
                                                        <th className="p-4 text-xs font-black tracking-widest text-slate-500 uppercase rounded-tl-3xl">Bill No</th>
                                                        <th className="p-4 text-xs font-black tracking-widest text-slate-500 uppercase">Date & Time</th>
                                                        <th className="p-4 text-xs font-black tracking-widest text-slate-500 uppercase">Type</th>
                                                        <th className="p-4 text-xs font-black tracking-widest text-slate-500 uppercase">Customer / Table</th>
                                                        <th className="p-4 text-xs font-black tracking-widest text-slate-500 uppercase">Status</th>
                                                        <th className="p-4 text-xs font-black tracking-widest text-slate-500 uppercase text-right rounded-tr-3xl">Total (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {loadingBills ? (
                                                        <tr><td colSpan="6" className="p-10 text-center flex flex-col items-center justify-center text-slate-400 gap-2"><Loader2 className="animate-spin" /> Fetching latest bills...</td></tr>
                                                    ) : billsHistory.length === 0 ? (
                                                        <tr><td colSpan="6" className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest">No matching bills found</td></tr>
                                                    ) : (
                                                        billsHistory.map(b => (
                                                            <tr key={b._id} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="p-4">
                                                                    <span className="font-black text-slate-800 text-sm">{b.bill_number}</span>
                                                                </td>
                                                                <td className="p-4 text-xs font-bold text-slate-500">
                                                                    {new Date(b.createdAt).toLocaleString('en-IN', { hour12: true, dateStyle: 'short', timeStyle: 'short' })}
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                                                                        {b.type ? b.type.replace('_', ' ') : 'WALK IN'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-xs font-bold text-slate-600">
                                                                    {b.customer_name || 'Walk-in'} {b.customer_phone ? `(${b.customer_phone})` : ''}
                                                                    {b.table_no && <span className="ml-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">{b.table_no}</span>}
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className={`text-[10px] inline-flex items-center gap-1 font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                                                        b.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                                                                        b.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                                                                        'bg-amber-50 text-amber-600'
                                                                    }`}>
                                                                        {b.status} {b.status === 'PAID' && b.payment_mode ? `· ${b.payment_mode}` : ''}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-right font-black text-slate-800 text-sm">
                                                                    ₹{(b.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
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
