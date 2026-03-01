import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settlementService } from '../services/settlementService';
import toast from 'react-hot-toast';

const SettleUp = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [balances, setBalances] = useState([]);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [formData, setFormData] = useState({
        toUser: '',
        amount: '',
        paymentMethod: 'cash',
        notes: ''
    });

    useEffect(() => {
        fetchBalances();
    }, [groupId]);

    const fetchBalances = async () => {
        try {
            console.log('📥 Fetching balances for group:', groupId);
            const response = await settlementService.getOutstandingBalances(groupId);
            console.log('📥 Balances response:', response);
            setBalances(response.balances || []);
        } catch (error) {
            console.error('❌ Error fetching balances:', error);
            toast.error(error.message || 'Failed to load balances');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDebt = (debt) => {
        console.log('Selected debt:', debt);
        setSelectedDebt(debt);
        setFormData({
            toUser: debt.to,
            amount: debt.amount.toFixed(2),
            paymentMethod: 'cash',
            notes: ''
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.toUser || !formData.amount) {
            toast.error('Please select a debt to settle');
            return;
        }

        setSubmitting(true);
        try {
            const settlementData = {
                groupId,
                toUser: formData.toUser,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                notes: formData.notes
            };

            console.log('📤 Creating settlement:', settlementData);
            const response = await settlementService.createSettlement(settlementData);
            console.log('📥 Settlement response:', response);
            
            toast.success('Payment settled successfully!');
            navigate(`/groups/${groupId}`);
        } catch (error) {
            console.error('❌ Settlement error:', error);
            toast.error(error.message || 'Failed to settle payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading balances...</p>
                </div>
            </div>
        );
    }

    // Separate debts you owe (from) and debts owed to you (to)
    const debtsYouOwe = balances.filter(b => b.from === user?._id);
    const debtsOwedToYou = balances.filter(b => b.to === user?._id);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to={`/groups/${groupId}`}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                        ← Back to Group
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Settle Up</h1>
                    <p className="mt-2 text-gray-600">
                        Choose a debt to settle and complete the payment
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">You Owe</p>
                                <p className="text-2xl font-semibold text-red-600">
                                    ETB {debtsYouOwe.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Owed to You</p>
                                <p className="text-2xl font-semibold text-green-600">
                                    ETB {debtsOwedToYou.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Debts You Owe */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                            <h2 className="text-lg font-medium text-red-800">
                                You Owe ({debtsYouOwe.length})
                            </h2>
                        </div>
                        
                        {debtsYouOwe.length === 0 ? (
                            <div className="p-6 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <p className="mt-2 text-gray-500">You don't owe anyone</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {debtsYouOwe.map((debt, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectDebt(debt)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                                            selectedDebt?.to === debt.to ? 'bg-red-50 border-l-4 border-red-500' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    To: {debt.toName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Amount: ETB {debt.amount.toFixed(2)}
                                                </p>
                                            </div>
                                            <button className="text-red-600 text-sm font-medium hover:text-red-700">
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Debts Owed to You */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                            <h2 className="text-lg font-medium text-green-800">
                                Owed to You ({debtsOwedToYou.length})
                            </h2>
                        </div>
                        
                        {debtsOwedToYou.length === 0 ? (
                            <div className="p-6 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <p className="mt-2 text-gray-500">No one owes you</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {debtsOwedToYou.map((debt, index) => (
                                    <div
                                        key={index}
                                        className="p-4"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    From: {debt.fromName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Amount: ETB {debt.amount.toFixed(2)}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                They will pay you
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Settlement Form - Only show when a debt you owe is selected */}
                {selectedDebt && (
                    <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">
                                Complete Payment
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Payment To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Paying To
                                </label>
                                <input
                                    type="text"
                                    value={selectedDebt.toName}
                                    disabled
                                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Amount (ETB)
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0.01"
                                    max={selectedDebt.amount}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Total debt: ETB {selectedDebt.amount.toFixed(2)}
                                </p>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Payment Method
                                </label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="telebirr">TeleBirr</option>
                                    <option value="chapa">Chapa</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Add any notes about this payment..."
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedDebt(null);
                                        setFormData({
                                            toUser: '',
                                            amount: '',
                                            paymentMethod: 'cash',
                                            notes: ''
                                        });
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettleUp;