import Expense from '../models/Expense.model.js';
import Group from '../models/Group.model.js';

// Calculate balances for a group
export const getGroupBalances = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user._id;

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: groupId,
            'members.user': userId
        }).populate('members.user', 'FullName phoneNumber');

        if (!group) {
            return res.status(403).json({ 
                message: 'You are not a member of this group' 
            });
        }

        // Get all expenses for the group
        const expenses = await Expense.find({ groupId })
            .populate('paidBy', 'FullName phoneNumber')
            .populate('splits.user', 'FullName phoneNumber');

        // Calculate balances
        const balances = {};
        
        // Initialize balances for all members
        group.members.forEach(member => {
            balances[member.user._id.toString()] = {
                userId: member.user._id,
                name: member.user.FullName,
                phoneNumber: member.user.phoneNumber,
                paid: 0,      // Amount they paid
                owed: 0,      // Amount they owe to others
                netBalance: 0 // paid - owed (positive means others owe them)
            };
        });

        // Calculate from expenses
        expenses.forEach(expense => {
            const payerId = expense.paidBy._id.toString();
            
            // Add to what this person paid
            balances[payerId].paid += expense.amount;

            // Calculate what each person owes
            expense.splits.forEach(split => {
                const userId = split.user._id.toString();
                
                // If this split is not settled, add to owed amount
                if (!split.isSettled) {
                    balances[userId].owed += split.amount;
                }
            });
        });

        // Calculate net balances
        Object.keys(balances).forEach(userId => {
            balances[userId].netBalance = balances[userId].paid - balances[userId].owed;
        });

        // Calculate simplified debts (who owes whom)
        const debts = simplifyDebts(balances);

        res.json({
            success: true,
            balances: Object.values(balances),
            simplifiedDebts: debts
        });

    } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({ 
            message: 'Server error while calculating balances' 
        });
    }
};

// Helper function to simplify debts (minimize transactions)
const simplifyDebts = (balances) => {
    // Create arrays of debtors and creditors
    const debtors = [];
    const creditors = [];
    
    Object.values(balances).forEach(user => {
        if (user.netBalance < -0.01) { // Owes money (negative)
            debtors.push({
                userId: user.userId,
                name: user.name,
                amount: Math.abs(user.netBalance)
            });
        } else if (user.netBalance > 0.01) { // Should receive money (positive)
            creditors.push({
                userId: user.userId,
                name: user.name,
                amount: user.netBalance
            });
        }
    });

    // Sort by amount (largest first)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        
        const amount = Math.min(debtor.amount, creditor.amount);
        
        if (amount > 0.01) {
            transactions.push({
                from: debtor.userId,
                fromName: debtor.name,
                to: creditor.userId,
                toName: creditor.name,
                amount: Math.round(amount * 100) / 100
            });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return transactions;
};

//Get user's personal balance across all groups
export const getMyBalances = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all groups where user is a member
        const groups = await Group.find({
            'members.user': userId,
            isActive: true
        });

        let totalOwed = 0;
        let totalOwe = 0;
        const groupBalances = [];

        for (const group of groups) {
            // Get expenses for this group
            const expenses = await Expense.find({ 
                groupId: group._id 
            }).populate('paidBy', 'FullName');

            let paid = 0;
            let owed = 0;

            expenses.forEach(expense => {
                // Amount user paid
                if (expense.paidBy._id.toString() === userId.toString()) {
                    paid += expense.amount;
                }

                // Amount user owes
                expense.splits.forEach(split => {
                    if (split.user.toString() === userId.toString() && !split.isSettled) {
                        owed += split.amount;
                    }
                });
            });

            const netBalance = paid - owed;
            
            if (netBalance > 0) totalOwed += netBalance;
            if (netBalance < 0) totalOwe += Math.abs(netBalance);

            groupBalances.push({
                groupId: group._id,
                groupName: group.name,
                netBalance,
                paid,
                owed
            });
        }

        res.json({
            success: true,
            summary: {
                totalOwed,  // Money others owe you
                totalOwe,   // Money you owe others
                netWorth: totalOwed - totalOwe
            },
            groupBalances
        });

    } catch (error) {
        console.error('Get my balances error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching balances' 
        });
    }
};