const Role = require('../models/Role');
const User = require('../models/User');

// Default page and feature definitions for the system
const DEFAULT_PAGES_CONFIG = [
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
        page_key: 'brands',
        page_label: 'Brands',
        features: [
            { feature_key: 'view_brands', feature_label: 'View Brands' },
            { feature_key: 'add_brand', feature_label: 'Add Brand' },
            { feature_key: 'edit_brand', feature_label: 'Edit Brand' },
            { feature_key: 'delete_brand', feature_label: 'Delete Brand' }
        ]
    },
    {
        page_key: 'tables',
        page_label: 'Tables',
        features: [
            { feature_key: 'view_tables', feature_label: 'View Tables' },
            { feature_key: 'add_table', feature_label: 'Add Table' },
            { feature_key: 'edit_table', feature_label: 'Edit Table' },
            { feature_key: 'delete_table', feature_label: 'Delete Table' }
        ]
    },
    {
        page_key: 'captains',
        page_label: 'Captains',
        features: [
            { feature_key: 'view_captains', feature_label: 'View Captains' },
            { feature_key: 'add_captain', feature_label: 'Add Captain' },
            { feature_key: 'edit_captain', feature_label: 'Edit Captain' },
            { feature_key: 'delete_captain', feature_label: 'Delete Captain' }
        ]
    },
    {
        page_key: 'waiters',
        page_label: 'Waiters',
        features: [
            { feature_key: 'view_waiters', feature_label: 'View Waiters' },
            { feature_key: 'add_waiter', feature_label: 'Add Waiter' },
            { feature_key: 'edit_waiter', feature_label: 'Edit Waiter' },
            { feature_key: 'delete_waiter', feature_label: 'Delete Waiter' }
        ]
    },
    {
        page_key: 'suppliers',
        page_label: 'Suppliers',
        features: [
            { feature_key: 'view_suppliers', feature_label: 'View Suppliers' },
            { feature_key: 'add_supplier', feature_label: 'Add Supplier' },
            { feature_key: 'edit_supplier', feature_label: 'Edit Supplier' },
            { feature_key: 'delete_supplier', feature_label: 'Delete Supplier' }
        ]
    },
    {
        page_key: 'customers',
        page_label: 'Customers',
        features: [
            { feature_key: 'view_customers', feature_label: 'View Customers' },
            { feature_key: 'add_customer', feature_label: 'Add Customer' },
            { feature_key: 'edit_customer', feature_label: 'Edit Customer' },
            { feature_key: 'delete_customer', feature_label: 'Delete Customer' }
        ]
    },
    {
        page_key: 'ledgers',
        page_label: 'Ledger Management',
        features: [
            { feature_key: 'view_ledgers', feature_label: 'View Ledgers' },
            { feature_key: 'add_ledger', feature_label: 'Add Ledger' },
            { feature_key: 'edit_ledger', feature_label: 'Edit Ledger' },
            { feature_key: 'delete_ledger', feature_label: 'Delete Ledger' }
        ]
    },
    {
        page_key: 'purchase',
        page_label: 'Purchase Entry',
        features: [
            { feature_key: 'view_purchases', feature_label: 'View Purchases' },
            { feature_key: 'add_purchase', feature_label: 'Add Purchase' },
            { feature_key: 'delete_purchase', feature_label: 'Delete Purchase' }
        ]
    },
    {
        page_key: 'purchase_history',
        page_label: 'Purchase Bill History',
        features: [
            { feature_key: 'view_history', feature_label: 'View Purchase History' },
            { feature_key: 'delete_history', feature_label: 'Delete Purchase History' }
        ]
    },
    {
        page_key: 'advanced_reports',
        page_label: 'Advanced Admin Reports',
        features: [
            { feature_key: 'view_advanced', feature_label: 'View Advanced Reports' }
        ]
    },
    {
        page_key: 'vouchers',
        page_label: 'Voucher Management',
        features: [
            { feature_key: 'view_vouchers', feature_label: 'View Vouchers' },
            { feature_key: 'add_voucher', feature_label: 'Add Voucher' },
            { feature_key: 'delete_voucher', feature_label: 'Delete Voucher' }
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

// @desc    Get all page and feature config (for role creation UI)
// @route   GET /api/roles/pages-config
// @access  Protected (OWNER/ADMIN)
exports.getPagesConfig = async (req, res) => {
    try {
        res.json({ success: true, data: DEFAULT_PAGES_CONFIG });
    } catch (error) {
        console.error('Get pages config error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Protected (OWNER/ADMIN)
exports.createRole = async (req, res) => {
    try {
        const { name, description, pages } = req.body;
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Role name is required' });
        }

        // Check for duplicate role name
        const existing = await Role.findOne({ name: name.trim(), restaurant_id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A role with this name already exists' });
        }

        const role = await Role.create({
            name: name.trim(),
            description: description || '',
            restaurant_id,
            pages: pages || []
        });

        res.status(201).json({ success: true, data: role });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all roles for the restaurant
// @route   GET /api/roles
// @access  Protected (OWNER/ADMIN)
exports.getRoles = async (req, res) => {
    try {
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
        const roles = await Role.find({ restaurant_id }).sort({ createdAt: -1 });

        // Also get count of users for each role
        const rolesWithCount = await Promise.all(roles.map(async (role) => {
            const userCount = await User.countDocuments({ custom_role_id: role._id });
            return { ...role.toObject(), userCount };
        }));

        res.json({ success: true, data: rolesWithCount });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Protected (OWNER/ADMIN)
exports.getRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }
        res.json({ success: true, data: role });
    } catch (error) {
        console.error('Get role error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Protected (OWNER/ADMIN)
exports.updateRole = async (req, res) => {
    try {
        const { name, description, pages, is_active } = req.body;
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Check duplicate name (but not itself)
        if (name && name.trim() !== role.name) {
            const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
            const existing = await Role.findOne({ name: name.trim(), restaurant_id, _id: { $ne: role._id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'A role with this name already exists' });
            }
        }

        if (name !== undefined) role.name = name.trim();
        if (description !== undefined) role.description = description;
        if (pages !== undefined) role.pages = pages;
        if (is_active !== undefined) role.is_active = is_active;

        await role.save();

        res.json({ success: true, data: role });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Protected (OWNER/ADMIN)
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Check if any users are assigned this role
        const usersWithRole = await User.countDocuments({ custom_role_id: role._id });
        if (usersWithRole > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role. Please reassign or delete them first.`
            });
        }

        await Role.findByIdAndDelete(role._id);
        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a sub-user with a role
// @route   POST /api/roles/users
// @access  Protected (OWNER/ADMIN)
exports.createSubUser = async (req, res) => {
    try {
        const { name, username, password, custom_role_id, email, mobile } = req.body;
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;

        if (!name || !username || !password || !custom_role_id) {
            return res.status(400).json({
                success: false,
                message: 'Name, username, password and role are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Verify the role exists
        const role = await Role.findById(custom_role_id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Check for duplicate username within same restaurant
        const existingUser = await User.findOne({ username: username.toLowerCase(), restaurant_id });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists for this restaurant' });
        }

        const user = await User.create({
            name,
            username: username.toLowerCase(),
            email: email || null,
            mobile: mobile || null,
            password,
            restaurant_id,
            custom_role_id,
            role: 'STAFF', // All sub-users are STAFF role, with permissions from custom_role_id
            is_active: true
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                custom_role_id: user.custom_role_id,
                is_active: user.is_active
            }
        });
    } catch (error) {
        console.error('Create sub-user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all sub-users for the restaurant
// @route   GET /api/roles/users
// @access  Protected (OWNER/ADMIN)
exports.getSubUsers = async (req, res) => {
    try {
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
        const users = await User.find({
            restaurant_id,
            role: 'STAFF'
        }).select('-password').populate('custom_role_id', 'name');

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get sub-users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a sub-user
// @route   PUT /api/roles/users/:id
// @access  Protected (OWNER/ADMIN)
exports.updateSubUser = async (req, res) => {
    try {
        const { name, username, password, custom_role_id, email, mobile, is_active } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't allow editing of OWNER users
        if (user.role === 'OWNER') {
            return res.status(403).json({ success: false, message: 'Cannot modify owner account' });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (mobile !== undefined) user.mobile = mobile;
        if (custom_role_id !== undefined) user.custom_role_id = custom_role_id;
        if (is_active !== undefined) user.is_active = is_active;

        if (username !== undefined) {
            const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
            const existingUser = await User.findOne({
                username: username.toLowerCase(),
                restaurant_id,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }
            user.username = username.toLowerCase();
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            }
            user.password = password;
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password').populate('custom_role_id', 'name');
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('Update sub-user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a sub-user
// @route   DELETE /api/roles/users/:id
// @access  Protected (OWNER/ADMIN)
exports.deleteSubUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ success: false, message: 'Cannot delete owner account' });
        }

        await User.findByIdAndDelete(user._id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete sub-user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
