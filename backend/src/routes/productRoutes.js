const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    updateProduct,
    toggleProductStatus,
    deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('ADMIN', 'OWNER', 'BILLING'), getProducts);
router.post('/', protect, authorize('ADMIN', 'OWNER'), createProduct);
router.put('/:id', protect, authorize('ADMIN', 'OWNER'), updateProduct);
router.patch('/:id/toggle-status', protect, authorize('ADMIN', 'OWNER'), toggleProductStatus);
router.delete('/:id', protect, authorize('ADMIN', 'OWNER'), deleteProduct);

module.exports = router;
