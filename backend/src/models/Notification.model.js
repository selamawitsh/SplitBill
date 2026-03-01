import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'expense_added',
            'expense_updated',
            'expense_deleted',
            'settlement_made',
            'settlement_received',
            'group_added',
            'member_added',
            'member_removed',
            'payment_reminder',
            'debt_reminder'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        },
        expenseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expense'
        },
        settlementId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Settlement'
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: Number,
        actionBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days from now
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;