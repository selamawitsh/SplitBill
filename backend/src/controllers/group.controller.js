import Group from '../models/Group.model.js';
import User from '../models/User.model.js';
import { createNotification } from './notification.controller.js';

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
        const groupId = req.params.id;  // This should be 'id' not 'groupId'
        const userId = req.user._id;

        console.log('📥 Getting group by ID:', groupId, 'for user:', userId);

        // Validate that groupId is a valid ObjectId
        if (!groupId || groupId.length !== 24) {
            console.log('❌ Invalid group ID format:', groupId);
            return res.status(400).json({ 
                message: 'Invalid group ID format' 
            });
        }

        // Find group and check if user is member
        const group = await Group.findOne({
            _id: groupId,
            'members.user': userId,
            isActive: true
        })
        .populate('members.user', 'FullName email phoneNumber')
        .populate('createdBy', 'FullName');

        if (!group) {
            console.log('❌ Group not found or user not member:', groupId);
            return res.status(404).json({ 
                message: 'Group not found or you are not a member' 
            });
        }

        console.log('✅ Group found:', group.name);

        res.json({
            success: true,
            group
        });

    } catch (error) {
        console.error('❌ Get group error:', error);
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


// ADD MEMBER TO GROUP
export const addMember = async (req, res) => {
    try {
        const groupId = req.params.id;
        const currentUserId = req.user._id;
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
        const group = await Group.findById(groupId)
            .populate('members.user', 'FullName');
        
        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found' 
            });
        }

        // Check if the current user is a member
        const isCurrentUserMember = group.members.some(
            m => m.user._id.toString() === currentUserId.toString()
        );

        if (!isCurrentUserMember) {
            return res.status(403).json({ 
                message: 'You must be a member to add others to the group' 
            });
        }

        // Check if user is already a member
        const isMember = group.members.some(
            m => m.user._id.toString() === userToAdd._id.toString()
        );

        if (isMember) {
            return res.status(400).json({ 
                message: 'User is already a member' 
            });
        }

        // Get the current user's name
        const currentUser = await User.findById(currentUserId).select('FullName');

        // Add user to group
        group.members.push({
            user: userToAdd._id,
            role: 'member'
        });

        await group.save();

        // Return updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('members.user', 'FullName email phoneNumber')
            .populate('createdBy', 'FullName');

        // ========== CREATE NOTIFICATIONS ==========
        try {
            // Notify the new member
            await createNotification({
                recipient: userToAdd._id,
                type: 'member_added',
                title: 'Added to Group',
                message: `${currentUser.FullName} added you to "${group.name}"`,
                data: {
                    groupId: groupId.toString(),
                    actionBy: currentUserId.toString()
                },
                priority: 'high'
            });

            // Socket emit for real-time update
            emitToGroup(groupId.toString(), 'member_added', {
                member: userToAdd,
                addedBy: currentUser.FullName,
                message: `${currentUser.FullName} added ${userToAdd.FullName} to the group`,
                timestamp: new Date()
            });

        } catch (notifError) {
            console.error('❌ Failed to create notifications:', notifError);
        }
        // ==========================================

        res.json({
            success: true,
            group: updatedGroup,
            message: 'Member added successfully'
        });

    } catch (error) {
        console.error('❌ Add member error:', error);
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
        const group = await Group.findById(groupId)
            .populate('members.user', 'FullName');
        
        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found' 
            });
        }

        // Check if the person trying to remove is an admin
        const isCurrentUserAdmin = group.members.some(
            m => m.user._id.toString() === currentUserId.toString() && m.role === 'admin'
        );

        // If not admin, they can only remove themselves (which is handled by leaveGroup)
        if (!isCurrentUserAdmin) {
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

        // Get member details for notification
        const removedUser = await User.findById(memberIdToRemove).select('FullName');
        const currentUser = await User.findById(currentUserId).select('FullName');

        // Remove member
        group.members = group.members.filter(
            m => m.user._id.toString() !== memberIdToRemove
        );

        await group.save();

        // ========== CREATE NOTIFICATIONS ==========
        try {
            // 1. Notify the removed user
            await createNotification({
                recipient: memberIdToRemove,
                type: 'member_removed',
                title: 'Removed from Group',
                message: `${currentUser.FullName} removed you from "${group.name}"`,
                data: {
                    groupId,
                    actionBy: currentUserId
                },
                priority: 'high'
            });

            // 2. Notify remaining members (optional)
            for (const member of group.members) {
                if (member.user._id.toString() !== currentUserId.toString()) {
                    await createNotification({
                        recipient: member.user._id,
                        type: 'member_removed',
                        title: 'Member Removed',
                        message: `${removedUser.FullName} was removed from "${group.name}" by ${currentUser.FullName}`,
                        data: {
                            groupId,
                            actionBy: currentUserId
                        },
                        priority: 'low'
                    });
                }
            }

            console.log('✅ Member removal notifications created');
        } catch (notifError) {
            console.error('❌ Failed to create removal notifications:', notifError);
        }
        // ==========================================

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
        console.error('❌ Remove member error:', error);
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
        const group = await Group.findById(groupId)
            .populate('members.user', 'FullName');
        
        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found' 
            });
        }

        // Check if user is a member
        const isMember = group.members.some(
            m => m.user._id.toString() === userId.toString()
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

        // Get user details for notification
        const leavingUser = await User.findById(userId).select('FullName');

        // Remove user from members
        group.members = group.members.filter(
            m => m.user._id.toString() !== userId.toString()
        );

        await group.save();

        // ========== CREATE NOTIFICATIONS ==========
        try {
            // Notify all remaining members that someone left
            for (const member of group.members) {
                await createNotification({
                    recipient: member.user._id,
                    type: 'member_removed',
                    title: 'Member Left',
                    message: `${leavingUser.FullName} left "${group.name}"`,
                    data: {
                        groupId,
                        actionBy: userId
                    },
                    priority: 'low'
                });
            }

            console.log('✅ Leave group notifications created');
        } catch (notifError) {
            console.error('❌ Failed to create leave group notifications:', notifError);
        }
        // ==========================================

        res.json({
            success: true,
            message: 'You have successfully left the group'
        });

    } catch (error) {
        console.error('❌ Leave group error:', error);
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