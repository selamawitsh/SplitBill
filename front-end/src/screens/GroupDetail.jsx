import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { groupService } from '../services/groupService';
import { expenseService } from '../services/expenseService';
import { balanceService } from '../services/balanceService';
import SettlementHistory from '../components/SettlementHistory';
import toast from 'react-hot-toast';

const GroupDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, joinGroup, leaveGroup, isUserOnline } = useSocket();
    
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState(null);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        fetchGroup();
        
        if (id) {
            joinGroup(id);
            console.log('📢 Joined group room:', id);
        }
        
        return () => {
            if (id) {
                leaveGroup(id);
                console.log('👋 Left group room:', id);
            }
        };
    }, [id]);

    useEffect(() => {
        if (group) {
            fetchExpenses();
        }
    }, [group]);

    useEffect(() => {
        if (!socket) return;

        socket.on('new_expense', (data) => {
            console.log('💰 New expense received:', data);
            toast.success(data.message, { icon: '💰', duration: 4000 });
            fetchExpenses();
        });

        socket.on('new_settlement', (data) => {
            console.log('🤝 New settlement received:', data);
            toast.success(data.message, { icon: '🤝', duration: 4000 });
            fetchExpenses();
        });

        socket.on('balances_updated', (data) => {
            console.log('📊 Balances updated:', data);
            toast('Balances have been updated', { icon: '📊', duration: 3000 });
            if (balances) fetchExpenses();
        });

        socket.on('member_added', (data) => {
            console.log('👥 Member added:', data);
            toast.success(data.message, { icon: '👥', duration: 4000 });
            fetchGroup();
        });

        socket.on('user_online', ({ userId }) => {
            if (group?.members?.some(m => m.user?._id === userId)) {
                setOnlineCount(prev => prev + 1);
            }
        });

        socket.on('user_offline', ({ userId }) => {
            if (group?.members?.some(m => m.user?._id === userId)) {
                setOnlineCount(prev => Math.max(0, prev - 1));
            }
        });

        return () => {
            socket.off('new_expense');
            socket.off('new_settlement');
            socket.off('balances_updated');
            socket.off('member_added');
            socket.off('user_online');
            socket.off('user_offline');
        };
    }, [socket, group, balances]);

    useEffect(() => {
        if (group?.members) {
            const online = group.members.filter(m => 
                isUserOnline(m.user?._id)
            ).length;
            setOnlineCount(online);
        }
    }, [group, isUserOnline]);

    const fetchGroup = async () => {
        try {
            const response = await groupService.getGroupById(id);
            setGroup(response.group);
        } catch (error) {
            console.log(error)
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
            console.log(error)
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
            console.log(error)
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
             console.log(error)
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
            console.log(error)
            toast.error(error.message || 'Failed to leave group');
        }
    };

    const handleDeleteGroup = async () => {
        if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

        try {
            await groupService.deleteGroup(id);
            toast.success('Group deleted successfully');
            navigate('/groups');
        } catch (error) {
            console.log(error)
            toast.error(error.message || 'Failed to delete group');
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) return;

        try {
            await expenseService.deleteExpense(expenseId);
            toast.success('Expense deleted successfully');
            fetchExpenses();
        } catch (error) {
            toast.error(error.message || 'Failed to delete expense');
        }
    };

    const isAdmin = group?.members?.some(
        m => m.user?._id === user?._id && m.role === 'admin'
    );

    if (loading) {
        return (
            <div className="min-h-screen overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                    <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                </div>
                <div className="relative z-10 min-h-screen flex items-center justify-center">
                    <div className="glass-card text-center">
                        <div className="w-12 h-12 border-2 border-white/30 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-white font-medium">Loading group...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80"></div>
                <div className="relative z-10 min-h-screen flex items-center justify-center">
                    <div className="glass-card text-center">
                        <p className="text-white font-medium">Group not found</p>
                        <Link to="/groups" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300 transition font-medium">
                            Back to Groups
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-hidden relative">
            {/* Enhanced Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Floating Glass Panels - Decorative */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-20 w-64 h-40 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl rotate-6"></div>
                <div className="absolute top-40 right-32 w-72 h-44 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl -rotate-6"></div>
                <div className="absolute bottom-20 left-1/3 w-60 h-36 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl rotate-3"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen p-6">
                <div className="max-w-7xl mx-auto">

                    {/* Main Glass Panel */}
                    <div className="relative backdrop-blur-2xl bg-white/8 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                        
                        {/* Inner Glow */}
                        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.08)] rounded-3xl pointer-events-none"></div>
                        
                        {/* Top Edge Highlight */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                        {/* Header */}
                        <div className="px-8 pt-8 pb-4">
                            <Link
                                to="/groups"
                                className="text-white/70 hover:text-white text-sm flex items-center mb-4 transition group"
                            >
                                <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Groups
                            </Link>
                            
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center space-x-3 flex-wrap gap-3">
                                        <h1 className="text-4xl font-bold text-white">{group.name}</h1>
                                        <div className="flex items-center space-x-1 bg-green-500/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-green-500/40">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            <span className="text-green-300 font-medium">{onlineCount} online</span>
                                        </div>
                                    </div>
                                    {group.description && (
                                        <p className="mt-2 text-white/70">{group.description}</p>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowAddMember(!showAddMember)}
                                        className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:text-white hover:bg-white/20 transition backdrop-blur-sm font-medium"
                                    >
                                        + Add Member
                                    </button>

                                    {user?._id !== group.createdBy?._id && (
                                        <button
                                            onClick={handleLeaveGroup}
                                            className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 transition font-medium"
                                        >
                                            Leave Group
                                        </button>
                                    )}
                                    
                                    {user?._id === group.createdBy?._id && (
                                        <button
                                            onClick={handleDeleteGroup}
                                            className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition font-medium"
                                        >
                                            Delete Group
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Container */}
                        <div className="px-8 pb-8">
                            {/* Add Member Form */}
                            {showAddMember && (
                                <div className="glass-card mb-6">
                                    <h3 className="text-white font-semibold mb-4">Add New Member</h3>
                                    <form onSubmit={handleAddMember} className="flex flex-wrap gap-4">
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter phone number (e.g., 0912345678)"
                                            className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                                            pattern="[0-9]{10}"
                                            title="Please enter a 10-digit phone number"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={addingMember}
                                            className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-500/40 transition disabled:opacity-50 font-medium"
                                        >
                                            {addingMember ? 'Adding...' : 'Add Member'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddMember(false)}
                                            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition"
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Online Members Section */}
                            <div className="glass-card mb-6">
                                <h3 className="text-white font-semibold mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07" />
                                    </svg>
                                    <span>Online Members</span>
                                    <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/80">
                                        {onlineCount}/{group.members.length}
                                    </span>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {group.members.map((member) => {
                                        const isOnline = isUserOnline(member.user?._id);
                                        return (
                                            <div
                                                key={member.user?._id}
                                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm backdrop-blur-sm font-medium ${
                                                    isOnline 
                                                        ? 'bg-green-500/30 border border-green-500/40 text-green-300' 
                                                        : 'bg-white/10 border border-white/20 text-white/70'
                                                }`}
                                                title={member.user?.FullName}
                                            >
                                                <span className={`w-2 h-2 rounded-full mr-2 ${
                                                    isOnline ? 'bg-green-500 animate-pulse' : 'bg-white/40'
                                                }`}></span>
                                                {member.user?.FullName}
                                                {member.role === 'admin' && (
                                                    <span className="ml-1 text-xs text-white/60">(Admin)</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Members Section */}
                            <div className="glass-card mb-6">
                                <h2 className="text-white font-semibold text-lg mb-4 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    All Members ({group.members.length})
                                </h2>
                                <div className="divide-y divide-white/10">
                                    {group.members.map((member) => {
                                        const isOnline = isUserOnline(member.user?._id);
                                        return (
                                            <div key={member.user?._id} className="py-4 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-blue-500/30 border border-white/30 flex items-center justify-center">
                                                            <span className="text-white font-bold">
                                                                {member.user?.FullName?.charAt(0) || '?'}
                                                            </span>
                                                        </div>
                                                        {isOnline && (
                                                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white/30"></span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">
                                                            {member.user?.FullName}
                                                            {member.role === 'admin' && (
                                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white/80">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-white/60">{member.user?.phoneNumber}</p>
                                                    </div>
                                                </div>
                                                
                                                {isAdmin && member.user?._id !== user?._id && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user?._id)}
                                                        className="text-sm text-red-400 hover:text-red-300 transition font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Balances Section */}
                            {balances && (
                                <div className="glass-card mb-6">
                                    <h2 className="text-white font-semibold text-lg mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Who Owes Whom
                                    </h2>
                                    {balances.simplifiedDebts && balances.simplifiedDebts.length > 0 ? (
                                        <div className="space-y-3">
                                            {balances.simplifiedDebts.map((debt, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-white">{debt.fromName}</span>
                                                        <span className="text-white/50">→</span>
                                                        <span className="font-semibold text-white">{debt.toName}</span>
                                                    </div>
                                                    <span className="text-red-400 font-bold">
                                                        ETB {debt.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-white/70 py-4 font-medium">
                                            ✨ All settled up! No outstanding balances.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Expenses Section */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-white font-semibold text-lg flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Expenses
                                    </h2>
                                    <Link
                                        to={`/groups/${id}/add-expense`}
                                        className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-500/40 transition text-sm font-medium"
                                    >
                                        + Add Expense
                                    </Link>
                                </div>

                                <div className="glass-card">
                                    {loadingExpenses ? (
                                        <div className="text-center py-8">
                                            <div className="w-8 h-8 border-2 border-white/30 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                                        </div>
                                    ) : expenses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4 opacity-60">💰</div>
                                            <h3 className="mt-2 text-lg font-semibold text-white">No expenses</h3>
                                            <p className="mt-1 text-white/60">
                                                Get started by adding your first expense.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/10">
                                            {expenses.map((expense) => (
                                                <div key={expense._id} className="p-5 hover:bg-white/5 transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-white">
                                                                {expense.description}
                                                            </h3>
                                                            <p className="text-sm text-white/60 mt-1">
                                                                Paid by <span className="text-white font-medium">{expense.paidBy.FullName}</span> • {new Date(expense.date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-bold text-white">
                                                                ETB {expense.amount.toFixed(2)}
                                                            </p>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white/80">
                                                                {expense.category}
                                                            </span>
                                                        </div>
                                                        {expense.paidBy._id === user?._id && (
                                                            <button
                                                                onClick={() => handleDeleteExpense(expense._id)}
                                                                className="ml-3 text-red-400 hover:text-red-300 p-1 transition"
                                                                title="Delete expense"
                                                            >
                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="mt-4">
                                                        <p className="text-sm font-medium text-white/70 mb-2">Split details:</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {expense.splits.map((split, idx) => {
                                                                const isPayer = split.user._id === expense.paidBy._id;
                                                                return (
                                                                    <div key={idx} className="flex items-center text-sm">
                                                                        <span className="text-white/60">{split.user.FullName}:</span>
                                                                        <span className={`ml-2 font-semibold ${
                                                                            split.isSettled 
                                                                                ? 'text-green-400' 
                                                                                : isPayer 
                                                                                    ? 'text-blue-400' 
                                                                                    : 'text-red-400'
                                                                        }`}>
                                                                            ETB {split.amount.toFixed(2)}
                                                                            {split.isSettled && ' ✓'}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {expense.notes && (
                                                        <p className="mt-2 text-sm text-white/60">
                                                            <span className="font-medium">Note:</span> {expense.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Settlements Section */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-white font-semibold text-lg flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Settlement History
                                    </h2>
                                    <Link
                                        to={`/groups/${id}/settle-up`}
                                        className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 transition text-sm font-medium"
                                    >
                                        Settle Up
                                    </Link>
                                </div>
                                
                                <div className="glass-card">
                                    <SettlementHistory groupId={id} />
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div className="glass-card">
                                    <p className="text-sm font-medium text-white/70 uppercase tracking-wide">
                                        Total Expenses
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-white">
                                        ETB {group.totalExpenses || 0}
                                    </p>
                                </div>
                                <div className="glass-card">
                                    <p className="text-sm font-medium text-white/70 uppercase tracking-wide">
                                        Created
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-white">
                                        {new Date(group.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glass Styles */}
            <style jsx>{`
                .glass-card {
                    position: relative;
                    backdrop-filter: blur(20px);
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 1rem;
                    padding: 1.25rem;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .glass-card:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.25);
                }

                .glass-card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(
                        120deg,
                        rgba(255, 255, 255, 0.25) 0%,
                        rgba(255, 255, 255, 0.08) 30%,
                        transparent 60%
                    );
                    opacity: 0.4;
                    pointer-events: none;
                }

                .glass-card::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    box-shadow: inset 0 0 25px rgba(255, 255, 255, 0.08);
                    pointer-events: none;
                }

                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.1);
                    }
                }

                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }

                .delay-1000 {
                    animation-delay: 1s;
                }

                .bg-white\/8 {
                    background: rgba(255, 255, 255, 0.08);
                }
            `}</style>
        </div>
    );
};

export default GroupDetail;