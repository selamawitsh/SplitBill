import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
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
        required: true,
        min: [0.01, 'Amount must be greater than 0']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'telebirr', 'chapa', 'other'],
        default: 'cash'
    },
    transactionId: {
        type: String, // For payment gateway reference
        default: null
    },
    notes: {
        type: String,
        maxlength: [200, 'Notes cannot exceed 200 characters']
    },
    settledExpenses: [{
        expenseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expense'
        },
        amount: Number
    }],
    settledAt: {
        type: Date
    }
}, {
    timestamps: true
});

const Settlement = mongoose.model('Settlement', settlementSchema);
export default Settlement;