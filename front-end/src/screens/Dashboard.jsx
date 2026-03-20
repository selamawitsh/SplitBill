import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userData = user?.user || user;

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
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          {/* Main Glass Panel - Enhanced */}
          <div className="relative backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>
            
            {/* Inner Glow */}
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.08)] rounded-3xl pointer-events-none"></div>
            
            {/* Top Edge Highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

            {/* Content Container */}
            <div className="p-10">
              {/* Header */}
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    {userData?.FullName || 'Welcome back!'}
                  </h1>
                  <p className="mt-2 text-white/40 text-sm">
                    Manage your shared expenses
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                >
                  Logout
                </button>
              </div>

              {/* User Info Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card">
                  <p className="label">Email</p>
                  <p className="value">{userData?.email || 'N/A'}</p>
                </div>

                <div className="glass-card">
                  <p className="label">Phone</p>
                  <p className="value">{userData?.phoneNumber || 'N/A'}</p>
                </div>

                <div className="glass-card">
                  <p className="label">Member Since</p>
                  <p className="value">{new Date().getFullYear()}</p>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <Link to="/groups" className="glass-card group hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-2">View Groups</h3>
                      <p className="text-white/40 text-sm">
                        See all your shared expenses
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link to="/groups/create" className="glass-card group hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-2">Create Group</h3>
                      <p className="text-white/40 text-sm">
                        Start splitting with friends
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Balance Card */}
              <div className="glass-card">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white text-lg font-semibold">Your Balance</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white/50">You owe</span>
                    <span className="text-red-400 font-medium flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span>120 ETB</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-white/50">You are owed</span>
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span>250 ETB</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white/60 text-sm">Net Balance</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-bold text-lg">+130 ETB</span>
                    <span className="text-xs text-white/40">All settled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .glass-card {
          position: relative;
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1rem;
          padding: 1.25rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
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
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.05) 30%,
            transparent 60%
          );
          opacity: 0.3;
          pointer-events: none;
        }

        /* Inner Glow */
        .glass-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: inset 0 0 25px rgba(255, 255, 255, 0.05);
          pointer-events: none;
        }

        .label {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .value {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          font-weight: 500;
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

export default Dashboard;