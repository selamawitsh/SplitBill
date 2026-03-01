import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    createExpense,
    getGroupExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense
} from '../controllers/expense.controller.js';

const router = express.Router();

// All expense routes are protected
router.use(protect);

// Create expense
router.post('/', createExpense);

// Get expenses for a group
router.get('/group/:groupId', getGroupExpenses);

// Get, update, delete single expense
router.route('/:id')
    .get(getExpenseById)
    .put(updateExpense)
    .delete(deleteExpense);

export default router;