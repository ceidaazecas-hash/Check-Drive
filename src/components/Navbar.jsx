import React from 'react';
import { HardDrive, Settings, LogIn, LogOut, Sparkles, ShieldAlert, RotateCw } from 'lucide-react';

export default function Navbar({
  user,
  isDemoMode,
  setIsDemoMode,
  clientId,
  onOpenSettings,
  onLogin,
  onLogout,
  onForceRefresh,
  isScanning
}) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center justify-center text-google-blue">
              <HardDrive className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Drive Submission Inspector</h1>
                {isDemoMode && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <Sparkles className="w-3 h-3 mr-1" /> Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">Track who submitted what, when & where in Google Drive</p>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Force Refresh Button */}
            <button
              onClick={onForceRefresh}
              disabled={isScanning}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                isScanning
                  ? 'bg-blue-50 text-google-blue border-blue-200 cursor-wait'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-google-blue hover:border-blue-300'
              }`}
              title="Force refresh Google Drive folder scan to pull latest changes"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isScanning ? 'animate-spin text-google-blue' : 'text-gray-500 group-hover:text-google-blue'}`} />
              <span className="hidden sm:inline">{isScanning ? 'Refreshing...' : 'Force Refresh'}</span>
              <span className="sm:hidden">{isScanning ? '...' : 'Refresh'}</span>
            </button>

            {/* Demo Mode Toggle */}
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isDemoMode
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
              title="Toggle Demo Mode with pre-loaded dataset from screenshots"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              <span className="hidden md:inline">{isDemoMode ? 'Demo Active' : 'Switch to Demo'}</span>
              <span className="md:hidden">{isDemoMode ? 'Demo' : 'Demo'}</span>
            </button>

            {/* Client ID Settings Button */}
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                clientId
                  ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
              title="Configure Google OAuth Client ID"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">{clientId ? 'OAuth Setup' : 'Configure Client ID'}</span>
              {!clientId && <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
            </button>

            {/* Google Login / Logout Profile */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                <img
                  src={user.picture || 'https://lh3.googleusercontent.com/a/default-user'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-gray-900 leading-none">{user.name}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">{user.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Sign out of Google Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isDemoMode}
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm ${
                  isDemoMode
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-google-blue hover:bg-google-hover focus:ring-2 focus:ring-google-blue focus:ring-offset-1'
                }`}
                title={isDemoMode ? 'Switch off Demo Mode to sign in' : 'Sign in with your Google Account'}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in with Google</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
