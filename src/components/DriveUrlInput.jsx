import React, { useState } from 'react';
import { Search, Link2, Play, Layers, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { extractDriveFolderId } from '../utils/driveUrlParser';

export default function DriveUrlInput({
  driveUrl,
  setDriveUrl,
  scanDepth,
  setScanDepth,
  onStartScan,
  isScanning,
  scanProgress,
  isDemoMode,
  accessToken,
  onLogin
}) {
  const [errorMsg, setErrorMsg] = useState('');

  const handleScanClick = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isDemoMode) {
      onStartScan();
      return;
    }

    if (!accessToken) {
      setErrorMsg('Please sign in with your Google Account first to scan live Drive folders.');
      return;
    }

    const folderId = extractDriveFolderId(driveUrl);
    if (!folderId) {
      setErrorMsg('Invalid Google Drive folder link or ID. Please check the URL format.');
      return;
    }

    onStartScan(folderId);
  };

  const handlePasteExample = () => {
    setDriveUrl('https://drive.google.com/drive/u/1/folders/1QRHck2OWHZmDuqqZlBJQNHLdc12ts2gu');
    setErrorMsg('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-google-blue" />
            Paste Google Drive Folder Link
          </h2>
          <p className="text-xs text-gray-500">
            Paste the link of the parent folder containing your student or project subfolders.
          </p>
        </div>

        {/* Quick paste sample link */}
        <button
          type="button"
          onClick={handlePasteExample}
          className="text-xs text-google-blue hover:text-google-hover underline font-medium self-start md:self-auto"
        >
          Paste sample folder link
        </button>
      </div>

      <form onSubmit={handleScanClick} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          
          {/* URL Input field */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => {
                setDriveUrl(e.target.value);
                setErrorMsg('');
              }}
              placeholder="e.g. https://drive.google.com/drive/u/1/folders/1QRHck2OWHZmDuqqZlBJQNHL..."
              disabled={isScanning || isDemoMode}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors ${
                errorMsg ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
              } ${isDemoMode ? 'opacity-75 bg-amber-50/50' : ''}`}
            />
          </div>

          {/* Depth Selector */}
          <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-300 rounded-xl px-3 py-1">
            <Layers className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Depth:</span>
            <select
              value={scanDepth}
              onChange={(e) => setScanDepth(Number(e.target.value))}
              disabled={isScanning}
              className="bg-transparent text-xs font-semibold text-gray-900 border-none focus:ring-0 cursor-pointer pr-1 py-1"
            >
              <option value={2}>2 Levels</option>
              <option value={3}>3 Levels</option>
              <option value={4}>4 Levels (Default)</option>
              <option value={5}>5 Levels</option>
            </select>
          </div>

          {/* Scan Action Button */}
          <button
            type="submit"
            disabled={isScanning}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center space-x-2 shadow-sm transition-all whitespace-nowrap ${
              isScanning
                ? 'bg-google-blue/70 cursor-wait'
                : isDemoMode
                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                : 'bg-google-blue hover:bg-google-hover focus:ring-google-blue'
            }`}
          >
            {isScanning ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Scanning Drive...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{isDemoMode ? 'Analyze Demo Data' : 'Inspect Submissions'}</span>
              </>
            )}
          </button>

        </div>

        {/* Demo Mode notification */}
        {isDemoMode && (
          <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Demo Mode active:</strong> Analyzing mock data modeled on your Google Drive screenshots (*June 2026 Semester &gt; Major Project 2*).
            </span>
          </div>
        )}

        {/* Live login required notification */}
        {!isDemoMode && !accessToken && (
          <div className="flex items-center justify-between text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-google-blue flex-shrink-0" />
              <span>Sign in with Google to allow reading folder structure via Drive API v3.</span>
            </div>
            <button
              type="button"
              onClick={onLogin}
              className="text-xs font-semibold text-google-blue hover:underline whitespace-nowrap"
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live scanning progress update */}
        {isScanning && scanProgress && (
          <div className="flex items-center space-x-2 text-xs text-google-blue bg-blue-50/70 border border-blue-200 rounded-lg p-2">
            <div className="w-2 h-2 rounded-full bg-google-blue animate-ping" />
            <span className="truncate">{scanProgress}</span>
          </div>
        )}
      </form>

    </div>
  );
}
