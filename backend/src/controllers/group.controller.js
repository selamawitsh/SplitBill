import Group from '../models/Group.model.js';
import User from '../models/User.model.js';

// CREATE GROUP
export const createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user._id;

        if (!name) {
            return res.status(400).json({ 
                message: 'Group name is required' 
            });
        }

        const group = await Group.create({
            name,
            description: description || '',
            createdBy: userId,
            members: [{
                user: userId,
                role: 'admin'
            }]
        });

        const populatedGroup = await Group.findById(group._id)
            .populate('members.user', 'FullName email phoneNumber')
            .populate('createdBy', 'FullName');

        res.status(201).json({
            success: true,
            group: populatedGroup
        });

    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ 
            message: 'Server error while creating group' 
        });
    }
};

// GET ALL GROUPS FOR LOGGED IN USER
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const groups = await Group.find({
            'members.user': userId,
            isActive: true
        })
        .populate('members.user', 'FullName email phoneNumber')
        .populate('createdBy', 'FullName')
        .sort({ updatedAt: -1 });

        res.json({
            success: true,
            count: groups.length,
            groups
        });

    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching groups' 
        });
    }
};

// GET SINGLE GROUP BY ID
export const getGroupById = async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user._id;

        const group = await Group.findOne({
            _id: groupId,
            'members.user': userId,
            isActive: true
        })
        .populate('members.user', 'FullName email phoneNumber')
        .populate('createdBy', 'FullName');

        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found or you are not a member' 
            });
        }

        res.json({
            success: true,
            group
        });

    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching group' 
        });
    }
};

// UPDATE GROUP DETAILS
export const updateGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user._id;
        const { name, description } = req.body;

        // Only admins can update group details
        const group = await Group.findOne({
            _id: groupId,
            'members.user': userId,
            'members.role': 'admin'
        });

        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found or you are not an admin' 
            });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;

        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate('members.user', 'FullName email phoneNumber')
            .populate('createdBy', 'FullName');

        res.json({
            success: true,
            group: updatedGroup
        });

    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ 
            message: 'Server error while updating group' 
        });
    }
};

// ADD MEMBER TO GROUP - ANY MEMBER CAN ADD
export const addMember = async (req, res) => {
    try {
        const groupId = req.params.id;
        const currentUserId = req.user._id; // Person trying to add member
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ 
                message: 'Phone number is required' 
            });
        }

        // Find user to add by phone number
        const userToAdd = await User.findOne({ phoneNumber });
        if (!userToAdd) {
            return res.status(404).json({ 
                message: 'User not found with this phone number' 
            });
        }

        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found' 
            });
        }

        // Check if the current user is a member of the group
        const isCurrentUserMember = group.members.some(
            m => m.user.toString() === currentUserId.toString()
        );

        if (!isCurrentUserMember) {
            return res.status(403).json({ 
                message: 'You must be a member to add others to the group' 
            });
        }

        // Check if user is already a member
        const isMember = group.members.some(
            m => m.user.toString() === userToAdd._id.toString()
        );

        if (isMember) {
            return res.status(400).json({ 
                message: 'User is already a member' 
            });
        }

        // Add user to group (as regular member)
        group.members.push({
            user: userToAdd._id,
            role: 'member'
        });

        await group.save();

        // Return updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('members.user', 'FullName email phoneNumber')
            .populate('createdBy', 'FullName');

        res.json({
            success: true,
            group: updatedGroup,
            message: 'Member added successfully'
        });

    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ 
            message: 'Server error while adding member' 
        });
    }
};

// REMOVE MEMBER FROM GROUP - ONLY ADMINS CAN REMOVE OTHERS
export const removeMember = async (req, res) => {
    try {
        const groupId = req.params.id;
        const memberIdToRemove = req.params.userId;
        const currentUserId = req.user._id;

        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found' 
            });
        }

        // Check if the person trying to remove is an admin
        const isCurrentUserAdmin = group.members.some(
            m => m.user.toString() === currentUserId.toString() && m.role === 'admin'
        );

        // If not admin, they can only remove themselves
        if (!isCurrentUserAdmin && currentUserId.toString() !== memberIdToRemove) {
            return res.status(403).json({ 
                message: 'Only admins can remove other members' 
            });
        }

        // Check if trying to remove the creator
        if (group.createdBy.toString() === memberIdToRemove) {
            return res.status(400).json({ 
                message: 'Cannot remove the group creator' 
            });
        }

        // Remove member
        group.members = group.members.filter(
            m => m.user.toString() !== memberIdToRemove
        );

        await group.save();

        // Return updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('members.user', 'FullName email phoneNumber')
            .populate('createdBy', 'FullName');

        res.json({
            success: true,
            group: updatedGroup,
            message: currentUserId.toString() === memberIdToRemove 
                ? 'You have left the group' 
                : 'Member removed successfully'
        });

    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ 
            message: 'Server error while removing member' 
        });
    }
};

// LEAVE GROUP - ANY MEMBER CAN LEAVE
export const leaveGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user._id;

        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found' 
            });
        }

        // Check if user is a member
        const isMember = group.members.some(
            m => m.user.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(400).json({ 
                message: 'You are not a member of this group' 
            });
        }

        // Check if user is the creator
        if (group.createdBy.toString() === userId.toString()) {
            return res.status(400).json({ 
                message: 'Creator cannot leave the group. You can delete the group or transfer ownership.' 
            });
        }

        // Remove user from members
        group.members = group.members.filter(
            m => m.user.toString() !== userId.toString()
        );

        await group.save();

        res.json({
            success: true,
            message: 'You have successfully left the group'
        });

    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ 
            message: 'Server error while leaving group' 
        });
    }
};

// DELETE GROUP (Only creator can delete)
export const deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found' 
            });
        }

        // Check if user is the creator
        if (group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'Only the group creator can delete the group' 
            });
        }

        // Soft delete - set isActive to false
        group.isActive = false;
        await group.save();

        res.json({
            success: true,
            message: 'Group deleted successfully'
        });

    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ 
            message: 'Server error while deleting group' 
        });
    }
};