const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTable, toggleTableStatus, deleteTable, reserveTable, cancelReservation } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getTables)
    .post(authorize('ADMIN', 'OWNER'), createTable);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateTable)
    .delete(authorize('ADMIN', 'OWNER'), deleteTable);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleTableStatus);

router.route('/:id/reserve')
    .patch(reserveTable);

router.route('/:id/cancel-reserve')
    .patch(cancelReservation);

module.exports = router;
