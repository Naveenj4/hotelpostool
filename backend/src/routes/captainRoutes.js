const express = require('express');
const router = express.Router();
const { getCaptains, createCaptain, updateCaptain, toggleCaptainStatus, deleteCaptain } = require('../controllers/captainController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getCaptains)
    .post(authorize('ADMIN', 'OWNER'), createCaptain);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateCaptain)
    .delete(authorize('ADMIN', 'OWNER'), deleteCaptain);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleCaptainStatus);

module.exports = router;
