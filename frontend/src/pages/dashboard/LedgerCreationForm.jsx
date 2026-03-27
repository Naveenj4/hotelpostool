import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';
import { Save, X, Calendar, User, Phone, Mail, Hash, CreditCard, MapPin, Building, Briefcase, ChevronLeft, Layers, ChevronDown } from 'lucide-react';
import './LedgerCreationForm.css';
import { STANDARD_GROUPS, getNatureForGroup, ACCOUNT_NATURES } from '../../utils/standardGroups';

const API = import.meta.env.VITE_API_URL;
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

export default function LedgerCreationForm() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [groups, setGroups] = useState([]);

    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        pan_number: '',
        party_category: '',
        registration_type: 'Regular',
        state: '',

        // 2. Address
        billing_address: '',
        shipping_address: '',
        same_as_billing: true,

        // 3. Accounts Details
        opening_balance: '',
        balance_type: 'DR', // DR = To Collect, CR = To Pay
        due_days: '',
        credit_limit: '',

        // 4. Contact Information
        contact_person: '',
        dob: '',

        // 5. Party Bank Details
        bank_account_number: '',
        ifsc_code: '',
        bank_name: '',
        branch: '',
        account_holder_name: '',

        // Ledger Group
        group: 'Sundry Debtors'
    });

    // Load groups from API
    useEffect(() => {
        fetch(`${API}/ledger-groups`, { headers: { Authorization: `Bearer ${getToken()}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setGroups(d.data); })
            .catch(console.error);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const upd = { ...prev, [name]: type === 'checkbox' ? checked : value };

            // Sync shipping address
            if (name === 'same_as_billing') {
                if (checked) upd.shipping_address = upd.billing_address;
            }
            if (name === 'billing_address' && upd.same_as_billing) {
                upd.shipping_address = value;
            }

            return upd;
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/ledgers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                alert('Ledger / Party created successfully!');
                navigate('/dashboard/self-service/ledgers');
            } else {
                alert(data.error || 'Failed to create ledger');
            }
        } catch (err) {
            alert('Failed to save data. ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="dashboard-layout ledg-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Ledger / Party Creation"
                    actions={
                        <div className="flex items-center gap-3">
                            <button className="btn-premium-primary !py-2 !px-6 !bg-slate-200 !text-slate-800" onClick={() => navigate(-1)}>
                                <X size={16} />
                                <span className="text-[10px] uppercase font-black">Cancel</span>
                            </button>
                            <button className="btn-premium-primary !py-2 !px-6" onClick={handleSave} disabled={saving}>
                                <Save size={16} />
                                <span className="text-[10px] uppercase font-black">{saving ? 'Saving...' : 'Save Ledger'}</span>
                            </button>
                        </div>
                    }
                />

                <div className="ledg-container fade-in">

                    <form className="ledg-form" onSubmit={handleSave}>
                        <div className="ledg-grid">

                            {/* 1. Ledger Details */}
                            <div className="ledg-section">
                                <h3 className="ledg-sec-title">1. Ledger Details</h3>
                                <div className="ledg-fields">
                                    <div className="ledg-f-group w-full">
                                        <label>Ledger Name <span className="req">*</span></label>
                                        <div className="ledg-input-wrap">
                                            <User className="ledg-ico" />
                                            <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp" />
                                        </div>
                                    </div>
                                    <div className="ledg-f-row">
                                        <div className="ledg-f-group">
                                            <label>Mobile No</label>
                                            <div className="ledg-input-wrap">
                                                <Phone className="ledg-ico" />
                                                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91" />
                                            </div>
                                        </div>
                                        <div className="ledg-f-group">
                                            <label>E-mail ID</label>
                                            <div className="ledg-input-wrap">
                                                <Mail className="ledg-ico" />
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@domain.com" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ledg-f-row">
                                        <div className="ledg-f-group">
                                            <label>GSTIN No</label>
                                            <div className="ledg-input-wrap">
                                                <Hash className="ledg-ico" />
                                                <input className="uppercase" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="GST Number" />
                                            </div>
                                        </div>
                                        <div className="ledg-f-group">
                                            <label>PAN No</label>
                                            <div className="ledg-input-wrap">
                                                <CreditCard className="ledg-ico" />
                                                <input className="uppercase" name="pan_number" value={formData.pan_number} onChange={handleChange} placeholder="PAN Number" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ledg-f-row">
                                        <div className="ledg-f-group">
                                            <label>Under <span className="req">*</span></label>
                                            <div className="ledg-input-wrap relative">
                                                <Layers className="ledg-ico" />
                                                <select
                                                    name="group"
                                                    value={formData.group}
                                                    onChange={handleChange}
                                                    className="ledg-select !pl-10"
                                                    required
                                                >
                                                    <option value="" disabled>-- Select Group --</option>
                                                    {Object.entries(STANDARD_GROUPS).map(([nature, groupsList]) => (
                                                        <optgroup key={nature} label={`── ${nature} ──`}>
                                                            {groupsList.map(g => <option key={g} value={g}>{g}</option>)}
                                                        </optgroup>
                                                    ))}
                                                    {/* Custom groups */}
                                                    {(groups && groups.length > 0) && (
                                                        <optgroup label="── CUSTOM GROUPS ──">
                                                            {groups.filter(g => !getNatureForGroup(g.name)).map(g => (
                                                                <option key={g._id} value={g.name}>{g.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                        <div className="ledg-f-group">
                                            <label>Ledger Category (+)</label>
                                            <input name="party_category" value={formData.party_category} onChange={handleChange} placeholder="Category" />
                                        </div>
                                    </div>
                                    <div className="ledg-f-row">
                                        <div className="ledg-f-group">
                                            <label>Registration Type</label>
                                            <select name="registration_type" value={formData.registration_type} onChange={handleChange} className="ledg-select">
                                                <option value="Regular">Regular</option>
                                                <option value="Composition">Composition</option>
                                                <option value="Unregistered">Unregistered</option>
                                                <option value="Consumer">Consumer</option>
                                            </select>
                                        </div>
                                        <div className="ledg-f-group">
                                            <label>State Name</label>
                                            <input name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Maharashtra" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Address */}
                            <div className="ledg-section">
                                <h3 className="ledg-sec-title">2. Address</h3>
                                <div className="ledg-fields">
                                    <div className="ledg-f-group w-full">
                                        <label>Billing Address</label>
                                        <div className="ledg-textarea-wrap">
                                            <MapPin className="ledg-ico" />
                                            <textarea name="billing_address" value={formData.billing_address} onChange={handleChange} rows={3} placeholder="Full address..." />
                                        </div>
                                    </div>
                                    <div className="ledg-checkbox-row">
                                        <label className="ledg-checkbox">
                                            <input type="checkbox" name="same_as_billing" checked={formData.same_as_billing} onChange={handleChange} />
                                            <span>&#x2611; Same as Billing</span>
                                        </label>
                                    </div>
                                    <div className="ledg-f-group w-full" style={{ opacity: formData.same_as_billing ? 0.5 : 1, pointerEvents: formData.same_as_billing ? 'none' : 'auto' }}>
                                        <label>Shipping Address</label>
                                        <div className="ledg-textarea-wrap">
                                            <MapPin className="ledg-ico" />
                                            <textarea name="shipping_address" value={formData.shipping_address} onChange={handleChange} rows={3} placeholder="Full address..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Accounts Details */}
                            <div className="ledg-section">
                                <h3 className="ledg-sec-title">3. Accounts Details</h3>
                                <div className="ledg-fields">

                                    <div className="ledg-f-row">
                                        <div className="ledg-f-group flex-1">
                                            <label>Opening Balance</label>
                                            <div className="ledg-input-wrap relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                                <input type="number" className="pl-10" name="opening_balance" value={formData.opening_balance} onChange={handleChange} placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div className="ledg-f-group auto-w">
                                            <label>&nbsp;</label>
                                            <div className="ledg-radio-group">
                                                <label className={`ledg-radio dr-cr ${formData.balance_type === 'DR' ? 'active-dr' : ''}`}>
                                                    <input type="radio" name="balance_type" value="DR" checked={formData.balance_type === 'DR'} onChange={handleChange} />
                                                    To Collect (DR)
                                                </label>
                                                <label className={`ledg-radio dr-cr ${formData.balance_type === 'CR' ? 'active-cr' : ''}`}>
                                                    <input type="radio" name="balance_type" value="CR" checked={formData.balance_type === 'CR'} onChange={handleChange} />
                                                    To Pay (CR)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ledg-f-row mt-2">
                                        <div className="ledg-f-group">
                                            <label>Due Day (Days)</label>
                                            <input type="number" name="due_days" value={formData.due_days} onChange={handleChange} placeholder="e.g. 30" />
                                        </div>
                                        <div className="ledg-f-group">
                                            <label>Credit Limit (₹)</label>
                                            <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleChange} placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Contact Information */}
                            <div className="ledg-section">
                                <h3 className="ledg-sec-title">4. Contact Information</h3>
                                <div className="ledg-fields">
                                    <div className="ledg-f-row">
                                        <div className="ledg-f-group">
                                            <label>Contact Person</label>
                                            <input name="contact_person" value={formData.contact_person} onChange={handleChange} placeholder="Full Name" />
                                        </div>
                                        <div className="ledg-f-group">
                                            <label>DOB (Date of Birth)</label>
                                            <div className="ledg-input-wrap">
                                                <Calendar className="ledg-ico" />
                                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Ledger Bank Details */}
                            <div className="ledg-section full-span">
                                <h3 className="ledg-sec-title">5. Ledger Bank Details</h3>
                                <div className="ledg-fields row-layout">
                                    <div className="ledg-f-group flex-1">
                                        <label>Bank A/C Number</label>
                                        <input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} />
                                    </div>
                                    <div className="ledg-f-group flex-[0.7]">
                                        <label>IFSC Code</label>
                                        <input className="uppercase" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} />
                                    </div>
                                    <div className="ledg-f-group flex-1">
                                        <label>Bank Name</label>
                                        <div className="ledg-input-wrap">
                                            <Building className="ledg-ico" />
                                            <input name="bank_name" value={formData.bank_name} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="ledg-f-group flex-1">
                                        <label>Branch</label>
                                        <input name="branch" value={formData.branch} onChange={handleChange} />
                                    </div>
                                    <div className="ledg-f-group flex-1">
                                        <label>A/C Holder Name</label>
                                        <input name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
