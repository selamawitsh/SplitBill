import API from './api';

export const paymentService = {
    // Initialize payment
    initializePayment: async (paymentData) => {
        try {
            const response = await API.post('/payments/initialize', paymentData);
            return response.data;
        } catch (error) {
            console.error('❌ Payment service error:', error.response?.data || error.message);
            throw error; // Re-throw so component can handle it
        }
    },

    // Verify payment
    verifyPayment: async (verificationData) => {
        try {
            const response = await API.post('/payments/verify', verificationData);
            return response.data;
        } catch (error) {
            console.error('❌ Verify payment error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get user transactions
    getUserTransactions: async (page = 1) => {
        try {
            const response = await API.get(`/payments/transactions?page=${page}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get transactions error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get transaction by ID
    getTransactionById: async (transactionId) => {
        try {
            const response = await API.get(`/payments/transactions/${transactionId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get transaction error:', error.response?.data || error.message);
            throw error;
        }
    }
};