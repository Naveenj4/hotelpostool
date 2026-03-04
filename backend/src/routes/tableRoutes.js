const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTable, toggleTableStatus, deleteTable } = require('../controllers/tableController');
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

module.exports = router;
