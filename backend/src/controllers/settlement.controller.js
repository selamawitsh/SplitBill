import Settlement from '../models/Settlement.model.js';
import Expense from '../models/Expense.model.js';
import Group from '../models/Group.model.js';
import mongoose from 'mongoose';

// @desc    Create a new settlement
export const createSettlement = async (req, res) => {
    try {
        const { groupId, toUser, amount, paymentMethod, notes } = req.body;
        const fromUser = req.user._id;

        console.log('📥 Creating settlement:', { fromUser, toUser, amount, groupId });

        // Validate required fields
        if (!groupId || !toUser || !amount) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }

        // Check if users are in the same group
        const group = await Group.findOne({
            _id: groupId,
            'members.user': { $all: [fromUser, toUser] }
        });

        if (!group) {
            return res.status(404).json({ 
                message: 'Group not found or users not in same group' 
            });
        }

        // Don't allow settling with yourself
        if (fromUser.toString() === toUser.toString()) {
            return res.status(400).json({ 
                message: 'Cannot settle with yourself' 
            });
        }

        // Create settlement
        const settlement = await Settlement.create({
            groupId,
            fromUser,
            toUser,
            amount,
            paymentMethod: paymentMethod || 'cash',
            notes,
            status: 'completed',
            settledAt: new Date()
        });

        // Find all expenses where fromUser owes money to toUser
        const expenses = await Expense.find({
            groupId,
            'splits.user': fromUser,
            'splits.isSettled': false
        });

        console.log('📊 Found unsettled expenses:', expenses.length);

        // Update the splits for these expenses
        let remainingAmount = amount;
        const settledExpenses = [];

        for (const expense of expenses) {
            if (remainingAmount <= 0) break;

            // Find the split for fromUser in this expense
            const splitIndex = expense.splits.findIndex(
                s => s.user.toString() === fromUser.toString() && !s.isSettled
            );

            if (splitIndex !== -1) {
                const splitAmount = expense.splits[splitIndex].amount;
                
                if (splitAmount <= remainingAmount) {
                    // Settle this entire split
                    expense.splits[splitIndex].isSettled = true;
                    expense.splits[splitIndex].settledAt = new Date();
                    remainingAmount -= splitAmount;
                    settledExpenses.push({
                        expenseId: expense._id,
                        amount: splitAmount
                    });
                } else {
                    // Partial settlement - we need to split the expense
                    // This is more complex - for now, we'll just mark as settled
                    // In a real app, you'd want to handle partial settlements
                    expense.splits[splitIndex].isSettled = true;
                    expense.splits[splitIndex].settledAt = new Date();
                    remainingAmount = 0;
                    settledExpenses.push({
                        expenseId: expense._id,
                        amount: splitAmount
                    });
                }
                
                await expense.save();
            }
        }

        // Update settlement with settled expenses
        settlement.settledExpenses = settledExpenses;
        await settlement.save();

        // Populate user details
        const populatedSettlement = await Settlement.findById(settlement._id)
            .populate('fromUser', 'FullName phoneNumber')
            .populate('toUser', 'FullName phoneNumber')
            .populate('groupId', 'name')
            .populate('settledExpenses.expenseId', 'description amount');

        res.status(201).json({
            success: true,
            settlement: populatedSettlement
        });

    } catch (error) {
        console.error('❌ Create settlement error:', error);
        res.status(500).json({ 
            message: error.message || 'Server error while creating settlement' 
        });
    }
};

// @desc    Get all settlements for a group
export const getGroupSettlements = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user._id;

        // Check if user is in group
        const group = await Group.findOne({
            _id: groupId,
            'members.user': userId
        });

        if (!group) {
            return res.status(403).json({ 
                message: 'You are not a member of this group' 
            });
        }

        const settlements = await Settlement.find({ groupId })
            .populate('fromUser', 'FullName phoneNumber')
            .populate('toUser', 'FullName phoneNumber')
            .populate('settledExpenses.expenseId', 'description amount')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: settlements.length,
            settlements
        });

    } catch (error) {
        console.error('Get settlements error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching settlements' 
        });
    }
};

// @desc    Get user's settlements
export const getUserSettlements = async (req, res) => {
    try {
        const userId = req.user._id;

        const settlements = await Settlement.find({
            $or: [{ fromUser: userId }, { toUser: userId }]
        })
            .populate('fromUser', 'FullName phoneNumber')
            .populate('toUser', 'FullName phoneNumber')
            .populate('groupId', 'name')
            .populate('settledExpenses.expenseId', 'description amount')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: settlements.length,
            settlements
        });

    } catch (error) {
        console.error('Get user settlements error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching settlements' 
        });
    }
};

