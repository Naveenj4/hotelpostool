import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Shield, Users, Plus, Edit2, Trash2, Save, X, Check,
    ChevronDown, ChevronRight, Eye, EyeOff, UserPlus,
    Lock, User, Key, ToggleLeft, ToggleRight, Search,
    AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import './AccessControlPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fallback pages config in case API doesn't load
const FALLBACK_PAGES_CONFIG = [
    {
        page_key: 'dashboard',
        page_label: 'Dashboard',
        features: [
            { feature_key: 'view_stats', feature_label: 'View Statistics' },
            { feature_key: 'view_charts', feature_label: 'View Charts' },
            { feature_key: 'view_recent_bills', feature_label: 'View Recent Bills' }
        ]
    },
    {
        page_key: 'billing',
        page_label: 'Billing / New Bill',
        features: [
            { feature_key: 'create_bill', feature_label: 'Create New Bill' },
            { feature_key: 'apply_discount', feature_label: 'Apply Discount' },
            { feature_key: 'hold_bill', feature_label: 'Hold Bill' },
            { feature_key: 'print_bill', feature_label: 'Print Bill' },
            { feature_key: 'kot_print', feature_label: 'KOT Print' },
            { feature_key: 'split_bill', feature_label: 'Split Bill' },
            { feature_key: 'complimentary', feature_label: 'Complimentary' },
            { feature_key: 'sales_return', feature_label: 'Sales Return' }
        ]
    },
    {
        page_key: 'bills_sales',
        page_label: 'Bills & Sales',
        features: [
            { feature_key: 'view_bills', feature_label: 'View Bills' },
            { feature_key: 'edit_bill', feature_label: 'Edit Bill' },
            { feature_key: 'delete_bill', feature_label: 'Delete Bill' },
            { feature_key: 'export_bills', feature_label: 'Export Bills' }
        ]
    },
    {
        page_key: 'products',
        page_label: 'Products',
        features: [
            { feature_key: 'view_products', feature_label: 'View Products' },
            { feature_key: 'add_product', feature_label: 'Add Product' },
            { feature_key: 'edit_product', feature_label: 'Edit Product' },
            { feature_key: 'delete_product', feature_label: 'Delete Product' },
            { feature_key: 'import_products', feature_label: 'Import Products' }
        ]
    },
    {
        page_key: 'categories',
        page_label: 'Categories',
        features: [
            { feature_key: 'view_categories', feature_label: 'View Categories' },
            { feature_key: 'add_category', feature_label: 'Add Category' },
            { feature_key: 'edit_category', feature_label: 'Edit Category' },
            { feature_key: 'delete_category', feature_label: 'Delete Category' }
        ]
    },
    {
        page_key: 'counters',
        page_label: 'Counters',
        features: [
            { feature_key: 'view_counters', feature_label: 'View Counters' },
            { feature_key: 'add_counter', feature_label: 'Add Counter' },
            { feature_key: 'edit_counter', feature_label: 'Edit Counter' },
            { feature_key: 'delete_counter', feature_label: 'Delete Counter' }
        ]
    },
    {
        page_key: 'stock',
        page_label: 'Stock Management',
        features: [
            { feature_key: 'view_stock', feature_label: 'View Stock' },
            { feature_key: 'update_stock', feature_label: 'Update Stock' },
            { feature_key: 'stock_alerts', feature_label: 'Stock Alerts' },
            { feature_key: 'export_stock', feature_label: 'Export Stock Data' }
        ]
    },
    {
        page_key: 'reports',
        page_label: 'Reports',
        features: [
            { feature_key: 'view_reports', feature_label: 'View Reports' },
            { feature_key: 'export_reports', feature_label: 'Export Reports' },
            { feature_key: 'daily_report', feature_label: 'Daily Report' },
            { feature_key: 'monthly_report', feature_label: 'Monthly Report' }
        ]
    },
    {
        page_key: 'settings',
        page_label: 'Settings',
        features: [
            { feature_key: 'view_settings', feature_label: 'View Settings' },
            { feature_key: 'edit_profile', feature_label: 'Edit Profile' },
            { feature_key: 'change_password', feature_label: 'Change Password' },
            { feature_key: 'printer_settings', feature_label: 'Printer Settings' },
            { feature_key: 'bill_settings', feature_label: 'Bill Settings' }
        ]
    }
];

