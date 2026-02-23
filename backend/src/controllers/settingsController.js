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
                    phone: user.phone || '',
                    businessName: restaurant.name
                },
                printer: {
                    enabled: restaurant.printer_enabled || false,
                    width: restaurant.printer_width || '58mm'
                },
                billFormat: {
                    header: restaurant.bill_header || '',
                    footer: restaurant.bill_footer || '',
                    gstNo: restaurant.gst_no || '',
                    autoPrint: restaurant.auto_print || false
                }
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update profile information
// @route   PUT /api/settings/profile
// @access  Private (Admin, Owner)
exports.updateProfile = async (req, res) => {
    try {
        const { ownerName, email, phone, businessName } = req.body;
        
        // Validate required fields
        if (!ownerName || !email || !businessName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Owner name, email, and business name are required' 
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                name: ownerName,
                email,
                phone: phone || ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Update restaurant
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            { name: businessName },
            { new: true, runValidators: true }
        );

        if (!user || !restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: 'User or restaurant not found' 
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: {
                    ownerName: user.name,
                    email: user.email,
                    phone: user.phone,
                    businessName: restaurant.name
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

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
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