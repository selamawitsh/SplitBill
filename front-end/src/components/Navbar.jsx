import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [closeTimeout, setCloseTimeout] = useState(null);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const handleMouseEnter = () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            setCloseTimeout(null);
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setIsOpen(false);
        }, 200); // 200ms delay gives user time to move to dropdown
        setCloseTimeout(timeout);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeout) {
                clearTimeout(closeTimeout);
            }
        };
    }, [closeTimeout]);

    return (
        <nav className="sticky relative top-0 z-50 backdrop-blur-2xl bg-white/5 border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link 
                            to="/dashboard" 
                            className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent hover:from-white hover:to-white transition-all"
                        >
                            SplitBill
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <NotificationBell />
                        
                        {/* User Dropdown */}
                        <div 
                            className="relative"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button 
                                ref={buttonRef}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <span className="font-medium">{user?.FullName || user?.name || 'User'}</span>
                                <svg 
                                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {/* Dropdown menu */}
                            {isOpen && (
                                <div 
                                    ref={dropdownRef}
                                    className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-xl py-1"
                                >
                                    <Link
                                        to="/profile"
                                        className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/notifications"
                                        className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Notifications
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsOpen(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/10 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;