const AccessControlPage = () => {
    const { user } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Inline credential creation within role modal
    const [createCredentials, setCreateCredentials] = useState(false);
    const [credentialForm, setCredentialForm] = useState({
        staffName: '', staffUsername: '', staffPassword: '', staffConfirmPassword: ''
    });
    const [showStaffPassword, setShowStaffPassword] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'users'

    // Roles state
    const [roles, setRoles] = useState([]);
    const [pagesConfig, setPagesConfig] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ name: '', description: '', pages: [] });

    // Users state
    const [subUsers, setSubUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: '', username: '', password: '', confirmPassword: '',
        email: '', mobile: '', custom_role_id: ''
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedPages, setExpandedPages] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const getAuthHeaders = useCallback(() => ({
        headers: { Authorization: `Bearer ${user?.token}` }
    }), [user]);

    // Fetch data
    useEffect(() => {
        fetchRoles();
        fetchPagesConfig();
        fetchSubUsers();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/roles`, getAuthHeaders());
            if (!res.ok) {
                console.error('Fetch roles failed:', res.status);
                return;
            }
            const data = await res.json();
            if (data.success) setRoles(data.data);
        } catch (err) {
            console.error('Fetch roles error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPagesConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/roles/pages-config`, getAuthHeaders());
            if (!res.ok) {
                console.error('Fetch pages config failed:', res.status, '- using fallback');
                setPagesConfig(FALLBACK_PAGES_CONFIG);
                return;
            }
            const data = await res.json();
            if (data.success) {
                setPagesConfig(data.data);
            } else {
                setPagesConfig(FALLBACK_PAGES_CONFIG);
            }
        } catch (err) {
            console.error('Fetch pages config error:', err);
            setPagesConfig(FALLBACK_PAGES_CONFIG);
        }
    };

    const fetchSubUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/roles/users`, getAuthHeaders());
            if (!res.ok) {
                console.error('Fetch sub-users failed:', res.status);
                return;
            }
            const data = await res.json();
            if (data.success) setSubUsers(data.data);
        } catch (err) {
            console.error('Fetch sub-users error:', err);
        }
    };

    // Role handlers
    const openCreateRole = () => {
        const config = pagesConfig.length > 0 ? pagesConfig : FALLBACK_PAGES_CONFIG;
        const initialPages = config.map(page => ({
            page_key: page.page_key,
            page_label: page.page_label,
            has_access: false,
            features: page.features.map(f => ({
                feature_key: f.feature_key,
                feature_label: f.feature_label,
                enabled: false
            }))
        }));
        setRoleForm({ name: '', description: '', pages: initialPages });
        setEditingRole(null);
        setShowRoleModal(true);
        // Auto-expand all pages for easier selection
        const expanded = {};
        config.forEach(p => { expanded[p.page_key] = true; });
        setExpandedPages(expanded);
        // Reset credential form
        setCreateCredentials(false);
        setCredentialForm({ staffName: '', staffUsername: '', staffPassword: '', staffConfirmPassword: '' });
        setShowStaffPassword(false);
        setError('');
    };

    const openEditRole = (role) => {
        const config = pagesConfig.length > 0 ? pagesConfig : FALLBACK_PAGES_CONFIG;
        // Merge with default config to ensure all pages/features are present
        const mergedPages = config.map(configPage => {
            const existingPage = role.pages.find(p => p.page_key === configPage.page_key);
            return {
                page_key: configPage.page_key,
                page_label: configPage.page_label,
                has_access: existingPage?.has_access || false,
                features: configPage.features.map(cf => {
                    const existingFeature = existingPage?.features?.find(f => f.feature_key === cf.feature_key);
                    return {
                        feature_key: cf.feature_key,
                        feature_label: cf.feature_label,
                        enabled: existingFeature?.enabled || false
                    };
                })
            };
        });

        setRoleForm({
            name: role.name,
            description: role.description || '',
            pages: mergedPages
        });
        setEditingRole(role);
        setShowRoleModal(true);
        // Auto-expand all pages for easier viewing
        const expanded = {};
        config.forEach(p => { expanded[p.page_key] = true; });
        setExpandedPages(expanded);
        setError('');
    };

    const togglePageAccess = (pageIndex) => {
        const updatedPages = [...roleForm.pages];
        const newAccess = !updatedPages[pageIndex].has_access;
        updatedPages[pageIndex].has_access = newAccess;
        // If disabling page access, disable all features
        if (!newAccess) {
            updatedPages[pageIndex].features = updatedPages[pageIndex].features.map(f => ({
                ...f, enabled: false
            }));
        } else {
            // If enabling page access, enable all features by default
            updatedPages[pageIndex].features = updatedPages[pageIndex].features.map(f => ({
                ...f, enabled: true
            }));
        }
        setRoleForm({ ...roleForm, pages: updatedPages });
    };

    const toggleFeature = (pageIndex, featureIndex) => {
        const updatedPages = [...roleForm.pages];
        updatedPages[pageIndex].features[featureIndex].enabled =
            !updatedPages[pageIndex].features[featureIndex].enabled;
        setRoleForm({ ...roleForm, pages: updatedPages });
    };

    const toggleAllPages = (enable) => {
        const updatedPages = roleForm.pages.map(page => ({
            ...page,
            has_access: enable,
            features: page.features.map(f => ({ ...f, enabled: enable }))
        }));
        setRoleForm({ ...roleForm, pages: updatedPages });
    };

    const toggleExpandPage = (pageKey) => {
        setExpandedPages(prev => ({ ...prev, [pageKey]: !prev[pageKey] }));
    };

    const saveRole = async () => {
        if (!roleForm.name.trim()) {
            setError('Role name is required');
            return;
        }

        // Validate credentials if enabled
        if (createCredentials && !editingRole) {
            if (!credentialForm.staffName.trim()) {
                setError('Staff name is required');
                return;
            }
            if (!credentialForm.staffUsername.trim()) {
                setError('Staff username is required');
                return;
            }
            if (!credentialForm.staffPassword) {
                setError('Staff password is required');
                return;
            }
            if (credentialForm.staffPassword.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (credentialForm.staffPassword !== credentialForm.staffConfirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        try {
            setSaving(true);
            setError('');

            const url = editingRole
                ? `${API_URL}/roles/${editingRole._id}`
                : `${API_URL}/roles`;

            const method = editingRole ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify(roleForm)
            });

            let data;
            try {
                data = await res.json();
            } catch (parseErr) {
                setError(`Server error (${res.status}). Please check if backend is running.`);
                return;
            }

            if (data.success) {
                const roleId = data.data._id;
                let successMsg = editingRole ? 'Role updated successfully!' : 'Role created successfully!';

                // Create staff user if credentials were provided
                if (createCredentials && !editingRole && credentialForm.staffUsername.trim()) {
                    try {
                        const userRes = await fetch(`${API_URL}/roles/users`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${user?.token}`
                            },
                            body: JSON.stringify({
                                name: credentialForm.staffName,
                                username: credentialForm.staffUsername,
                                password: credentialForm.staffPassword,
                                custom_role_id: roleId
                            })
                        });
                        const userData = await userRes.json();
                        if (userData.success) {
                            successMsg = `Role "${roleForm.name}" created with user "${credentialForm.staffUsername}"!`;
                            fetchSubUsers();
                        } else {
                            successMsg = `Role created! But user creation failed: ${userData.message}`;
                        }
                    } catch (userErr) {
                        successMsg = `Role created! But user creation failed: ${userErr.message}`;
                    }
                }

                setSuccess(successMsg);
                setShowRoleModal(false);
                fetchRoles();
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(data.message || `Failed to save role (${res.status})`);
            }
        } catch (err) {
            console.error('Save role error:', err);
            setError(`Network error: ${err.message}. Check if backend server is running.`);
        } finally {
            setSaving(false);
        }
    };

    const deleteRole = async (roleId) => {
        try {
            setSaving(true);
            const res = await fetch(`${API_URL}/roles/${roleId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Role deleted successfully!');
                fetchRoles();
                setDeleteConfirm(null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete role');
        } finally {
            setSaving(false);
        }
    };

    // User handlers
    const openCreateUser = () => {
        setUserForm({
            name: '', username: '', password: '', confirmPassword: '',
            email: '', mobile: '', custom_role_id: ''
        });
        setEditingUser(null);
        setShowUserModal(true);
        setShowPassword(false);
        setError('');
    };

    const openEditUser = (u) => {
        setUserForm({
            name: u.name,
            username: u.username || '',
            password: '',
            confirmPassword: '',
            email: u.email || '',
            mobile: u.mobile || '',
            custom_role_id: u.custom_role_id?._id || u.custom_role_id || ''
        });
        setEditingUser(u);
        setShowUserModal(true);
        setShowPassword(false);
        setError('');
    };

    const saveUser = async () => {
        if (!userForm.name.trim() || !userForm.username.trim() || !userForm.custom_role_id) {
            setError('Name, username and role are required');
            return;
        }

        if (!editingUser && !userForm.password) {
            setError('Password is required for new user');
            return;
        }

        if (userForm.password && userForm.password !== userForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (userForm.password && userForm.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload = {
                name: userForm.name,
                username: userForm.username,
                email: userForm.email,
                mobile: userForm.mobile,
                custom_role_id: userForm.custom_role_id
            };

            if (userForm.password) {
                payload.password = userForm.password;
            }

            const url = editingUser
                ? `${API_URL}/roles/users/${editingUser._id}`
                : `${API_URL}/roles/users`;

            const method = editingUser ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
                setShowUserModal(false);
                fetchSubUsers();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to save user');
            }
        } catch (err) {
            setError('Failed to save user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const deleteUser = async (userId) => {
        try {
            setSaving(true);
            const res = await fetch(`${API_URL}/roles/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('User deleted successfully!');
                fetchSubUsers();
                setDeleteConfirm(null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete user');
        } finally {
            setSaving(false);
        }
    };

    const toggleUserActive = async (u) => {
        try {
            const res = await fetch(`${API_URL}/roles/users/${u._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({ is_active: !u.is_active })
            });
            const data = await res.json();
            if (data.success) {
                fetchSubUsers();
                setSuccess(`User ${u.is_active ? 'deactivated' : 'activated'} successfully!`);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to update user status');
        }
    };

    // Filter
    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = subUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getAccessCount = (role) => {
        if (!role.pages) return '0 pages';
        const count = role.pages.filter(p => p.has_access).length;
        return `${count} page${count !== 1 ? 's' : ''}`;
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                isCollapsed={sidebarCollapsed}
                isMobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            {mobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
            )}

            <main className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <Header toggleSidebar={() => window.innerWidth <= 768 ? setMobileSidebarOpen(!mobileSidebarOpen) : setSidebarCollapsed(!sidebarCollapsed)} />

                <div className="ac-container">
                    {/* Page Header */}
                    <div className="ac-header">
                        <div className="ac-header-left">
                            <div className="ac-header-icon">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h1 className="ac-title">Access Control</h1>
                                <p className="ac-subtitle">Manage roles, permissions & user credentials</p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    {success && (
                        <div className="ac-notification ac-success">
                            <CheckCircle size={18} />
                            <span>{success}</span>
                            <button onClick={() => setSuccess('')} className="ac-notif-close"><X size={14} /></button>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="ac-tabs">
                        <button
                            className={`ac-tab ${activeTab === 'roles' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('roles'); setSearchQuery(''); }}
                        >
                            <Shield size={18} />
                            <span>Roles & Permissions</span>
                            <span className="ac-tab-badge">{roles.length}</span>
                        </button>
                        <button
                            className={`ac-tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                        >
                            <Users size={18} />
                            <span>Staff Users</span>
                            <span className="ac-tab-badge">{subUsers.length}</span>
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="ac-toolbar">
                        <div className="ac-search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder={activeTab === 'roles' ? 'Search roles...' : 'Search users...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            className="ac-btn ac-btn-primary"
                            onClick={activeTab === 'roles' ? openCreateRole : openCreateUser}
                        >
                            <Plus size={18} />
                            {activeTab === 'roles' ? 'Create Role' : 'Add User'}
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="ac-loading">
                            <Loader2 size={32} className="animate-spin" />
                            <p>Loading...</p>
                        </div>
                    ) : activeTab === 'roles' ? (
                        <div className="ac-grid">
                            {filteredRoles.length === 0 ? (
                                <div className="ac-empty">
                                    <Shield size={48} />
                                    <h3>No Roles Created</h3>
                                    <p>Create your first role to define page and feature access levels.</p>
                                    <button className="ac-btn ac-btn-primary" onClick={openCreateRole}>
                                        <Plus size={18} /> Create First Role
                                    </button>
                                </div>
                            ) : (
                                filteredRoles.map(role => (
                                    <div key={role._id} className="ac-role-card">
                                        <div className="ac-role-header">
                                            <div className="ac-role-info">
                                                <div className="ac-role-avatar">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="ac-role-name">{role.name}</h3>
                                                    {role.description && (
                                                        <p className="ac-role-desc">{role.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ac-role-actions">
                                                <button onClick={() => openEditRole(role)} className="ac-icon-btn ac-icon-edit" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                {deleteConfirm === role._id ? (
                                                    <div className="ac-delete-confirm">
                                                        <button onClick={() => deleteRole(role._id)} className="ac-icon-btn ac-icon-danger">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => setDeleteConfirm(null)} className="ac-icon-btn">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(role._id)}
                                                        className="ac-icon-btn ac-icon-danger"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ac-role-meta">
                                            <span className="ac-meta-item">
                                                <Eye size={14} />
                                                {getAccessCount(role)}
                                            </span>
                                            <span className="ac-meta-item">
                                                <Users size={14} />
                                                {role.userCount || 0} user{(role.userCount || 0) !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {/* Page pills */}
                                        <div className="ac-page-pills">
                                            {role.pages?.filter(p => p.has_access).map(p => (
                                                <span key={p.page_key} className="ac-pill">{p.page_label}</span>
                                            ))}
                                            {(!role.pages || role.pages.filter(p => p.has_access).length === 0) && (
                                                <span className="ac-pill ac-pill-muted">No pages assigned</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="ac-table-wrapper">
                            {filteredUsers.length === 0 ? (
                                <div className="ac-empty">
                                    <UserPlus size={48} />
                                    <h3>No Staff Users</h3>
                                    <p>Create staff users and assign roles to control their access.</p>
                                    <button className="ac-btn ac-btn-primary" onClick={openCreateUser}>
                                        <Plus size={18} /> Add First User
                                    </button>
                                </div>
                            ) : (
                                <table className="ac-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Username</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(u => (
                                            <tr key={u._id}>
                                                <td>
                                                    <div className="ac-user-cell">
                                                        <div className="ac-user-avatar">
                                                            {u.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="ac-user-name">{u.name}</span>
                                                            {u.email && <span className="ac-user-email">{u.email}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="ac-username-badge">@{u.username}</span>
                                                </td>
                                                <td>
                                                    <span className="ac-role-badge">
                                                        {u.custom_role_id?.name || 'Unassigned'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => toggleUserActive(u)}
                                                        className={`ac-status-toggle ${u.is_active !== false ? 'active' : 'inactive'}`}
                                                    >
                                                        {u.is_active !== false ? (
                                                            <><ToggleRight size={20} /> Active</>
                                                        ) : (
                                                            <><ToggleLeft size={20} /> Inactive</>
                                                        )}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="ac-actions-cell">
                                                        <button onClick={() => openEditUser(u)} className="ac-icon-btn ac-icon-edit" title="Edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {deleteConfirm === u._id ? (
                                                            <div className="ac-delete-confirm">
                                                                <button onClick={() => deleteUser(u._id)} className="ac-icon-btn ac-icon-danger">
                                                                    <Check size={16} />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm(null)} className="ac-icon-btn">
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirm(u._id)}
                                                                className="ac-icon-btn ac-icon-danger"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Role Modal */}
            {showRoleModal && (
                <div className="ac-modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="ac-modal ac-role-modal" onClick={e => e.stopPropagation()}>
                        <div className="ac-modal-header">
                            <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                            <button onClick={() => setShowRoleModal(false)} className="ac-modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ac-modal-body">
                            {error && (
                                <div className="ac-notification ac-error">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="ac-form-section">
                                <div className="ac-form-group">
                                    <label>Role Name *</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="e.g., Billing Counter, Stock Manager"
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="ac-form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Brief description of this role..."
                                        value={roleForm.description}
                                        onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="ac-permissions-section">
                                <div className="ac-permissions-header">
                                    <h3>Page & Feature Permissions</h3>
                                    <div className="ac-quick-actions">
                                        <button
                                            className="ac-btn-small ac-btn-outline"
                                            onClick={() => toggleAllPages(true)}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            className="ac-btn-small ac-btn-outline"
                                            onClick={() => toggleAllPages(false)}
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>

                                <div className="ac-permissions-list">
                                    {roleForm.pages.map((page, pageIndex) => (
                                        <div key={page.page_key} className={`ac-perm-page ${page.has_access ? 'enabled' : ''}`}>
                                            <div className="ac-perm-page-header">
                                                <div className="ac-perm-page-left">
                                                    <label className="ac-checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            checked={page.has_access}
                                                            onChange={() => togglePageAccess(pageIndex)}
                                                        />
                                                        <span className="ac-checkmark"></span>
                                                    </label>
                                                    <span className="ac-perm-page-label">{page.page_label}</span>
                                                </div>
                                                {page.has_access && (
                                                    <span className="ac-feature-count-badge">
                                                        {page.features.filter(f => f.enabled).length}/{page.features.length} features
                                                    </span>
                                                )}
                                            </div>

                                            {/* Always show features when page is enabled */}
                                            {page.has_access && (
                                                <div className="ac-features-grid">
                                                    {page.features.map((feature, featureIndex) => (
                                                        <label key={feature.feature_key} className="ac-feature-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={feature.enabled}
                                                                onChange={() => toggleFeature(pageIndex, featureIndex)}
                                                            />
                                                            <span className="ac-feature-checkmark"></span>
                                                            <span>{feature.feature_label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inline Credential Creation - only on new role */}
                            {!editingRole && (
                                <div className="ac-credentials-section">
                                    <div className="ac-credentials-toggle">
                                        <label className="ac-checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={createCredentials}
                                                onChange={() => setCreateCredentials(!createCredentials)}
                                            />
                                            <span className="ac-checkmark"></span>
                                        </label>
                                        <div>
                                            <span className="ac-credentials-label">
                                                <UserPlus size={16} /> Create Staff User Credentials
                                            </span>
                                            <p className="ac-credentials-hint">Create a login account for a staff member with this role</p>
                                        </div>
                                    </div>

                                    {createCredentials && (
                                        <div className="ac-credentials-form">
                                            <div className="ac-form-grid">
                                                <div className="ac-form-group">
                                                    <label><User size={14} /> Staff Name *</label>
                                                    <input
                                                        type="text"
                                                        className="ac-input"
                                                        placeholder="e.g., John Doe"
                                                        value={credentialForm.staffName}
                                                        onChange={(e) => setCredentialForm({ ...credentialForm, staffName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="ac-form-group">
                                                    <label><Key size={14} /> Username *</label>
                                                    <input
                                                        type="text"
                                                        className="ac-input"
                                                        placeholder="e.g., john_billing"
                                                        value={credentialForm.staffUsername}
                                                        onChange={(e) => setCredentialForm({ ...credentialForm, staffUsername: e.target.value })}
                                                    />
                                                    <p className="ac-form-hint">Staff will login with this username</p>
                                                </div>
                                                <div className="ac-form-group">
                                                    <label><Lock size={14} /> Password *</label>
                                                    <div className="ac-password-input">
                                                        <input
                                                            type={showStaffPassword ? 'text' : 'password'}
                                                            className="ac-input"
                                                            placeholder="Min 6 characters"
                                                            value={credentialForm.staffPassword}
                                                            onChange={(e) => setCredentialForm({ ...credentialForm, staffPassword: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowStaffPassword(!showStaffPassword)}
                                                            className="ac-password-toggle"
                                                        >
                                                            {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="ac-form-group">
                                                    <label><Lock size={14} /> Confirm Password *</label>
                                                    <input
                                                        type={showStaffPassword ? 'text' : 'password'}
                                                        className="ac-input"
                                                        placeholder="Re-enter password"
                                                        value={credentialForm.staffConfirmPassword}
                                                        onChange={(e) => setCredentialForm({ ...credentialForm, staffConfirmPassword: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="ac-modal-footer">
                            <button onClick={() => setShowRoleModal(false)} className="ac-btn ac-btn-ghost">
                                Cancel
                            </button>
                            <button onClick={saveRole} className="ac-btn ac-btn-primary" disabled={saving}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {editingRole ? 'Update Role' : (createCredentials ? 'Create Role & User' : 'Create Role')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {showUserModal && (
                <div className="ac-modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="ac-modal ac-user-modal" onClick={e => e.stopPropagation()}>
                        <div className="ac-modal-header">
                            <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
                            <button onClick={() => setShowUserModal(false)} className="ac-modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ac-modal-body">
                            {error && (
                                <div className="ac-notification ac-error">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="ac-form-grid">
                                <div className="ac-form-group">
                                    <label><User size={14} /> Full Name *</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Staff member's name"
                                        value={userForm.name}
                                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group">
                                    <label><Key size={14} /> Username *</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Login username"
                                        value={userForm.username}
                                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group">
                                    <label><Lock size={14} /> Password {!editingUser && '*'}</label>
                                    <div className="ac-password-input">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="ac-input"
                                            placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                                            value={userForm.password}
                                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="ac-password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="ac-form-group">
                                    <label><Lock size={14} /> Confirm Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="ac-input"
                                        placeholder="Confirm password"
                                        value={userForm.confirmPassword}
                                        onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group">
                                    <label>Email (Optional)</label>
                                    <input
                                        type="email"
                                        className="ac-input"
                                        placeholder="user@example.com"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group">
                                    <label>Mobile (Optional)</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Mobile number"
                                        value={userForm.mobile}
                                        onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group ac-form-full">
                                    <label><Shield size={14} /> Assign Role *</label>
                                    <select
                                        className="ac-input ac-select"
                                        value={userForm.custom_role_id}
                                        onChange={(e) => setUserForm({ ...userForm, custom_role_id: e.target.value })}
                                    >
                                        <option value="">Select a role...</option>
                                        {roles.map(r => (
                                            <option key={r._id} value={r._id}>{r.name}</option>
                                        ))}
                                    </select>
                                    {roles.length === 0 && (
                                        <p className="ac-form-hint">
                                            No roles exist yet. Create a role first in the "Roles & Permissions" tab.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="ac-modal-footer">
                            <button onClick={() => setShowUserModal(false)} className="ac-btn ac-btn-ghost">
                                Cancel
                            </button>
                            <button onClick={saveUser} className="ac-btn ac-btn-primary" disabled={saving}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessControlPage;
