import API from './api';

export const settlementService = {
    // Create new settlement
    createSettlement: async (settlementData) => {
        try {
            const response = await API.post('/settlements', settlementData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create settlement' };
        }
    },

    // Get settlements for a group
    getGroupSettlements: async (groupId) => {
        try {
            const response = await API.get(`/settlements/group/${groupId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch settlements' };
        }
    },

    // Get current user's settlements
    getUserSettlements: async () => {
        try {
            const response = await API.get('/settlements/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch settlements' };
        }
    },

    // Get outstanding balances for a group
    getOutstandingBalances: async (groupId) => {
        try {
            const response = await API.get(`/settlements/balances/${groupId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch balances' };
        }
    },

    // Get single settlement
    getSettlementById: async (settlementId) => {
        try {
            const response = await API.get(`/settlements/${settlementId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch settlement' };
        }
    },

    // Update settlement
    updateSettlement: async (settlementId, data) => {
        try {
            const response = await API.put(`/settlements/${settlementId}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update settlement' };
        }
    }
};