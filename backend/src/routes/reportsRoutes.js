const express = require('express');
const router = express.Router();
const { 
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getSalesByCategory,
    getTopProducts
} = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and admin/owner access
router.use(protect);
router.use(authorize('ADMIN', 'OWNER'));

// Daily sales report
router.get('/daily', getDailyReport);

// Weekly sales report
router.get('/weekly', getWeeklyReport);

// Monthly sales report
router.get('/monthly', getMonthlyReport);

// Sales by category
router.get('/sales-by-category', getSalesByCategory);

// Top selling products
router.get('/top-products', getTopProducts);

module.exports = router;