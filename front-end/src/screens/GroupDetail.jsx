import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import toast from 'react-hot-toast';
import { expenseService } from '../services/expenseService';
import { balanceService } from '../services/balanceService';

const GroupDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // All useState hooks first
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState(null);
    const [loadingExpenses, setLoadingExpenses] = useState(true);

    // ALL useEffect hooks must be here, BEFORE any conditional returns
    
    
    useEffect(() => {
        fetchGroup();
    }, [id]);

    useEffect(() => {
        if (group) {
            fetchExpenses();
        }
    }, [group]);  // This is now correctly placed before returns

    // All function definitions next
    const fetchGroup = async () => {
        try {
            const response = await groupService.getGroupById(id);
            setGroup(response.group);
        } catch (error) {
            toast.error('Failed to load group');
            navigate('/groups');
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async () => {
        try {
            const [expensesRes, balancesRes] = await Promise.all([
                expenseService.getGroupExpenses(id),
                balanceService.getGroupBalances(id)
            ]);
            setExpenses(expensesRes.expenses);
            setBalances(balancesRes);
        } catch (error) {
            toast.error('Failed to load expenses');
        } finally {
            setLoadingExpenses(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!phoneNumber.trim()) return;

        setAddingMember(true);
        try {
            const response = await groupService.addMember(id, phoneNumber);
            setGroup(response.group);
            setPhoneNumber('');
            setShowAddMember(false);
            toast.success('Member added successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to add member');
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;

        try {
            const response = await groupService.removeMember(id, memberId);
            setGroup(response.group);
            toast.success('Member removed successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to remove member');
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;

        try {
            const response = await groupService.leaveGroup(id);
            toast.success(response.message || 'You left the group');
            navigate('/groups');
        } catch (error) {
            toast.error(error.message || 'Failed to leave group');
        }
    };

    // Computed values can be after functions
    const isAdmin = group?.members?.some(
        m => m.user?._id === user?._id && m.role === 'admin'
    );

    // NOW we can have conditional returns
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading group...</p>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Group not found</p>
                <Link to="/groups" className="mt-4 text-primary-600 hover:text-primary-700">
                    Back to Groups
                </Link>
            </div>
        );
    }

    // Return the JSX
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {/* ... rest of your JSX ... */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link
                                to="/groups"
                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                ← Back to Groups
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 mt-2">{group.name}</h1>
                            {group.description && (
                                <p className="mt-2 text-gray-600">{group.description}</p>
                            )}
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddMember(!showAddMember)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                            >
                                + Add Member
                            </button>
                        )}

                        {!isAdmin && user?._id !== group.createdBy?._id && (
                            <button
                                onClick={handleLeaveGroup}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                            >
                                Leave Group
                            </button>
                        )}
                    </div>
                </div>

                {/* Add Member Form */}
                {showAddMember && isAdmin && (
                    <div className="mb-8 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Member</h3>
                        <form onSubmit={handleAddMember} className="flex gap-4">
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter phone number (e.g., 0912345678)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                pattern="[0-9]{10}"
                                title="Please enter a 10-digit phone number"
                                required
                            />
                            <button
                                type="submit"
                                disabled={addingMember}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                                {addingMember ? 'Adding...' : 'Add'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddMember(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                )}

                {/* Members Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Members ({group.members.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {group.members.map((member) => (
                            <div key={member.user?._id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                        <span className="text-primary-600 font-medium">
                                            {member.user?.FullName?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {member.user?.FullName}
                                            {member.role === 'admin' && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                                    Admin
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">{member.user?.phoneNumber}</p>
                                    </div>
                                </div>
                                
                                {isAdmin && member.user?._id !== user?._id && (
                                    <button
                                        onClick={() => handleRemoveMember(member.user?._id)}
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Balances Section */}
                {balances && (
                    <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Who Owes Whom</h2>
                        </div>
                        <div className="p-6">
                            {balances.simplifiedDebts && balances.simplifiedDebts.length > 0 ? (
                                <div className="space-y-3">
                                    {balances.simplifiedDebts.map((debt, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">{debt.fromName}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-medium text-gray-900">{debt.toName}</span>
                                            </div>
                                            <span className="text-red-600 font-medium">
                                                ETB {debt.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-4">
                                    All settled up! No outstanding balances.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Expenses Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Expenses</h2>
                        <Link
                            to={`/groups/${id}/add-expense`}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                        >
                            + Add Expense
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {loadingExpenses ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-12">
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
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Get started by adding your first expense.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                    <div key={expense._id} className="p-6 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {expense.description}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Paid by {expense.paidBy.FullName} • {new Date(expense.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">
                                                    ETB {expense.amount.toFixed(2)}
                                                </p>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                                    {expense.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Split summary */}
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Split details:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {expense.splits.map((split, idx) => {
                                                    const isPayer = split.user._id === expense.paidBy._id;
                                                    return (
                                                        <div key={idx} className="flex items-center text-sm">
                                                            <span className="text-gray-600">{split.user.FullName}:</span>
                                                            <span className={`ml-2 font-medium ${
                                                                split.isSettled 
                                                                    ? 'text-green-600' 
                                                                    : isPayer 
                                                                        ? 'text-blue-600' 
                                                                        : 'text-red-600'
                                                            }`}>
                                                                ETB {split.amount.toFixed(2)}
                                                                {split.isSettled && ' ✓'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Notes if any */}
                                        {expense.notes && (
                                            <p className="mt-2 text-sm text-gray-500">
                                                Note: {expense.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                Total Expenses
                            </dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {group.totalExpenses || 0} ETB
                            </dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                Created
                            </dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {new Date(group.createdAt).toLocaleDateString()}
                            </dd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetail;