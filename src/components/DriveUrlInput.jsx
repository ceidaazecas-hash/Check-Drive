import React, { useState } from 'react';
import { Search, Link2, Play, Layers, AlertCircle, XCircle, Folder, FileText, Loader2 } from 'lucide-react';
import { extractDriveFolderId } from '../utils/driveUrlParser';

export default function DriveUrlInput({
  driveUrl,
  setDriveUrl,
  scanDepth,
  setScanDepth,
  onStartScan,
  onCancelScan,
  isScanning,
  scanProgress,
  accessToken,
  onLogin
}) {
  const [errorMsg, setErrorMsg] = useState('');

  const handleScanClick = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!accessToken) {
      onLogin();
      return;
    }

    const folderId = extractDriveFolderId(driveUrl);
    if (!folderId) {
      setErrorMsg('Invalid Google Drive folder link or ID. Please paste a valid Drive folder URL.');
      return;
    }

    onStartScan(folderId);
  };

  const handlePasteExample = () => {
    setDriveUrl('https://drive.google.com/drive/u/1/folders/1QRHck2OWHZmDuqqZlBJQNHLdc12ts2gu');
    setErrorMsg('');
  };

  // Parse progress info (can be object, string, or null)
  const currentPathText = scanProgress && typeof scanProgress === 'object' && scanProgress.currentPath
    ? scanProgress.currentPath
    : (typeof scanProgress === 'string' ? scanProgress : 'Analyzing folder hierarchy...');

  const foldersCount = scanProgress && typeof scanProgress === 'object' ? (scanProgress.foldersScanned ?? null) : null;
  const filesCount = scanProgress && typeof scanProgress === 'object' ? (scanProgress.filesFound ?? null) : null;

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
          disabled={isScanning}
          className="text-xs text-google-blue hover:text-google-hover underline font-medium self-start md:self-auto disabled:opacity-50"
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
              disabled={isScanning}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors ${
                errorMsg ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
              }`}
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

          {/* Scan Action Button or Cancel Button */}
          {isScanning ? (
            <button
              type="button"
              onClick={onCancelScan}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-400 flex items-center justify-center space-x-2 shadow-sm transition-all whitespace-nowrap"
              title="Cancel the active folder scan"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Scan</span>
            </button>
          ) : (
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-google-blue hover:bg-google-hover focus:ring-2 focus:ring-google-blue flex items-center justify-center space-x-2 shadow-sm transition-all whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Inspect Submissions</span>
            </button>
          )}

        </div>

        {/* Live login required notification */}
        {!accessToken && (
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

        {/* Rich Live Scanning Progress Bar Card */}
        {isScanning && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
            
            {/* Header with animated progress status & Cancel action */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-google-blue">
                <Loader2 className="w-4 h-4 animate-spin text-google-blue shrink-0" />
                <span>Auditing Google Drive Folder Structure...</span>
              </div>

              {/* Counters */}
              <div className="flex items-center space-x-3 text-[11px] font-semibold text-gray-700">
                {foldersCount !== null && (
                  <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-blue-100 shadow-2xs">
                    <Folder className="w-3 h-3 text-amber-500" />
                    <span>{foldersCount} Folders</span>
                  </span>
                )}
                {filesCount !== null && (
                  <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-blue-100 shadow-2xs">
                    <FileText className="w-3 h-3 text-google-blue" />
                    <span>{filesCount} Files</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={onCancelScan}
                  className="text-rose-600 hover:text-rose-800 hover:underline font-bold text-[11px] ml-1"
                >
                  Stop
                </button>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-blue-200/70 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-google-blue via-indigo-500 to-google-blue h-full rounded-full animate-pulse w-full bg-[length:200%_100%]" />
            </div>

            {/* Current path breadcrumbs */}
            <div className="text-[11px] text-gray-600 font-mono truncate bg-white/70 px-2.5 py-1 rounded-lg border border-blue-100">
              <span className="text-gray-400 mr-1">Scanning:</span>
              <span className="text-gray-800 font-semibold">{currentPathText}</span>
            </div>

          </div>
        )}
      </form>

    </div>
  );
}
