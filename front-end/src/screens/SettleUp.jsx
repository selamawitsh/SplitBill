import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settlementService } from '../services/settlementService';
import { paymentService } from '../services/payment.service';
import toast from 'react-hot-toast';

const SettleUp = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState([]);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [formData, setFormData] = useState({
        toUser: '',
        amount: '',
        notes: ''
    });
    const [processingPayment, setProcessingPayment] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchBalances();
    }, [groupId]);

    const fetchBalances = async () => {
        try {
            console.log('📥 Fetching balances for group:', groupId);
            const response = await settlementService.getOutstandingBalances(groupId);
            console.log('📥 Balances response:', response);
            setBalances(response.balances || []);
            
            // Clear selected debt if it no longer exists
            if (selectedDebt) {
                const stillExists = response.balances?.some(
                    b => b.to === selectedDebt.to && b.from === user?._id
                );
                if (!stillExists) {
                    setSelectedDebt(null);
                    setFormData({
                        toUser: '',
                        amount: '',
                        notes: ''
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error fetching balances:', error);
            toast.error(error.message || 'Failed to load balances');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSelectDebt = (debt) => {
        console.log('Selected debt:', debt);
        setSelectedDebt(debt);
        setFormData({
            toUser: debt.to,
            amount: debt.amount.toFixed(2),
            notes: ''
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchBalances();
        toast.success('Balances refreshed');
    };

    const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedDebt) {
        toast.error('Please select a debt to settle');
        return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }

    if (parseFloat(formData.amount) > selectedDebt.amount) {
        toast.error(`Amount cannot exceed ETB ${selectedDebt.amount.toFixed(2)}`);
        return;
    }

    setProcessingPayment(true);
    try {
        // First create settlement
        const settlementData = {
            groupId,
            toUser: selectedDebt.to,
            amount: parseFloat(formData.amount),
            paymentMethod: selectedPaymentMethod,
            notes: formData.notes
        };

        console.log('📤 Creating settlement:', settlementData);
        const settlementResponse = await settlementService.createSettlement(settlementData);
        console.log('📥 Settlement response:', settlementResponse);
        
        // If settlement was created successfully
        if (settlementResponse.success) {
            toast.success('Settlement created successfully!');
            
            // For cash payments, just navigate back
            if (selectedPaymentMethod === 'cash') {
                toast.success('Cash payment recorded successfully!');
                navigate(`/groups/${groupId}`);
                return;
            }
            
            // For online payments, check if we need to initialize payment
            // But if the settlement is already completed, skip payment initialization
            if (settlementResponse.settlement?.status === 'completed') {
                toast.success('Payment completed successfully!');
                navigate(`/groups/${groupId}`);
                return;
            }
            
            // Only try to initialize payment if settlement is pending
            try {
                const paymentData = {
                    settlementId: settlementResponse.settlement._id,
                    paymentMethod: selectedPaymentMethod,
                    returnUrl: `${window.location.origin}/payment/complete`
                };

                console.log('📤 Initializing payment:', paymentData);
                const paymentResponse = await paymentService.initializePayment(paymentData);
                
                if (paymentResponse.requiresRedirect && paymentResponse.checkoutUrl) {
                    // Redirect to payment gateway
                    window.location.href = paymentResponse.checkoutUrl;
                } else {
                    toast.success('Payment recorded successfully!');
                    navigate(`/groups/${groupId}`);
                }
            } catch (paymentError) {
                console.error('❌ Payment initialization error:', paymentError);
                
                // Check if it's the "already completed" error
                if (paymentError.response?.data?.message?.includes('already completed')) {
                    toast.success('Payment was already completed!');
                    navigate(`/groups/${groupId}`);
                } else {
                    toast.error(paymentError.response?.data?.message || 'Payment initialization failed');
                }
            }
        } else {
            toast.error('Failed to create settlement');
        }
        
    } catch (error) {
        console.error('❌ Settlement creation error:', error);
        
        // Check if settlement was already created
        if (error.response?.data?.message?.includes('already exists') || 
            error.response?.data?.message?.includes('already completed')) {
            toast.success('This settlement was already processed!');
            // Refresh balances and redirect
            await fetchBalances();
            navigate(`/groups/${groupId}`);
        } else {
            toast.error(error.response?.data?.message || error.message || 'Payment failed');
        }
    } finally {
        setProcessingPayment(false);
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
                {/* Header with refresh button */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
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
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                        title="Refresh balances"
                    >
                        <svg className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
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

                        <div className="p-6 space-y-4">
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
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod('cash')}
                                        className={`p-3 border rounded-lg text-center transition ${
                                            selectedPaymentMethod === 'cash'
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <span className="text-2xl mb-1 block">💵</span>
                                        <span className="text-sm font-medium">Cash</span>
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod('chapa')}
                                        className={`p-3 border rounded-lg text-center transition ${
                                            selectedPaymentMethod === 'chapa'
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <span className="text-2xl mb-1 block">💳</span>
                                        <span className="text-sm font-medium">Chapa</span>
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod('telebirr')}
                                        className={`p-3 border rounded-lg text-center transition ${
                                            selectedPaymentMethod === 'telebirr'
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <span className="text-2xl mb-1 block">📱</span>
                                        <span className="text-sm font-medium">TeleBirr</span>
                                    </button>
                                </div>
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
                                            notes: ''
                                        });
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePayment}
                                    disabled={processingPayment || !selectedDebt}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingPayment ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        `Pay ETB ${formData.amount || '0.00'} via ${selectedPaymentMethod}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettleUp;