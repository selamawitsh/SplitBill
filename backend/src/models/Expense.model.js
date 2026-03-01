import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [100, 'Description cannot exceed 100 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    splitType: {
        type: String,
        enum: ['equal', 'custom'],
        default: 'equal'
    },
    splits: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        isSettled: {
            type: Boolean,
            default: false
        },
        settledAt: {
            type: Date
        }
    }],
    date: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        enum: ['food', 'transport', 'entertainment', 'shopping', 'bills', 'other'],
        default: 'other'
    },
    notes: {
        type: String,
        maxlength: [200, 'Notes cannot exceed 200 characters']
    },
    receipt: {
        type: String, // URL to uploaded receipt image
        default: null
    }
}, {
    timestamps: true
});

// Calculate total amount from splits before saving
expenseSchema.pre('save', function(next) {
    if (this.splitType === 'equal') {
        // Amount is already set correctly
    } else {
        // For custom splits, ensure total matches
        const totalFromSplits = this.splits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalFromSplits - this.amount) > 0.01) {
            next(new Error('Split amounts must equal total amount'));
        }
    }
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;