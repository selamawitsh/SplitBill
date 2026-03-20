import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import toast from 'react-hot-toast';

const CreateGroup = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Group name is required';
        } else if (formData.name.length > 50) {
            newErrors.name = 'Group name cannot exceed 50 characters';
        }

        if (formData.description && formData.description.length > 200) {
            newErrors.description = 'Description cannot exceed 200 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await groupService.createGroup(formData);
            toast.success('Group created successfully!');
            navigate(`/groups/${response.group._id}`);
        } catch (error) {
            toast.error(error.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

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
            <div className="relative z-10 min-h-screen py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main Glass Panel */}
                    <div className="relative backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                        
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
                            
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                Create New Group
                            </h1>
                            <p className="mt-2 text-white/70">
                                Start a new group to split expenses with friends
                            </p>
                        </div>

                        {/* Form */}
                        <div className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Group Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                                        Group Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g., Friday Lunch Group"
                                        className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${
                                            errors.name ? 'border-red-500/50' : 'border-white/20'
                                        } text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all`}
                                    />
                                    {errors.name && (
                                        <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                                    )}
                                    <p className="mt-2 text-xs text-white/40">
                                        {formData.name.length}/50 characters
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows="4"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="What's this group about?"
                                        className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${
                                            errors.description ? 'border-red-500/50' : 'border-white/20'
                                        } text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all resize-none`}
                                    />
                                    {errors.description && (
                                        <p className="mt-2 text-sm text-red-400">{errors.description}</p>
                                    )}
                                    <p className="mt-2 text-xs text-white/40">
                                        {formData.description.length}/200 characters
                                    </p>
                                </div>

                                {/* Preview Card */}
                                <div className="glass-card">
                                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Preview
                                    </h3>
                                    <div className="bg-white/5 rounded-xl border border-white/15 p-4">
                                        <h4 className="text-lg font-semibold text-white">
                                            {formData.name || 'Group Name'}
                                        </h4>
                                        {formData.description && (
                                            <p className="text-sm text-white/60 mt-2">
                                                {formData.description}
                                            </p>
                                        )}
                                        <div className="flex items-center mt-3 text-xs text-white/40">
                                            <span>Created by {user?.FullName || 'You'}</span>
                                            <span className="mx-2">•</span>
                                            <span>1 member</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/groups')}
                                        className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-500/40 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Creating...</span>
                                            </div>
                                        ) : (
                                            'Create Group'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glass Styles */}
            <style jsx>{`
                .glass-card {
                    position: relative;
                    backdrop-filter: blur(20px);
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 1rem;
                    padding: 1rem;
                    transition: all 0.3s ease;
                }

                .glass-card:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .glass-card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(
                        120deg,
                        rgba(255, 255, 255, 0.2) 0%,
                        rgba(255, 255, 255, 0.05) 30%,
                        transparent 60%
                    );
                    opacity: 0.3;
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

export default CreateGroup;