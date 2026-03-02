import Transaction from '../models/Transaction.model.js';
import Settlement from '../models/Settlement.model.js';
import Group from '../models/Group.model.js';
import User from '../models/User.model.js';
import chapaService from '../services/chapa.service.js';
import telebirrService from '../services/telebirr.service.js';
import { createNotification } from './notification.controller.js';
import { emitToUser, emitToGroup } from '../socket/socket.js';

// @desc    Initialize payment for a settlement
// @route   POST /api/payments/initialize
// @access  Private
export const initializePayment = async (req, res) => {
    try {
        const { settlementId, paymentMethod, returnUrl } = req.body;
        const userId = req.user._id;

        // Get settlement details
        const settlement = await Settlement.findById(settlementId)
            .populate('fromUser', 'FullName email phoneNumber')
            .populate('toUser', 'FullName email phoneNumber')
            .populate('groupId', 'name');

        if (!settlement) {
            return res.status(404).json({ 
                success: false,
                message: 'Settlement not found' 
            });
        }

        // Verify user is the payer
        if (settlement.fromUser._id.toString() !== userId.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Only the payer can initiate payment' 
            });
        }

        // Check if settlement is already completed
        if (settlement.status === 'completed') {
            return res.status(400).json({ 
                success: false,
                message: 'This settlement is already completed' 
            });
        }

        // Generate unique transaction ID
        const transactionId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Create transaction record
        const transaction = await Transaction.create({
            transactionId,
            settlementId: settlement._id,
            groupId: settlement.groupId,
            fromUser: settlement.fromUser._id,
            toUser: settlement.toUser._id,
            amount: settlement.amount,
            paymentMethod,
            provider: paymentMethod === 'chapa' ? 'chapa' : 'telebirr',
            status: 'pending',
            metadata: {
                settlementAmount: settlement.amount,
                groupName: settlement.groupId.name
            }
        });

        let paymentResult;

        // Initialize payment based on method
        if (paymentMethod === 'chapa') {
            paymentResult = await chapaService.initializePayment({
                amount: settlement.amount,
                email: settlement.fromUser.email || 'customer@example.com',
                firstName: settlement.fromUser.FullName.split(' ')[0],
                lastName: settlement.fromUser.FullName.split(' ')[1] || '',
                title: `Payment to ${settlement.toUser.FullName}`,
                description: `Settlement for ${settlement.groupId.name}`,
                returnUrl: returnUrl || `${process.env.CLIENT_URL}/payment/complete`
            });

            if (paymentResult.success) {
                transaction.providerData = paymentResult.data;
                transaction.checkoutUrl = paymentResult.checkoutUrl;
                transaction.metadata.txRef = paymentResult.txRef;
                await transaction.save();
            }
        } 
        else if (paymentMethod === 'telebirr') {
            paymentResult = await telebirrService.initializePayment({
                amount: settlement.amount,
                phoneNumber: settlement.fromUser.phoneNumber,
                description: `Payment to ${settlement.toUser.FullName} for ${settlement.groupId.name}`,
                returnUrl: returnUrl || `${process.env.CLIENT_URL}/payment/complete`
            });

            if (paymentResult.success) {
                transaction.providerData = paymentResult.data;
                transaction.checkoutUrl = paymentResult.checkoutUrl;
                transaction.metadata.txRef = paymentResult.transactionId;
                await transaction.save();
            }
        } 
        else {
            // Cash payment - just mark as completed
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            await transaction.save();

            // Update settlement status
            settlement.status = 'completed';
            settlement.settledAt = new Date();
            await settlement.save();

            // Create notification
            await createNotification({
                recipient: settlement.toUser._id,
                type: 'settlement_received',
                title: 'Payment Received (Cash)',
                message: `${settlement.fromUser.FullName} paid you ETB ${settlement.amount.toFixed(2)} in cash`,
                data: {
                    groupId: settlement.groupId._id,
                    settlementId: settlement._id,
                    amount: settlement.amount,
                    actionBy: userId
                },
                priority: 'high'
            });

            // Emit socket events
            emitToUser(settlement.toUser._id.toString(), 'payment_received', {
                from: settlement.fromUser.FullName,
                amount: settlement.amount,
                groupId: settlement.groupId._id,
                message: `You received ETB ${settlement.amount.toFixed(2)} from ${settlement.fromUser.FullName} (Cash)`
            });

            emitToGroup(settlement.groupId._id.toString(), 'balances_updated', {
                groupId: settlement.groupId._id,
                message: 'Balances updated after cash payment'
            });

            return res.json({
                success: true,
                message: 'Cash payment recorded successfully',
                transaction,
                requiresRedirect: false
            });
        }

        if (!paymentResult.success) {
            transaction.status = 'failed';
            transaction.errorMessage = paymentResult.error;
            await transaction.save();

            return res.status(400).json({
                success: false,
                message: 'Payment initialization failed',
                error: paymentResult.error
            });
        }

        res.json({
            success: true,
            message: 'Payment initialized successfully',
            transaction,
            checkoutUrl: paymentResult.checkoutUrl,
            requiresRedirect: true
        });

    } catch (error) {
        console.error('❌ Payment initialization error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Server error during payment initialization' 
        });
    }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const { transactionId, txRef } = req.body;

        let transaction;
        
        if (transactionId) {
            transaction = await Transaction.findOne({ transactionId });
        } else if (txRef) {
            transaction = await Transaction.findOne({ 'metadata.txRef': txRef });
        }

        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }

        if (transaction.status === 'completed') {
            return res.json({
                success: true,
                message: 'Payment already completed',
                transaction
            });
        }

        let verificationResult;

        if (transaction.paymentMethod === 'chapa') {
            const txRef = transaction.metadata.txRef;
            verificationResult = await chapaService.verifyPayment(txRef);
        } else if (transaction.paymentMethod === 'telebirr') {
            const txRef = transaction.metadata.txRef;
            verificationResult = await telebirrService.checkPaymentStatus(txRef);
        } else {
            return res.json({
                success: true,
                message: 'Cash payment doesn\'t need verification',
                transaction
            });
        }

        if (verificationResult.success && 
            (verificationResult.status === 'success' || verificationResult.status === 'completed')) {
            
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            await transaction.save();

            // Update settlement
            const settlement = await Settlement.findById(transaction.settlementId);
            if (settlement) {
                settlement.status = 'completed';
                settlement.settledAt = new Date();
                await settlement.save();

                // Create notification
                await createNotification({
                    recipient: transaction.toUser,
                    type: 'settlement_received',
                    title: 'Payment Received',
                    message: `You received ETB ${transaction.amount.toFixed(2)} via ${transaction.paymentMethod}`,
                    data: {
                        groupId: transaction.groupId,
                        settlementId: settlement._id,
                        amount: transaction.amount,
                        actionBy: transaction.fromUser
                    },
                    priority: 'high'
                });

                // Emit socket events
                const fromUser = await User.findById(transaction.fromUser).select('FullName');
                emitToUser(transaction.toUser.toString(), 'payment_received', {
                    from: fromUser.FullName,
                    amount: transaction.amount,
                    groupId: transaction.groupId,
                    message: `You received ETB ${transaction.amount.toFixed(2)} via ${transaction.paymentMethod}`
                });

                emitToGroup(transaction.groupId.toString(), 'balances_updated', {
                    groupId: transaction.groupId,
                    message: 'Balances updated after payment'
                });
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                transaction
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                error: verificationResult.error
            });
        }

    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Server error during payment verification' 
        });
    }
};

