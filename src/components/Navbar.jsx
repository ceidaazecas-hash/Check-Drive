import React from 'react';

export default function Navbar({
  user,
  clientId,
  onOpenSettings,
  onOpenDeadlines,
  onLogin,
  onLogout,
  onForceRefresh,
  isScanning
}) {
  return (
    <header className="bg-white border-0 sticky top-0 z-30 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">Drive Submission Inspector</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Track who submitted what, when & where in Google Drive</p>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Force Refresh Button - Solid */}
            <button
              onClick={onForceRefresh}
              disabled={isScanning}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs border-0 ${
                isScanning
                  ? 'bg-blue-100 text-google-blue cursor-wait'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              title="Force refresh Google Drive folder scan to pull latest changes"
            >
              <span className="hidden sm:inline">{isScanning ? 'Refreshing...' : 'Force Refresh'}</span>
              <span className="sm:hidden">{isScanning ? '...' : 'Refresh'}</span>
            </button>

            {/* Deadline & Schedule Setup Button - Solid Amber */}
            <button
              onClick={onOpenDeadlines}
              className="px-3 py-1.5 rounded-xl bg-[#f6ad55] hover:bg-[#ed8936] text-white text-xs font-black transition-all shadow-xs border-0"
              title="Configure Week 1-18 date ranges & late submission (L) deadlines"
            >
              <span>Deadlines & Schedule</span>
            </button>

            {/* Client ID Settings Button - Solid Gray / Amber */}
            <button
              onClick={onOpenSettings}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs border-0 ${
                clientId
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'bg-[#fb7185] text-white hover:bg-rose-500'
              }`}
              title="Configure Google OAuth Client ID"
            >
              <span>{clientId ? 'OAuth Setup' : 'Configure Client ID'}</span>
            </button>

            {/* Google Login / Logout Profile */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2">
                <img
                  src={user.picture || 'https://lh3.googleusercontent.com/a/default-user'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-gray-900 leading-none">{user.name}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">{user.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-0"
                  title="Sign out of Google Account"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-google-blue hover:bg-google-hover transition-all shadow-xs cursor-pointer border-0"
                title="Sign in with your Google Account"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
