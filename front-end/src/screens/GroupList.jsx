import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupService } from '../services/groupService';
import toast from 'react-hot-toast';

const GroupList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await groupService.getUserGroups();
            setGroups(response?.groups || []);
        } catch (error) {
            toast.error('Failed to load groups');
            console.log(error)
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen overflow-hidden relative">
                {/* Enhanced Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                    <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center">
                    <div className="glass-card text-center">
                        <div className="w-12 h-12 border-2 border-white/30 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-white font-medium">Loading groups...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-hidden relative">
            {/* Enhanced Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80">
                {/* Animated gradient orbs */}
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

                    {/* Main Glass Panel - Enhanced */}
                    <div className="relative backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                        
                        {/* Inner Glow */}
                        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.08)] rounded-3xl pointer-events-none"></div>
                        
                        {/* Top Edge Highlight */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                        {/* Header */}
                        <div className="px-8 pt-8 pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-4xl font-bold text-white">
                                        Your Groups
                                    </h1>
                                    <p className="mt-2 text-white/70 text-sm">
                                        Manage your expenses and split bills
                                    </p>
                                </div>

                                <Link
                                    to="/groups/create"
                                    className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-500/40 transition-all duration-300 backdrop-blur-sm hover:scale-105 font-medium"
                                >
                                    + New Group
                                </Link>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-8">
                            {/* Empty State */}
                            {groups.length === 0 ? (
                                <div className="glass-card text-center py-12">
                                    <div className="text-6xl mb-4 opacity-80">👥</div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        No groups yet
                                    </h3>
                                    <p className="text-white/60">
                                        Create a group to start splitting expenses
                                    </p>

                                    <Link
                                        to="/groups/create"
                                        className="inline-block mt-6 px-6 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-500/40 transition-all duration-300 font-medium"
                                    >
                                        + Create Group
                                    </Link>
                                </div>
                            ) : (
                                /* Groups Grid */
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {groups.map((group) => (
                                        <Link
                                            key={group._id}
                                            to={`/groups/${group._id}`}
                                            className="glass-card group hover:scale-[1.02] transition-all duration-300"
                                        >
                                            {/* Card Content */}
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-white truncate flex-1">
                                                        {group.name}
                                                    </h3>

                                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80 font-medium">
                                                        {group.members?.length || 0} members
                                                    </span>
                                                </div>

                                                {group.description && (
                                                    <p className="mt-2 text-white/70 text-sm line-clamp-2">
                                                        {group.description}
                                                    </p>
                                                )}

                                                <div className="mt-4 flex justify-between text-sm">
                                                    <span className="flex items-center space-x-1 text-white/60">
                                                        <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span>{group.createdBy?.FullName || 'Unknown'}</span>
                                                    </span>
                                                    <span className="flex items-center space-x-1 text-white/60">
                                                        <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                                                    </span>
                                                </div>

                                                {/* Avatars */}
                                                <div className="mt-4 flex -space-x-2">
                                                    {group.members?.slice(0, 4).map((member, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-all duration-300"
                                                            title={member.user?.FullName}
                                                        >
                                                            <span className="text-xs text-white font-bold">
                                                                {member.user?.FullName?.charAt(0) || '?'}
                                                            </span>
                                                        </div>
                                                    ))}

                                                    {group.members?.length > 4 && (
                                                        <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                                                            <span className="text-xs text-white font-medium">
                                                                +{group.members.length - 4}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
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
                    padding: 1.5rem;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .glass-card:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.25);
                    transform: translateY(-2px);
                }

                /* Shine Effect */
                .glass-card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(
                        120deg,
                        rgba(255, 255, 255, 0.35) 0%,
                        rgba(255, 255, 255, 0.1) 30%,
                        transparent 60%
                    );
                    opacity: 0.4;
                    pointer-events: none;
                }

                /* Inner Glow */
                .glass-card::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    box-shadow: inset 0 0 25px rgba(255, 255, 255, 0.1);
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
            `}</style>
        </div>
    );
};

export default GroupList;