// @desc    Get user's transactions
// @route   GET /api/payments/transactions
// @access  Private
export const getUserTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        const transactions = await Transaction.find({
            $or: [{ fromUser: userId }, { toUser: userId }]
        })
        .populate('fromUser', 'FullName')
        .populate('toUser', 'FullName')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const total = await Transaction.countDocuments({
            $or: [{ fromUser: userId }, { toUser: userId }]
        });

        res.json({
            success: true,
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('❌ Get transactions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching transactions' 
        });
    }
};

// @desc    Get transaction by ID
// @route   GET /api/payments/transactions/:id
// @access  Private
export const getTransactionById = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user._id;

        const transaction = await Transaction.findById(transactionId)
            .populate('fromUser', 'FullName email phoneNumber')
            .populate('toUser', 'FullName email phoneNumber')
            .populate('groupId', 'name')
            .populate('settlementId');

        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }

        // Check if user is involved
        if (transaction.fromUser._id.toString() !== userId.toString() && 
            transaction.toUser._id.toString() !== userId.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to view this transaction' 
            });
        }

        res.json({
            success: true,
            transaction
        });

    } catch (error) {
        console.error('❌ Get transaction error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching transaction' 
        });
    }
};

// @desc    Webhook handler for Chapa
// @route   POST /api/payments/webhook/chapa
// @access  Public
export const chapaWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-chapa-signature'];
        const payload = req.body;

        // Verify webhook signature
        const isValid = chapaService.verifyWebhook(signature, payload);
        
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        const { tx_ref, status } = payload;

        // Find transaction by tx_ref
        const transaction = await Transaction.findOne({ 'metadata.txRef': tx_ref });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (status === 'success') {
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            await transaction.save();

            // Update settlement
            const settlement = await Settlement.findById(transaction.settlementId);
            if (settlement) {
                settlement.status = 'completed';
                settlement.settledAt = new Date();
                await settlement.save();
            }
        }

        res.json({ received: true });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};