const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const bcrypt = require('bcryptjs');

// @desc    Get user and restaurant settings
// @route   GET /api/settings
// @access  Private (Admin, Owner)
exports.getUserSettings = async (req, res) => {
    try {
        // Get user profile
        const user = await User.findById(req.user.id).select('-password');

        // Get restaurant info
        const restaurant = await Restaurant.findById(req.user.restaurant_id);

        if (!user || !restaurant) {
            return res.status(404).json({
                success: false,
                message: 'User or restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                profile: {
                    ownerName: user.name,
                    email: user.email,
                    mobile: user.mobile || '',
                    businessName: restaurant.company_name
                },
                restaurant: {
                    restaurant_type: restaurant.restaurant_type,
                    billing_layout: restaurant.billing_layout || 'SIDEBAR'
                },
                printer: {
                    enabled: restaurant.printer_enabled || false,
                    width: restaurant.printer_width || '58mm',
                    kot_printer_ip: restaurant.kot_printer_ip || '',
                    bill_printer_ip: restaurant.bill_printer_ip || '',
                    kitchen_mapping: restaurant.kitchen_mapping || []
                },
                orderIntegration: {
                    zomato_api_key: restaurant.zomato_api_key || '',
                    swiggy_api_key: restaurant.swiggy_api_key || '',
                    enabled: restaurant.order_integration_enabled || false
                },
                billFormat: {
                    header: restaurant.bill_header || '',
                    footer: restaurant.bill_footer || '',
                    gstNo: restaurant.gst_no || '',
                    autoPrint: restaurant.auto_print || false
                },
                loyalty: {
                    enabled: restaurant.loyalty_enabled || false,
                    points_per_100: restaurant.loyalty_points_per_100 || 1,
                    target_points: restaurant.loyalty_target_points || 0,
                    point_value: restaurant.loyalty_point_value || 1
                },
                billSeries: restaurant.bill_series || {
                    dine_in: { prefix: 'DI', next_number: 1 },
                    takeaway: { prefix: 'TA', next_number: 1 },
                    delivery: { prefix: 'DE', next_number: 1 },
                    parcel: { prefix: 'PA', next_number: 1 },
                    party: { prefix: 'PT', next_number: 1 }
                }
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Advanced Settings (Printers, etc)
exports.updateAdvancedSettings = async (req, res) => {
    try {
        const { kot_printer_ip, bill_printer_ip, kitchen_mapping, zomato_api_key, swiggy_api_key, order_integration_enabled } = req.body;

        const updatePayload = {};
        if (kot_printer_ip !== undefined) updatePayload.kot_printer_ip = kot_printer_ip;
        if (bill_printer_ip !== undefined) updatePayload.bill_printer_ip = bill_printer_ip;
        if (kitchen_mapping !== undefined) updatePayload.kitchen_mapping = kitchen_mapping;
        if (zomato_api_key !== undefined) updatePayload.zomato_api_key = zomato_api_key;
        if (swiggy_api_key !== undefined) updatePayload.swiggy_api_key = swiggy_api_key;
        if (order_integration_enabled !== undefined) updatePayload.order_integration_enabled = order_integration_enabled;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            updatePayload,
            { new: true }
        );
        res.status(200).json({ success: true, data: restaurant });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Update profile information
// @route   PUT /api/settings/profile
// @access  Private (Admin, Owner)
exports.updateProfile = async (req, res) => {
    try {
        const { ownerName, email, mobile, phone, businessName, billingLayout, restaurantType } = req.body;
        const mobileToUse = mobile || phone;

        // Fetch existing data first to handle partial updates
        const existingUser = await User.findById(req.user.id);
        const existingRestaurant = await Restaurant.findById(req.user.restaurant_id);

        if (!existingUser || !existingRestaurant) {
            return res.status(404).json({
                success: false,
                message: 'User or restaurant not found'
            });
        }

        // Use incoming values if provided and NOT empty, otherwise keep existing
        // This solves the "empty form" issue when saving from and Appearance tab
        const nameToSave = (ownerName && ownerName.trim() !== "") ? ownerName : existingUser.name;
        const emailToSave = (email && email.trim() !== "") ? email : existingUser.email;
        const mobileToSaveFinal = (mobileToUse && mobileToUse.trim() !== "") ? mobileToUse : existingUser.mobile;
        const businessToSave = (businessName && businessName.trim() !== "") ? businessName : existingRestaurant.company_name;

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name: nameToSave,
                email: emailToSave,
                mobile: mobileToSaveFinal
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Update restaurant
        const restaurantUpdate = {
            company_name: businessToSave,
            billing_layout: billingLayout || existingRestaurant.billing_layout || 'SIDEBAR'
        };

        if (restaurantType) {
            restaurantUpdate.restaurant_type = restaurantType;
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            restaurantUpdate,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: {
                    ownerName: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    businessName: restaurant.company_name
                },
                restaurant: {
                    restaurant_type: restaurant.restaurant_type,
                    billing_layout: restaurant.billing_layout
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/settings/password
// @access  Private (Admin, Owner)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Set plain password — the User model's pre-save hook will hash it
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update printer settings
// @route   PUT /api/settings/printer
// @access  Private (Admin, Owner)
exports.updatePrinterSettings = async (req, res) => {
    try {
        const { enabled, width } = req.body;

        // Validate input
        if (enabled === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Enabled status is required'
            });
        }

        if (width && !['58mm', '80mm'].includes(width)) {
            return res.status(400).json({
                success: false,
                message: 'Printer width must be 58mm or 80mm'
            });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            {
                printer_enabled: enabled,
                printer_width: width || '58mm'
            },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Printer settings updated successfully',
            data: {
                printer: {
                    enabled: restaurant.printer_enabled,
                    width: restaurant.printer_width
                }
            }
        });
    } catch (error) {
        console.error('Update printer settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update bill format settings
// @route   PUT /api/settings/bill-format
// @access  Private (Admin, Owner)
exports.updateBillFormat = async (req, res) => {
    try {
        const { header, footer, gstNo, autoPrint } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            {
                bill_header: header || '',
                bill_footer: footer || '',
                gst_no: gstNo || '',
                auto_print: autoPrint !== undefined ? autoPrint : false
            },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bill format updated successfully',
            data: {
                billFormat: {
                    header: restaurant.bill_header,
                    footer: restaurant.bill_footer,
                    gstNo: restaurant.gst_no,
                    autoPrint: restaurant.auto_print
                }
            }
        });
    } catch (error) {
        console.error('Update bill format error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update loyalty settings
// @route   PUT /api/settings/loyalty
// @access  Private (Admin, Owner)
exports.updateLoyaltySettings = async (req, res) => {
    try {
        const { enabled, points_per_100, target_points, point_value } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            {
                loyalty_enabled: enabled,
                loyalty_points_per_100: points_per_100,
                loyalty_target_points: target_points,
                loyalty_point_value: point_value
            },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Loyalty settings updated successfully',
            data: {
                loyalty: {
                    enabled: restaurant.loyalty_enabled,
                    points_per_100: restaurant.loyalty_points_per_100,
                    target_points: restaurant.loyalty_target_points,
                    point_value: restaurant.loyalty_point_value
                }
            }
        });
    } catch (error) {
        console.error('Update loyalty settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update billing layout ONLY (from Appearance tab)
// @route   PUT /api/settings/layout
// @access  Private (Admin, Owner)
exports.updateBillingLayout = async (req, res) => {
    try {
        const { billingLayout } = req.body;

        if (!billingLayout || !['SIDEBAR', 'TOP_HEADER'].includes(billingLayout)) {
            return res.status(400).json({
                success: false,
                message: 'Valid billing layout (SIDEBAR or TOP_HEADER) is required'
            });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            { billing_layout: billingLayout },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Layout updated successfully',
            data: {
                billing_layout: restaurant.billing_layout
            }
        });
    } catch (error) {
        console.error('Update billing layout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update bill number series settings
// @route   PUT /api/settings/bill-series
// @access  Private (Admin, Owner)
exports.updateBillSeries = async (req, res) => {
    try {
        const { billSeries } = req.body;

        if (!billSeries) {
            return res.status(400).json({ success: false, message: 'Bill series settings are required' });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            { bill_series: billSeries },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Bill series updated successfully',
            data: restaurant.bill_series
        });
    } catch (error) {
        console.error('Update bill series error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
