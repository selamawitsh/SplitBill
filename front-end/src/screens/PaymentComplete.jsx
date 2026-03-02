import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../services/payment.service';
import toast from 'react-hot-toast';

const PaymentComplete = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [transaction, setTransaction] = useState(null);

    useEffect(() => {
        verifyPayment();
    }, []);

    const verifyPayment = async () => {
        const txRef = searchParams.get('tx_ref');
        const transactionId = searchParams.get('transaction_id');

        if (!txRef && !transactionId) {
            setStatus('failed');
            return;
        }

        try {
            const response = await paymentService.verifyPayment({
                txRef,
                transactionId
            });

            if (response.success) {
                setStatus('success');
                setTransaction(response.transaction);
                toast.success('Payment completed successfully!');
                
                // Redirect after 3 seconds
                setTimeout(() => {
                    if (response.transaction?.groupId) {
                        navigate(`/groups/${response.transaction.groupId}`);
                    } else {
                        navigate('/dashboard');
                    }
                }, 3000);
            } else {
                setStatus('failed');
                toast.error(response.message || 'Payment verification failed');
            }
        } catch (error) {
            setStatus('failed');
            toast.error(error.message || 'Payment verification failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="mb-4">
                            <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verifying Payment
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we confirm your payment...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mb-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Payment Successful!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Your payment of ETB {transaction?.amount?.toFixed(2)} has been completed.
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting you back to the group...
                        </p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="mb-4">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Payment Failed
                        </h2>
                        <p className="text-gray-600 mb-6">
                            There was an issue processing your payment.
                        </p>
                        <div className="space-x-4">
                            <Link
                                to="/dashboard"
                                className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={() => window.history.back()}
                                className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                            >
                                Try Again
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentComplete;