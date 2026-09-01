import React, { useState } from 'react';
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
  const [isCustomDepth, setIsCustomDepth] = useState(false);

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

  const handleSelectDepthChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomDepth(true);
    } else {
      setIsCustomDepth(false);
      setScanDepth(Number(val));
    }
  };

  const handleCustomDepthInputChange = (e) => {
    const num = Math.max(1, Math.min(20, Number(e.target.value) || 1));
    setScanDepth(num);
  };

  // Parse progress info safely
  const currentPathText = scanProgress && typeof scanProgress === 'object' && scanProgress.currentPath
    ? scanProgress.currentPath
    : (typeof scanProgress === 'string' ? scanProgress : 'Analyzing folder hierarchy...');

  const foldersCount = scanProgress && typeof scanProgress === 'object' ? (scanProgress.foldersScanned ?? null) : null;
  const filesCount = scanProgress && typeof scanProgress === 'object' ? (scanProgress.filesFound ?? null) : null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border-0">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-black text-gray-900">
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
          className="text-xs text-google-blue hover:text-google-hover underline font-bold self-start md:self-auto disabled:opacity-50 border-0"
        >
          Paste sample folder link
        </button>
      </div>

      <form onSubmit={handleScanClick} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          
          {/* URL Input field */}
          <div className="relative flex-1">
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => {
                setDriveUrl(e.target.value);
                setErrorMsg('');
              }}
              placeholder="e.g. https://drive.google.com/drive/u/1/folders/1QRHck2OWHZmDuqqZlBJQNHL..."
              disabled={isScanning}
              className={`w-full px-4 py-2.5 bg-gray-100 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-google-blue transition-colors border-0 ${
                errorMsg ? 'bg-red-50 text-red-900 focus:ring-red-400' : ''
              }`}
            />
          </div>

          {/* Depth Selector & Custom Depth Input */}
          <div className="flex items-center space-x-1.5 bg-gray-100 rounded-xl px-3 py-1 border-0">
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Depth:</span>
            
            {isCustomDepth ? (
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={scanDepth}
                  onChange={handleCustomDepthInputChange}
                  disabled={isScanning}
                  className="w-14 px-1.5 py-0.5 bg-white rounded text-xs font-bold text-gray-900 text-center focus:ring-1 focus:ring-google-blue border-0"
                  title="Enter custom depth level (1 to 20)"
                />
                <span className="text-xs text-gray-500 font-medium">Levels</span>
                <button
                  type="button"
                  onClick={() => setIsCustomDepth(false)}
                  className="text-[10px] text-google-blue hover:underline font-bold ml-1 border-0"
                  title="Switch back to presets"
                >
                  Presets
                </button>
              </div>
            ) : (
              <select
                value={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(scanDepth) ? scanDepth : 'custom'}
                onChange={handleSelectDepthChange}
                disabled={isScanning}
                className="bg-transparent text-xs font-bold text-gray-900 border-none focus:ring-0 cursor-pointer pr-1 py-1"
              >
                <option value={1}>1 Level</option>
                <option value={2}>2 Levels</option>
                <option value={3}>3 Levels</option>
                <option value={4}>4 Levels (Default)</option>
                <option value={5}>5 Levels</option>
                <option value={6}>6 Levels</option>
                <option value={7}>7 Levels</option>
                <option value={8}>8 Levels</option>
                <option value={9}>9 Levels</option>
                <option value={10}>10 Levels</option>
                <option value="custom">+ Custom Level...</option>
              </select>
            )}
          </div>

          {/* Scan Action Button or Cancel Button */}
          {isScanning ? (
            <button
              type="button"
              onClick={onCancelScan}
              className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-[#f56565] hover:bg-[#e53e3e] flex items-center justify-center space-x-2 shadow-xs transition-all whitespace-nowrap border-0"
              title="Cancel the active folder scan"
            >
              <span>Cancel Scan</span>
            </button>
          ) : (
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-google-blue hover:bg-google-hover flex items-center justify-center space-x-2 shadow-xs transition-all whitespace-nowrap border-0"
            >
              <span>Inspect Submissions</span>
            </button>
          )}

        </div>

        {/* Live login required notification */}
        {!accessToken && (
          <div className="flex items-center justify-between text-xs text-blue-950 bg-blue-100 rounded-xl p-3 border-0">
            <span>Sign in with Google to allow reading folder structure via Drive API v3.</span>
            <button
              type="button"
              onClick={onLogin}
              className="text-xs font-black text-google-blue hover:underline whitespace-nowrap border-0"
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="text-xs font-bold text-red-900 bg-red-100 rounded-xl p-3 border-0">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Scanning Progress Bar Card */}
        {isScanning && (
          <div className="bg-blue-50 rounded-2xl p-4 space-y-3 border-0">
            
            {/* Header with progress status & Cancel action */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="font-black text-google-blue">
                Auditing Google Drive Folder Structure (Depth: {scanDepth} Levels)...
              </div>

              {/* Counters */}
              <div className="flex items-center space-x-2 text-[11px] font-bold text-gray-700">
                {foldersCount !== null && (
                  <span className="bg-white px-2.5 py-1 rounded-lg shadow-2xs font-bold">
                    {foldersCount} Folders
                  </span>
                )}
                {filesCount !== null && (
                  <span className="bg-white px-2.5 py-1 rounded-lg shadow-2xs font-bold">
                    {filesCount} Files
                  </span>
                )}
                <button
                  type="button"
                  onClick={onCancelScan}
                  className="text-rose-600 hover:text-rose-800 hover:underline font-black text-[11px] ml-1 border-0"
                >
                  Stop
                </button>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div className="bg-google-blue h-full rounded-full animate-pulse w-full" />
            </div>

            {/* Current path breadcrumbs */}
            <div className="text-[11px] text-gray-700 font-mono truncate bg-white px-3 py-1.5 rounded-xl">
              <span className="text-gray-400 mr-1">Scanning:</span>
              <span className="text-gray-900 font-bold">{currentPathText}</span>
            </div>

          </div>
        )}
      </form>

    </div>
  );
}
