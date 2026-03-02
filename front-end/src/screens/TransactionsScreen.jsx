import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TransactionsScreen = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, [page]);

    const fetchTransactions = async () => {
        try {
            const response = await paymentService.getUserTransactions(page);
            if (page === 1) {
                setTransactions(response.transactions);
            } else {
                setTransactions(prev => [...prev, ...response.transactions]);
            }
            setHasMore(response.transactions.length === 20);
        } catch (error) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
            processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' }
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'chapa': return '💳';
            case 'telebirr': return '📱';
            default: return '💵';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                    <p className="mt-2 text-gray-600">
                        View all your payment transactions
                    </p>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading && page === 1 ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">💰</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No transactions yet
                            </h3>
                            <p className="text-gray-500">
                                Your payment history will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {transactions.map((transaction) => (
                                <Link
                                    key={transaction._id}
                                    to={`/transactions/${transaction._id}`}
                                    className="block p-6 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="text-3xl">
                                                {getPaymentIcon(transaction.paymentMethod)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {transaction.paymentMethod === 'chapa' || transaction.paymentMethod === 'telebirr'
                                                        ? `Payment to ${transaction.toUser?.FullName}`
                                                        : `Cash payment to ${transaction.toUser?.FullName}`
                                                    }
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {transaction.groupId?.name}
                                                </p>
                                                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-400">
                                                    <span>
                                                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="capitalize">
                                                        {transaction.paymentMethod}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">
                                                ETB {transaction.amount.toFixed(2)}
                                            </p>
                                            {getStatusBadge(transaction.status)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && !loading && (
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={() => setPage(prev => prev + 1)}
                                className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Load more transactions
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionsScreen;