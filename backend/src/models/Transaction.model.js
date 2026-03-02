import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    settlementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Settlement',
        required: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    paymentMethod: {
        type: String,
        enum: ['chapa', 'telebirr', 'cash'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    provider: {
        type: String,
        enum: ['chapa', 'telebirr', 'none'],
        default: 'none'
    },
    providerData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    checkoutUrl: {
        type: String,
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    },
    completedAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for faster queries
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ fromUser: 1, createdAt: -1 });
transactionSchema.index({ toUser: 1, createdAt: -1 });
transactionSchema.index({ settlementId: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;