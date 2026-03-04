const express = require('express');
const router = express.Router();
const {
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getSalesByCategory,
    getTopProducts,
    getSupplierOutstanding,
    getCustomerOutstanding,
    getStockValuation,
    getProfitLoss,
    getSalesByBrand,
    getSalesByCaptain,
    getPurchaseSummary,
    getDaybook,
    getLedgerStatement,
    getAgingReport
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

// Supplier outstanding
router.get('/supplier-outstanding', getSupplierOutstanding);

// Customer outstanding
router.get('/customer-outstanding', getCustomerOutstanding);

// Stock valuation
router.get('/stock-valuation', getStockValuation);

// Profit & Loss
router.get('/profit-loss', getProfitLoss);

// Sales by brand
router.get('/sales-by-brand', getSalesByBrand);

// Sales by captain
router.get('/sales-by-captain', getSalesByCaptain);

// Purchase summary
router.get('/purchase-summary', getPurchaseSummary);

// Daybook
router.get('/daybook', getDaybook);

// Ledger Statement
router.get('/ledger-statement', getLedgerStatement);

// Aging Report
router.get('/aging-report', getAgingReport);

module.exports = router;