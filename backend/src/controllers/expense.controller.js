import Expense from '../models/Expense.model.js';
import Group from '../models/Group.model.js';
import { createNotification } from './notification.controller.js';

// // Create a new expense
// export const createExpense = async (req, res) => {
//     try {
//         const { description, amount, groupId, paidBy, splitType, splits, category, notes } = req.body;
//         const userId = req.user._id;

//         // Validate required fields
//         if (!description || !amount || !groupId || !paidBy) {
//             return res.status(400).json({ 
//                 message: 'Missing required fields' 
//             });
//         }

//         // Check if user is member of the group
//         const group = await Group.findOne({
//             _id: groupId,
//             'members.user': userId
//         });

//         if (!group) {
//             return res.status(403).json({ 
//                 message: 'You are not a member of this group' 
//             });
//         }

//         // Prepare splits based on split type
//         let expenseSplits = [];
        
//         if (splitType === 'equal') {
//             // Get all group members
//             const memberCount = group.members.length;
//             const splitAmount = amount / memberCount;
            
//             // Round to 2 decimal places, handle remainder
//             const roundedAmount = Math.floor(splitAmount * 100) / 100;
//             const remainder = amount - (roundedAmount * memberCount);
            
//             expenseSplits = group.members.map((member, index) => ({
//                 user: member.user,
//                 amount: index === 0 ? roundedAmount + remainder : roundedAmount, // First member gets remainder
//                 isSettled: member.user.toString() === paidBy // If this member paid, their split is settled
//             }));
//         } else {
//             // Custom splits - validate they sum to total
//             const totalFromSplits = splits.reduce((sum, s) => sum + s.amount, 0);
//             if (Math.abs(totalFromSplits - amount) > 0.01) {
//                 return res.status(400).json({ 
//                     message: 'Split amounts must equal total amount' 
//                 });
//             }
            
//             expenseSplits = splits.map(split => ({
//                 user: split.user,
//                 amount: split.amount,
//                 isSettled: split.user === paidBy
//             }));
//         }

//         // Create expense
//         const expense = await Expense.create({
//             description,
//             amount,
//             groupId,
//             paidBy,
//             splitType,
//             splits: expenseSplits,
//             category: category || 'other',
//             notes
//         });

//         // Update group total expenses
//         group.totalExpenses = (group.totalExpenses || 0) + amount;
//         await group.save();

//         // Populate user details in response
//         const populatedExpense = await Expense.findById(expense._id)
//             .populate('paidBy', 'FullName phoneNumber')
//             .populate('splits.user', 'FullName phoneNumber')
//             .populate('groupId', 'name');

//         res.status(201).json({
//             success: true,
//             expense: populatedExpense
//         });

//     } catch (error) {
//         console.error('Create expense error:', error);
//         res.status(500).json({ 
//             message: error.message || 'Server error while creating expense' 
//         });
//     }
// };
import User from '../models/User.model.js';

