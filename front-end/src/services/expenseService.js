import API from './api';

export const expenseService = {
    // Create new expense
    createExpense: async (expenseData) => {
        try {
            const response = await API.post('/expenses', expenseData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create expense' };
        }
    },

    // Get all expenses for a group
    getGroupExpenses: async (groupId) => {
        try {
            const response = await API.get(`/expenses/group/${groupId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch expenses' };
        }
    },

    // Get single expense
    getExpenseById: async (expenseId) => {
        try {
            const response = await API.get(`/expenses/${expenseId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch expense' };
        }
    },

    // Update expense
    updateExpense: async (expenseId, expenseData) => {
        try {
            const response = await API.put(`/expenses/${expenseId}`, expenseData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update expense' };
        }
    },

    // Delete expense
    deleteExpense: async (expenseId) => {
        try {
            const response = await API.delete(`/expenses/${expenseId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete expense' };
        }
    }
};