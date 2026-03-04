const express = require('express');
const router = express.Router();
const { getWaiters, createWaiter, updateWaiter, toggleWaiterStatus, deleteWaiter } = require('../controllers/waiterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getWaiters)
    .post(authorize('ADMIN', 'OWNER'), createWaiter);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateWaiter)
    .delete(authorize('ADMIN', 'OWNER'), deleteWaiter);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleWaiterStatus);

module.exports = router;
