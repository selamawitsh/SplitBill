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
            setGroups(response.groups);
        } catch (error) {
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading groups...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
                    <p className="mt-2 text-gray-600">
                        Manage your expense groups and split bills with friends
                    </p>
                </div>
                <Link
                    to="/groups/create"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    + New Group
                </Link>
            </div>

            {/* Groups Grid */}
            {groups.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No groups</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new group.
                    </p>
                    <div className="mt-6">
                        <Link
                            to="/groups/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                            + New Group
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Link
                            key={group._id}
                            to={`/groups/${group._id}`}
                            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                        {group.name}
                                    </h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                                    </span>
                                </div>
                                
                                {group.description && (
                                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                        {group.description}
                                    </p>
                                )}

                                <div className="mt-4 flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                        <span className="text-gray-500">Created by</span>
                                        <span className="ml-1 font-medium text-gray-900">
                                            {group.createdBy?.FullName}
                                        </span>
                                    </div>
                                    <span className="text-gray-400">
                                        {new Date(group.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Member avatars preview */}
                                <div className="mt-4 flex -space-x-2">
                                    {group.members.slice(0, 4).map((member, idx) => (
                                        <div
                                            key={idx}
                                            className="inline-block h-8 w-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                                            title={member.user?.FullName}
                                        >
                                            <span className="text-xs font-medium text-gray-600">
                                                {member.user?.FullName?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                    ))}
                                    {group.members.length > 4 && (
                                        <div className="inline-block h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-600">
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
    );
};

export default GroupList;