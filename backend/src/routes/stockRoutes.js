const express = require('express');
const router = express.Router();
const {
    getStockItems,
    getLowStockItems,
    updateStock,
    bulkUpdateStock
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and admin/owner access
router.use(protect);
router.use(authorize('ADMIN', 'OWNER'));

// Get all stock items
router.get('/', getStockItems);

// Get low stock items
router.get('/low-stock', getLowStockItems);

// Bulk update stock (must be before /:id to avoid route conflict)
router.put('/bulk-update', bulkUpdateStock);

// Update single product stock
router.put('/:id', updateStock);

module.exports = router;