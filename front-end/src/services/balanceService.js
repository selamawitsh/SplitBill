import API from './api';

export const balanceService = {
    // Get group balances
    getGroupBalances: async (groupId) => {
        try {
            const response = await API.get(`/balances/group/${groupId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch balances' };
        }
    },

    // Get current user's overall balances
    getMyBalances: async () => {
        try {
            const response = await API.get('/balances/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch balances' };
        }
    }
};