// @desc    Get single settlement
export const getSettlementById = async (req, res) => {
    try {
        const settlementId = req.params.id;
        const userId = req.user._id;

        const settlement = await Settlement.findById(settlementId)
            .populate('fromUser', 'FullName phoneNumber')
            .populate('toUser', 'FullName phoneNumber')
            .populate('groupId', 'name')
            .populate('settledExpenses.expenseId', 'description amount');

        if (!settlement) {
            return res.status(404).json({ 
                message: 'Settlement not found' 
            });
        }

        // Check if user is involved in this settlement
        if (settlement.fromUser._id.toString() !== userId.toString() && 
            settlement.toUser._id.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'You are not involved in this settlement' 
            });
        }

        res.json({
            success: true,
            settlement
        });

    } catch (error) {
        console.error('Get settlement error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching settlement' 
        });
    }
};

// @desc    Update settlement status
export const updateSettlement = async (req, res) => {
    try {
        const settlementId = req.params.id;
        const userId = req.user._id;
        const { status, transactionId } = req.body;

        const settlement = await Settlement.findById(settlementId);

        if (!settlement) {
            return res.status(404).json({ 
                message: 'Settlement not found' 
            });
        }

        // Only the payer can update
        if (settlement.fromUser.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'Only the payer can update this settlement' 
            });
        }

        if (status) settlement.status = status;
        if (transactionId) settlement.transactionId = transactionId;
        
        if (status === 'completed' && !settlement.settledAt) {
            settlement.settledAt = new Date();
        }

        await settlement.save();

        const updatedSettlement = await Settlement.findById(settlementId)
            .populate('fromUser', 'FullName phoneNumber')
            .populate('toUser', 'FullName phoneNumber')
            .populate('settledExpenses.expenseId', 'description amount');

        res.json({
            success: true,
            settlement: updatedSettlement
        });

    } catch (error) {
        console.error('Update settlement error:', error);
        res.status(500).json({ 
            message: 'Server error while updating settlement' 
        });
    }
};

// @desc    Get outstanding balances between users
export const getOutstandingBalances = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const currentUserId = req.user._id;

        console.log('📊 Calculating balances for group:', groupId, 'user:', currentUserId);

        // Get all expenses for the group
        const expenses = await Expense.find({ groupId })
            .populate('paidBy', 'FullName')
            .populate('splits.user', 'FullName');

        console.log('📊 Found expenses:', expenses.length);

        // Calculate what each user owes to everyone else
        const balances = {}; // Format: { "fromUser-toUser": amount }

        expenses.forEach(expense => {
            const payerId = expense.paidBy._id.toString();
            const payerName = expense.paidBy.FullName;
            
            console.log(`📊 Processing expense: ${expense.description}, paid by: ${payerName}`);

            expense.splits.forEach(split => {
                if (!split.isSettled) {
                    const oweUserId = split.user._id.toString();
                    const oweUserName = split.user.FullName;
                    const amount = split.amount;

                    // If the person who owes is NOT the person who paid
                    if (oweUserId !== payerId) {
                        const key = `${oweUserId}-${payerId}`;
                        
                        if (!balances[key]) {
                            balances[key] = {
                                from: oweUserId,
                                fromName: oweUserName,
                                to: payerId,
                                toName: payerName,
                                amount: 0
                            };
                        }
                        
                        balances[key].amount += amount;
                        console.log(`📊 ${oweUserName} owes ${payerName}: ${amount} ETB (total: ${balances[key].amount})`);
                    }
                }
            });
        });

        console.log('📊 Raw balances before settlements:', balances);

        // Get all completed settlements to adjust balances
        const settlements = await Settlement.find({
            groupId,
            status: 'completed'
        });

        console.log('📊 Found settlements:', settlements.length);

        settlements.forEach(settlement => {
            const fromUser = settlement.fromUser.toString();
            const toUser = settlement.toUser.toString();
            const key = `${fromUser}-${toUser}`;
            
            if (balances[key]) {
                balances[key].amount -= settlement.amount;
                console.log(`📊 After settlement: ${fromUser} to ${toUser} - remaining: ${balances[key].amount}`);
                
                // Remove if amount becomes zero or negative
                if (balances[key].amount <= 0.01) {
                    delete balances[key];
                    console.log(`📊 Removed zero balance for ${key}`);
                }
            }
        });

        // Filter to only show balances where current user is involved
        const userBalances = Object.values(balances).filter(b => {
            const isInvolved = b.from === currentUserId.toString() || b.to === currentUserId.toString();
            return isInvolved && b.amount > 0.01;
        });

        console.log('📊 Final balances for user:', userBalances);

        res.json({
            success: true,
            balances: userBalances
        });

    } catch (error) {
        console.error('❌ Get outstanding balances error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching balances' 
        });
    }
};