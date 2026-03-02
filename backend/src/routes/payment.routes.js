import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    initializePayment,
    verifyPayment,
    getUserTransactions,
    getTransactionById,
    chapaWebhook
} from '../controllers/payment.controller.js';

const router = express.Router();

// Public webhook (no auth)
router.post('/webhook/chapa', chapaWebhook);

// Protected routes
router.use(protect);

// Initialize payment
router.post('/initialize', initializePayment);

// Verify payment
router.post('/verify', verifyPayment);

// Get user transactions
router.get('/transactions', getUserTransactions);

// Get single transaction
router.get('/transactions/:id', getTransactionById);

export default router;