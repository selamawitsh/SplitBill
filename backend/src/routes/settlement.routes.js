import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    createSettlement,
    getGroupSettlements,
    getUserSettlements,
    getSettlementById,
    updateSettlement,
    getOutstandingBalances
} from '../controllers/settlement.controller.js';

const router = express.Router();

// All settlement routes are protected
router.use(protect);

// Create settlement
router.post('/', createSettlement);

// Get user's settlements
router.get('/me', getUserSettlements);

// Get outstanding balances for a group
router.get('/balances/:groupId', getOutstandingBalances);

// Get settlements for a group
router.get('/group/:groupId', getGroupSettlements);

// Get, update single settlement
router.route('/:id')
    .get(getSettlementById)
    .put(updateSettlement);

export default router;