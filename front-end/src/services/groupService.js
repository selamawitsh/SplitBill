import API from './api';

export const groupService = {
    // Create a new group
    createGroup: async (groupData) => {
        try {
            const response = await API.post('/groups', groupData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create group' };
        }
    },

    // Get all user groups
    getUserGroups: async () => {
        try {
            const response = await API.get('/groups');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch groups' };
        }
    },

    // Get single group
    getGroupById: async (groupId) => {
        try {
            const response = await API.get(`/groups/${groupId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch group' };
        }
    },

    // Update group
    updateGroup: async (groupId, groupData) => {
        try {
            const response = await API.put(`/groups/${groupId}`, groupData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update group' };
        }
    },
    
     deleteGroup: async (groupId) => {
        try {
            const response = await API.delete(`/groups/${groupId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete group' };
        }
    },

    // Add member
    addMember: async (groupId, phoneNumber) => {
        try {
            const response = await API.post(`/groups/${groupId}/members`, { phoneNumber });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to add member' };
        }
    },

    // Remove member
    removeMember: async (groupId, userId) => {
        try {
            const response = await API.delete(`/groups/${groupId}/members/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to remove member' };
        }
    },

    // Add this to your groupService object
    leaveGroup: async (groupId) => {
        try {
            const response = await API.post(`/groups/${groupId}/leave`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to leave group' };
        }
    },
};

