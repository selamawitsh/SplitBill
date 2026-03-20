import React, { useState, useEffect } from 'react';
import { settlementService } from '../services/settlementService';
import toast from 'react-hot-toast';

const SettlementHistory = ({ groupId }) => {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettlements();
    }, [groupId]);

    const fetchSettlements = async () => {
        try {
            const response = await settlementService.getGroupSettlements(groupId);
            setSettlements(response.settlements);
        } catch (error) {
            console.log(error)
            toast.error('Failed to load settlement history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (settlements.length === 0) {
        return (
            <div className="text-center py-8 text-white/70">
                No settlement history yet
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {settlements.map((settlement, index) => (
                    <li key={settlement._id}>
                        <div className="relative pb-8">
                            {index !== settlements.length - 1 && (
                                <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-white/30"
                                    aria-hidden="true"
                                />
                            )}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white/30 ${
                                        settlement.status === 'completed' 
                                            ? 'bg-green-500' 
                                            : settlement.status === 'pending'
                                            ? 'bg-yellow-500'
                                            : 'bg-white/40'
                                    }`}>
                                        {settlement.status === 'completed' ? (
                                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-base font-semibold text-white">
                                        <span className="font-bold text-white">
                                            {settlement.fromUser.FullName}
                                        </span>{' '}
                                        <span className="text-white/80 font-normal">paid</span>{' '}
                                        <span className="font-bold text-white">
                                            {settlement.toUser.FullName}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-white/80">
                                        ETB {settlement.amount.toFixed(2)} • {settlement.paymentMethod}
                                    </p>
                                    {settlement.notes && (
                                        <p className="mt-1 text-sm text-white/70">
                                            <span className="font-medium">Note:</span> {settlement.notes}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-white/60">
                                        {new Date(settlement.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 self-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        settlement.status === 'completed'
                                            ? 'bg-green-500/30 text-green-200 border border-green-400/50'
                                            : settlement.status === 'pending'
                                            ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50'
                                            : 'bg-white/30 text-white/80 border border-white/30'
                                    }`}>
                                        {settlement.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SettlementHistory;