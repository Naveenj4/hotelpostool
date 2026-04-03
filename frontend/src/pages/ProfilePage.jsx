import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './SettingsPage.css';
import {
    User, Key, Save, CheckCircle, AlertCircle, Loader2,
    Building2, Phone, Mail, ChevronRight, Database, 
    Download, Upload, Folder, RefreshCw, Plus, Trash2, 
    FileJson, HardDrive, Clock, ShieldCheck, Eye, ArrowLeft
} from 'lucide-react';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    
    const initialTab = new URLSearchParams(location.search).get('tab') || 'view';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Profile State
    const [isNewProfile, setIsNewProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        ownerName: '',
        email: '',
        mobile: '',
        businessName: '',
        store_name: '',
        print_name: '',
        restaurantType: 'SMART',
        address: '',
        fssai_no: '',
        gstin: '',
        financial_year_start: '',
        financial_year_end: '',
        books_from: ''
    });
    
    // Backup State
    const [backupPath, setBackupPath] = useState(() => localStorage.getItem('backup_path') || 'C:/RestoBoard/Backups');
    const [autoBackupOnClose, setAutoBackupOnClose] = useState(() => localStorage.getItem('auto_backup_on_close') === 'true');
    const [lastBackup, setLastBackup] = useState(null);
    const [diskSpaceWarning, setDiskSpaceWarning] = useState(false);

    // Restore State
    const [restoreType, setRestoreType] = useState('BACKUP'); // BACKUP or DATA
    const [selectedFile, setSelectedFile] = useState(null);

    const [saving, setSaving] = useState({});
    const [success, setSuccess] = useState({});
    const [errors, setErrors] = useState({});

    const fetchProfile = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success && result.data) {
                const profile = result.data.profile || {};
                const restaurant = result.data.restaurant || {};
                setProfileForm({
                    ownerName: profile.ownerName || '',
                    email: profile.email || '',
                    mobile: profile.mobile || profile.phone || '',
                    businessName: profile.businessName || '',
                    store_name: restaurant.store_name || '',
                    print_name: restaurant.print_name || '',
                    restaurantType: restaurant.restaurant_type || 'SMART',
                    address: restaurant.address || '',
                    fssai_no: restaurant.fssai_no || '',
                    gstin: restaurant.gstin || '',
                    financial_year_start: restaurant.financial_year_start ? new Date(restaurant.financial_year_start).toISOString().split('T')[0] : '',
                    financial_year_end: restaurant.financial_year_end ? new Date(restaurant.financial_year_end).toISOString().split('T')[0] : '',
                    books_from: restaurant.books_from ? new Date(restaurant.books_from).toISOString().split('T')[0] : ''
                });
            }
        } catch (err) { console.error("Failed to fetch profile", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchProfile();
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab) setActiveTab(tab);
    }, [location.search]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const handleProfileChange = (e) => { 
        const { name, value } = e.target; 
        setProfileForm(prev => ({ ...prev, [name]: value })); 
        setErrors(prev => ({ ...prev, profile: '' }));
    };

    const saveProfile = async () => {
        setSaving(prev => ({ ...prev, profile: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            const endpoint = isNewProfile ? '/settings/new-profile' : '/settings/profile';
            const method = isNewProfile ? 'POST' : 'PUT';

            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method, 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileForm)
            });
            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, profile: true }));
                setIsNewProfile(false);
                if (isNewProfile) {
                    alert("New profile created! Application will refresh.");
                    window.location.reload();
                }
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else { setErrors(prev => ({ ...prev, profile: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, profile: 'Failed to update profile' })); }
        finally { setSaving(prev => ({ ...prev, profile: false })); }
    };

    const handleBackup = async () => {
        setSaving(prev => ({ ...prev, backup: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ backupPath })
            });
            const result = await response.json();
            if (result.success) {
                setLastBackup(new Date().toLocaleString());
                setSuccess(prev => ({ ...prev, backup: true }));
                setTimeout(() => setSuccess(prev => ({ ...prev, backup: false })), 5000);
            } else {
                if (result.message?.toLowerCase().includes('space') || result.message?.toLowerCase().includes('full')) {
                    setDiskSpaceWarning(true);
                }
                setErrors(prev => ({ ...prev, backup: result.message }));
            }
        } catch (err) { setErrors(prev => ({ ...prev, backup: 'Failed to create backup' })); }
        finally { setSaving(prev => ({ ...prev, backup: false })); }
    };

    const handleBackupPathChange = (val) => {
        setBackupPath(val);
        localStorage.setItem('backup_path', val);
    };

    const handleAutoBackupToggle = (val) => {
        setAutoBackupOnClose(val);
        localStorage.setItem('auto_backup_on_close', val);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    setSelectedFile(data);
                } catch (err) {
                    alert('Invalid backup file format');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) return alert('Please select a backup file');
        if (!window.confirm('WARNING: This will overwrite your current data. Continue?')) return;
        
        setSaving(prev => ({ ...prev, restore: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ backupData: selectedFile })
            });
            const result = await response.json();
            if (result.success) {
                alert('Database restored successfully! The application will now reload.');
                window.location.reload();
            } else { setErrors(prev => ({ ...prev, restore: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, restore: 'Failed to restore data' })); }
        finally { setSaving(prev => ({ ...prev, restore: false })); }
    };

    const TABS = [
        { id: 'view', icon: <Eye size={18} />, label: 'VIEW', sub: 'Profile info' },
        { id: 'backup', icon: <Download size={18} />, label: 'BACKUP', sub: 'Data safety' },
        { id: 'restore', icon: <RefreshCw size={18} />, label: 'RESTORE', sub: 'Recover data' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <User className="animate-pulse text-indigo-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Loading profile...</p>
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
                                <ShieldCheck className="text-emerald-500" size={18} />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">System & Profile</span>
                            </div>
                            <h2>Database & Profile</h2>
                            <p>Manage your business identity and keep your data secure with automated backups.</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                className={`btn-premium-primary !border-transparent ${isNewProfile ? '!bg-emerald-600 !text-white' : '!bg-indigo-600 !text-white'}`} 
                                onClick={() => { 
                                    if (isNewProfile) { fetchProfile(); setIsNewProfile(false); }
                                    else {
                                        setProfileForm({ 
                                            ownerName: '', email: '', mobile: '', businessName: '', 
                                            store_name: '', print_name: '', restaurantType: 'SMART',
                                            address: '', fssai_no: '', gstin: '',
                                            financial_year_start: '', financial_year_end: '', books_from: ''
                                        }); 
                                        setIsNewProfile(true); 
                                        setActiveTab('view');
                                    }
                                }}>
                                {isNewProfile ? <><ArrowLeft size={16} /> CANCEL NEW</> : <><Plus size={16} /> NEW PROFILE</>}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Tab Navigation */}
                        <div className="w-full lg:w-72 shrink-0">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-3 sticky top-6">
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

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                            {activeTab === 'view' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="mb-10 pb-6 border-b border-slate-50">
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Company Identity</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Primary business and owner details</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                        <div className="form-group-premium">
                                            <label>Company Name *</label>
                                            <input type="text" name="businessName" className="input-premium" value={profileForm.businessName} onChange={handleProfileChange} placeholder="Company Legal Name" />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Store Name *</label>
                                            <input type="text" name="store_name" className="input-premium" value={profileForm.store_name} onChange={handleProfileChange} placeholder="Operating Store Name" />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Print Name *</label>
                                            <input type="text" name="print_name" className="input-premium" value={profileForm.print_name} onChange={handleProfileChange} placeholder="Name on Bills" />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Owner Name *</label>
                                            <input type="text" name="ownerName" className="input-premium" value={profileForm.ownerName} onChange={handleProfileChange} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Email ID</label>
                                            <input type="email" name="email" className="input-premium" value={profileForm.email} onChange={handleProfileChange} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Mobile Number</label>
                                            <input type="tel" name="mobile" className="input-premium" value={profileForm.mobile} onChange={handleProfileChange} />
                                        </div>
                                    </div>

                                    <div className="mb-10 pb-6 border-b border-slate-50">
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Regulatory & Fiscal</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tax identifiers and accounting period</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                        <div className="form-group-premium">
                                            <label>Financial Year Start</label>
                                            <input type="date" name="financial_year_start" className="input-premium" value={profileForm.financial_year_start} onChange={handleProfileChange} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Financial Year End</label>
                                            <input type="date" name="financial_year_end" className="input-premium" value={profileForm.financial_year_end} onChange={handleProfileChange} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Books Commencing From</label>
                                            <input type="date" name="books_from" className="input-premium" value={profileForm.books_from} onChange={handleProfileChange} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Business Type</label>
                                            <select name="restaurantType" className="input-premium" value={profileForm.restaurantType} onChange={handleProfileChange}>
                                                <option value="SMART">SMART POS</option>
                                                <option value="EFFICIENT">EFFICIENT POS</option>
                                                <option value="ENTERPRISE">ENTERPRISE POS</option>
                                            </select>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>GSTIN / Tax No</label>
                                            <input type="text" name="gstin" className="input-premium" value={profileForm.gstin} onChange={handleProfileChange} placeholder="Tax Identifier" />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>FSSAI License No</label>
                                            <input type="text" name="fssai_no" className="input-premium" value={profileForm.fssai_no} onChange={handleProfileChange} placeholder="Food License No" />
                                        </div>
                                        <div className="form-group-premium md:col-span-2">
                                            <label>Full Address</label>
                                            <textarea name="address" className="input-premium !h-24 py-3 resize-none" value={profileForm.address} onChange={handleProfileChange} placeholder="Registered Business Address"></textarea>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-10 border-t border-slate-50">
                                        <button onClick={saveProfile} disabled={saving.profile} className={`btn-premium-primary !py-4 !px-16 shadow-xl ${isNewProfile ? '!bg-emerald-600 shadow-emerald-100' : 'shadow-indigo-100'}`}>
                                            {saving.profile ? <Loader2 className="animate-spin" /> : <Save size={18} />} 
                                            {isNewProfile ? ' CREATE NEW PROFILE' : ' UPDATE PROFILE'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'backup' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">System Backup</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-1">Configure your automatic and manual data exports</p>
                                        </div>
                                        {lastBackup && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full">
                                                <Clock size={14} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase">Last: {lastBackup}</span>
                                            </div>
                                        )}
                                    </div>

                                    {diskSpaceWarning && (
                                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4 text-amber-700 mb-8">
                                            <AlertCircle size={24} className="shrink-0" />
                                            <div>
                                                <p className="font-black text-sm uppercase">Disk Space Warning!</p>
                                                <p className="text-xs font-bold opacity-80 mt-1">The system has detected that your storage drive might be nearly full. Please clear space to ensure backup integrity.</p>
                                            </div>
                                        </div>
                                    )}

                                    {success.backup && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4 text-emerald-700 mb-8">
                                            <CheckCircle size={24} />
                                            <div>
                                                <p className="font-black text-sm uppercase">Backup Successful</p>
                                                <p className="text-xs font-bold opacity-80">Your data has been securely archived with the current timestamp.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-8">
                                        <div className="form-group-premium">
                                            <label className="!text-indigo-600 flex items-center gap-2"><Folder size={14} /> Backup Storage Path</label>
                                            <div className="flex gap-3">
                                                <div className="relative flex-1">
                                                    <HardDrive size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="text" className="input-premium !pl-12 font-mono text-sm" value={backupPath} onChange={e => handleBackupPathChange(e.target.value)} />
                                                </div>
                                                <button className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:bg-white hover:shadow-lg">
                                                    <Folder size={18} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">Tip: By default, this points to your installation directory.</p>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <RefreshCw size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase text-slate-700">Auto-Backup on Close</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compulsory archive when leaving</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={autoBackupOnClose} onChange={e => handleAutoBackupToggle(e.target.checked)} className="sr-only peer" />
                                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-12 bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100/50">
                                        <button onClick={handleBackup} disabled={saving.backup} className="btn-premium-primary !bg-indigo-600 !text-white !border-transparent !py-4 !px-12 shadow-xl shadow-indigo-100">
                                            {saving.backup ? <Loader2 className="animate-spin" /> : <Database size={18} />} RUN MANUAL BACKUP
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'restore' && (
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10 fade-in">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Data Restoration</h3>
                                    
                                    <div className="flex gap-4 mb-10">
                                        <button onClick={() => setRestoreType('BACKUP')} 
                                            className={`flex-1 p-6 rounded-[2.5rem] border transition-all text-center ${restoreType === 'BACKUP' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-200'}`}>
                                            <Download className="mx-auto mb-3" size={32} />
                                            <p className="font-black text-sm uppercase">Full Backup File</p>
                                            <p className="text-[10px] font-bold opacity-60 uppercase mt-1">Restore entire database</p>
                                        </button>
                                        <button onClick={() => setRestoreType('DATA')}
                                            className={`flex-1 p-6 rounded-[2.5rem] border transition-all text-center ${restoreType === 'DATA' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-200'}`}>
                                            <FileJson className="mx-auto mb-3" size={32} />
                                            <p className="font-black text-sm uppercase">Attach Data</p>
                                            <p className="text-[10px] font-bold opacity-60 uppercase mt-1">Import specific records</p>
                                        </button>
                                    </div>

                                    <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 text-center transition-all hover:border-indigo-300 group">
                                        <Upload className={`mx-auto mb-4 ${restoreType === 'BACKUP' ? 'text-indigo-400' : 'text-emerald-400'} group-hover:scale-110 transition-transform`} size={48} />
                                        <p className="font-black text-slate-700 uppercase">Drop {restoreType.toLowerCase()} file here</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6 text-center">Supported formats: .json, .archive</p>
                                        <input type="file" id="restore-file" className="hidden" accept=".json" onChange={handleFileSelect} />
                                        <label htmlFor="restore-file" className="btn-premium-primary !bg-white !text-slate-700 !border-slate-200 cursor-pointer inline-flex">
                                            SELECT FILE
                                        </label>
                                        {selectedFile && (
                                            <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs uppercase">
                                                <CheckCircle size={14} /> File Loaded Ready to Restore
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-50">
                                        <div className="flex items-center gap-4 text-rose-500">
                                            <AlertCircle size={20} />
                                            <p className="text-[10px] font-black uppercase leading-[1.2] max-w-[200px]">Data restoration cannot be undone. Always backup first.</p>
                                        </div>
                                        <button onClick={handleRestore} disabled={saving.restore || !selectedFile} className={`btn-premium-primary !py-4 !px-12 ${restoreType === 'BACKUP' ? '!bg-indigo-600' : '!bg-emerald-600'} !text-white shadow-xl`}>
                                            {saving.restore ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />} RUN RESTORATION
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

export default ProfilePage;
