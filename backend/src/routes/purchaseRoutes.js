const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, deletePurchase } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getPurchases)
    .post(authorize('ADMIN', 'OWNER'), createPurchase);

router.route('/:id')
    .delete(authorize('ADMIN', 'OWNER'), deletePurchase);

module.exports = router;
