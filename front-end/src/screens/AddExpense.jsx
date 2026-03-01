import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import { expenseService } from '../services/expenseService';
import toast from 'react-hot-toast';

const AddExpense = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingGroup, setFetchingGroup] = useState(true);
    const [splitType, setSplitType] = useState('equal');
    const [customSplits, setCustomSplits] = useState([]);
    
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        paidBy: user?._id || '',
        category: 'other',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    // Fetch group details on mount
    useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

    const fetchGroupDetails = async () => {
        try {
            const response = await groupService.getGroupById(groupId);
            setGroup(response.group);
            
            // Initialize custom splits with all members
            const initialSplits = response.group.members.map(member => ({
                user: member.user._id,
                name: member.user.FullName,
                amount: 0
            }));
            setCustomSplits(initialSplits);
        } catch (error) {
            toast.error('Failed to load group details');
            navigate('/groups');
        } finally {
            setFetchingGroup(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const handleSplitChange = (userId, amount) => {
        setCustomSplits(prev =>
            prev.map(split =>
                split.user === userId ? { ...split, amount: parseFloat(amount) || 0 } : split
            )
        );
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.amount) {
            newErrors.amount = 'Amount is required';
        } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        }

        if (!formData.paidBy) {
            newErrors.paidBy = 'Please select who paid';
        }

        if (splitType === 'custom') {
            const totalFromSplits = customSplits.reduce((sum, split) => sum + split.amount, 0);
            const expenseAmount = parseFloat(formData.amount) || 0;
            
            if (Math.abs(totalFromSplits - expenseAmount) > 0.01) {
                newErrors.splits = `Split amounts must equal total amount (${expenseAmount} ETB)`;
            }

            const zeroSplits = customSplits.filter(s => s.amount <= 0);
            if (zeroSplits.length > 0) {
                newErrors.zeroSplits = 'All members must have a split amount greater than 0';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateEqualSplits = () => {
        if (!group) return [];
        const amount = parseFloat(formData.amount) || 0;
        const memberCount = group.members.length;
        const splitAmount = amount / memberCount;
        const roundedAmount = Math.floor(splitAmount * 100) / 100;
        const remainder = amount - (roundedAmount * memberCount);

        return group.members.map((member, index) => ({
            user: member.user._id,
            amount: index === 0 ? roundedAmount + remainder : roundedAmount
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const expenseData = {
                description: formData.description,
                amount: parseFloat(formData.amount),
                groupId,
                paidBy: formData.paidBy,
                splitType,
                category: formData.category,
                notes: formData.notes,
                splits: splitType === 'equal' ? calculateEqualSplits() : customSplits.map(s => ({
                    user: s.user,
                    amount: s.amount
                }))
            };

            const response = await expenseService.createExpense(expenseData);
            toast.success('Expense added successfully!');
            navigate(`/groups/${groupId}`);
        } catch (error) {
            toast.error(error.message || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingGroup) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Add Expense</h1>
                    <p className="mt-2 text-gray-600">
                        Add a new expense to {group?.name}
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="e.g., Dinner at restaurant"
                                className={`mt-1 block w-full px-3 py-2 border ${
                                    errors.description ? 'border-red-300' : 'border-gray-300'
                                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        {/* Amount and Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Amount (ETB) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0.01"
                                    className={`mt-1 block w-full px-3 py-2 border ${
                                        errors.amount ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                                />
                                {errors.amount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="food">Food</option>
                                    <option value="transport">Transport</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="bills">Bills</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Paid By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Paid By <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="paidBy"
                                value={formData.paidBy}
                                onChange={handleChange}
                                className={`mt-1 block w-full px-3 py-2 border ${
                                    errors.paidBy ? 'border-red-300' : 'border-gray-300'
                                } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                            >
                                <option value="">Select who paid</option>
                                {group?.members.map(member => (
                                    <option key={member.user._id} value={member.user._id}>
                                        {member.user.FullName} {member.user._id === user?._id ? '(You)' : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.paidBy && (
                                <p className="mt-1 text-sm text-red-600">{errors.paidBy}</p>
                            )}
                        </div>

                        {/* Split Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Split Type
                            </label>
                            <div className="mt-2 flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        value="equal"
                                        checked={splitType === 'equal'}
                                        onChange={(e) => setSplitType(e.target.value)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Split Equally</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        value="custom"
                                        checked={splitType === 'custom'}
                                        onChange={(e) => setSplitType(e.target.value)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Custom Split</span>
                                </label>
                            </div>
                        </div>

                        {/* Custom Splits */}
                        {splitType === 'custom' && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    Custom Split Amounts
                                </h3>
                                <div className="space-y-3">
                                    {customSplits.map((split) => (
                                        <div key={split.user} className="flex items-center space-x-3">
                                            <span className="w-1/3 text-sm text-gray-600">{split.name}</span>
                                            <div className="w-2/3 flex items-center">
                                                <span className="mr-2 text-gray-500">ETB</span>
                                                <input
                                                    type="number"
                                                    value={split.amount}
                                                    onChange={(e) => handleSplitChange(split.user, e.target.value)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.splits && (
                                    <p className="mt-2 text-sm text-red-600">{errors.splits}</p>
                                )}
                                {errors.zeroSplits && (
                                    <p className="mt-2 text-sm text-red-600">{errors.zeroSplits}</p>
                                )}
                                
                                {/* Total Summary */}
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">Total from splits:</span>
                                        <span className={`
                                            ${Math.abs(customSplits.reduce((sum, s) => sum + s.amount, 0) - (parseFloat(formData.amount) || 0)) < 0.01
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            } font-medium
                                        `}>
                                            ETB {customSplits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="font-medium text-gray-700">Expense amount:</span>
                                        <span className="font-medium">
                                            ETB {(parseFloat(formData.amount) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Equal Split Preview */}
                        {splitType === 'equal' && formData.amount && parseFloat(formData.amount) > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    Split Preview (Equal)
                                </h3>
                                <div className="space-y-2">
                                    {group?.members.map((member, index) => {
                                        const amount = parseFloat(formData.amount) || 0;
                                        const memberCount = group.members.length;
                                        const splitAmount = amount / memberCount;
                                        const roundedAmount = Math.floor(splitAmount * 100) / 100;
                                        const remainder = amount - (roundedAmount * memberCount);
                                        const memberAmount = index === 0 ? roundedAmount + remainder : roundedAmount;
                                        
                                        return (
                                            <div key={member.user._id} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {member.user.FullName} {member.user._id === formData.paidBy ? '(paid)' : ''}
                                                </span>
                                                <span className="font-medium">
                                                    ETB {memberAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Notes (Optional)
                            </label>
                            <textarea
                                name="notes"
                                rows="3"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Add any additional details..."
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/groups/${groupId}`)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Expense'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddExpense;