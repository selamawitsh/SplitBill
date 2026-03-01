import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getGroupBalances,
    getMyBalances
} from '../controllers/balance.controller.js';

const router = express.Router();

// All balance routes are protected
router.use(protect);

// Get balances for a specific group
router.get('/group/:groupId', getGroupBalances);

// Get current user's overall balances
router.get('/me', getMyBalances);

export default router;