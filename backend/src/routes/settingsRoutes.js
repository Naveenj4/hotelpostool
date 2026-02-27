const express = require('express');
const router = express.Router();
const {
    getUserSettings,
    updateProfile,
    changePassword,
    updatePrinterSettings,
    updateBillFormat,
    updateBillingLayout
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and admin/owner access
router.use(protect);
router.use(authorize('ADMIN', 'OWNER'));

// Get all settings
router.get('/', getUserSettings);

// Update profile
router.put('/profile', updateProfile);

// Change password
router.put('/password', changePassword);

// Update printer settings
router.put('/printer', updatePrinterSettings);

// Update bill format
router.put('/bill-format', updateBillFormat);

// Update billing layout only (Appearance tab)
router.put('/layout', updateBillingLayout);

module.exports = router;