// Create a new expense
export const createExpense = async (req, res) => {
    try {
        const { description, amount, groupId, paidBy, splitType, splits, category, notes } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!description || !amount || !groupId || !paidBy) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: groupId,
            'members.user': userId
        }).populate('members.user', 'FullName email');

        if (!group) {
            return res.status(403).json({ 
                message: 'You are not a member of this group' 
            });
        }

        // Get the payer's name
        const payer = await User.findById(paidBy).select('FullName');

        // Prepare splits based on split type
        let expenseSplits = [];
        
        if (splitType === 'equal') {
            // Get all group members
            const memberCount = group.members.length;
            const splitAmount = amount / memberCount;
            
            // Round to 2 decimal places, handle remainder
            const roundedAmount = Math.floor(splitAmount * 100) / 100;
            const remainder = amount - (roundedAmount * memberCount);
            
            expenseSplits = group.members.map((member, index) => ({
                user: member.user._id,
                amount: index === 0 ? roundedAmount + remainder : roundedAmount,
                isSettled: member.user._id.toString() === paidBy
            }));
        } else {
            // Custom splits - validate they sum to total
            const totalFromSplits = splits.reduce((sum, s) => sum + s.amount, 0);
            if (Math.abs(totalFromSplits - amount) > 0.01) {
                return res.status(400).json({ 
                    message: 'Split amounts must equal total amount' 
                });
            }
            
            expenseSplits = splits.map(split => ({
                user: split.user,
                amount: split.amount,
                isSettled: split.user === paidBy
            }));
        }

        // Create expense
        const expense = await Expense.create({
            description,
            amount,
            groupId,
            paidBy,
            splitType,
            splits: expenseSplits,
            category: category || 'other',
            notes
        });

        // Update group total expenses
        group.totalExpenses = (group.totalExpenses || 0) + amount;
        await group.save();

        // ========== CREATE NOTIFICATIONS ==========
        try {
            // 1. Notify all group members about the new expense
            for (const member of group.members) {
                const memberId = member.user._id.toString();
                
                // Find this member's split amount
                const memberSplit = expenseSplits.find(
                    s => s.user.toString() === memberId
                );
                
                if (memberSplit) {
                    // If this member is the payer
                    if (memberId === paidBy.toString()) {
                        await createNotification({
                            recipient: memberId,
                            type: 'expense_added',
                            title: 'Expense Added',
                            message: `You added "${description}" for ETB ${amount.toFixed(2)} in ${group.name}`,
                            data: {
                                groupId,
                                expenseId: expense._id,
                                amount,
                                actionBy: userId
                            },
                            priority: 'low'
                        });
                    } 
                    // If this member owes money
                    else if (memberSplit.amount > 0) {
                        await createNotification({
                            recipient: memberId,
                            type: 'expense_added',
                            title: 'New Expense Added',
                            message: `${payer.FullName} added "${description}" - You owe ETB ${memberSplit.amount.toFixed(2)} in ${group.name}`,
                            data: {
                                groupId,
                                expenseId: expense._id,
                                amount: memberSplit.amount,
                                actionBy: paidBy
                            },
                            priority: 'high'
                        });
                    }
                }
            }

            // 2. Special notification for people who are not in the group but are in custom splits? 
            // (Not needed since all splits should be group members)
            
            console.log('✅ Notifications created for expense');
        } catch (notifError) {
            console.error('❌ Failed to create expense notifications:', notifError);
            // Don't fail the main request if notifications fail
        }
        // ==========================================

        // Populate user details in response
        const populatedExpense = await Expense.findById(expense._id)
            .populate('paidBy', 'FullName phoneNumber')
            .populate('splits.user', 'FullName phoneNumber')
            .populate('groupId', 'name');

        res.status(201).json({
            success: true,
            expense: populatedExpense
        });

    } catch (error) {
        console.error('❌ Create expense error:', error);
        res.status(500).json({ 
            message: error.message || 'Server error while creating expense' 
        });
    }
};

//Get all expenses for a group
export const getGroupExpenses = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user._id;

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: groupId,
            'members.user': userId
        });

        if (!group) {
            return res.status(403).json({ 
                message: 'You are not a member of this group' 
            });
        }

        // Get all expenses for the group
        const expenses = await Expense.find({ groupId })
            .populate('paidBy', 'FullName phoneNumber')
            .populate('splits.user', 'FullName phoneNumber')
            .sort({ date: -1 }); // Most recent first

        res.json({
            success: true,
            count: expenses.length,
            expenses
        });

    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching expenses' 
        });
    }
};

//Get single expense by ID
export const getExpenseById = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const userId = req.user._id;

        const expense = await Expense.findById(expenseId)
            .populate('paidBy', 'FullName phoneNumber')
            .populate('splits.user', 'FullName phoneNumber')
            .populate('groupId', 'name');

        if (!expense) {
            return res.status(404).json({ 
                message: 'Expense not found' 
            });
        }

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: expense.groupId,
            'members.user': userId
        });

        if (!group) {
            return res.status(403).json({ 
                message: 'You are not a member of this group' 
            });
        }

        res.json({
            success: true,
            expense
        });

    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching expense' 
        });
    }
};

//Update expense
export const updateExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const userId = req.user._id;
        const updates = req.body;

        const expense = await Expense.findById(expenseId);

        if (!expense) {
            return res.status(404).json({ 
                message: 'Expense not found' 
            });
        }

        // Check if user is the one who paid
        if (expense.paidBy.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'Only the person who paid can update this expense' 
            });
        }

        // Update fields
        if (updates.description) expense.description = updates.description;
        if (updates.amount) expense.amount = updates.amount;
        if (updates.category) expense.category = updates.category;
        if (updates.notes !== undefined) expense.notes = updates.notes;

        await expense.save();

        const updatedExpense = await Expense.findById(expenseId)
            .populate('paidBy', 'FullName phoneNumber')
            .populate('splits.user', 'FullName phoneNumber')
            .populate('groupId', 'name');

        res.json({
            success: true,
            expense: updatedExpense
        });

    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ 
            message: 'Server error while updating expense' 
        });
    }
};

//Delete expense
export const deleteExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const userId = req.user._id;

        const expense = await Expense.findById(expenseId);

        if (!expense) {
            return res.status(404).json({ 
                message: 'Expense not found' 
            });
        }

        // Check if user is the one who paid
        if (expense.paidBy.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'Only the person who paid can delete this expense' 
            });
        }

        // Update group total expenses
        const group = await Group.findById(expense.groupId);
        if (group) {
            group.totalExpenses = (group.totalExpenses || 0) - expense.amount;
            await group.save();
        }

        await expense.deleteOne();

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });

    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ 
            message: 'Server error while deleting expense' 
        });
    }
};