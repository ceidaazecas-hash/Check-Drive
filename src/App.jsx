import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DriveUrlInput from './components/DriveUrlInput';
import StatsCards from './components/StatsCards';
import SubmissionMatrix from './components/SubmissionMatrix';
import FileDetailsTable from './components/FileDetailsTable';
import FolderTreeView from './components/FolderTreeView';
import ClientIdModal from './components/ClientIdModal';

import { initGoogleAuth, requestGoogleLogin, logoutGoogle, getAccessToken, getCurrentUser } from './services/googleAuth';
import { scanDriveFolder } from './services/driveApi';
import { extractDriveFolderId } from './utils/driveUrlParser';
import { Grid, FileText, FolderTree, HardDrive, LogIn, Search, CheckCircle2 } from 'lucide-react';

const DEFAULT_CLIENT_ID = '973292062953-al1790ftopifkv22e04srjunqt0diiks.apps.googleusercontent.com';

export default function App() {
  // App state
  const [clientId, setClientId] = useState(
    localStorage.getItem('google_oauth_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [accessToken, setAccessTokenState] = useState(getAccessToken());

  const [driveUrl, setDriveUrl] = useState('');
  const [scanDepth, setScanDepth] = useState(4);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scanError, setScanError] = useState('');
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix', 'table', 'tree'

  // Current active audit data (starts null until user scans)
  const [auditData, setAuditData] = useState(null);

  // Initialize Google Auth on mount
  useEffect(() => {
    initGoogleAuth(
      clientId,
      (token, userData) => {
        setAccessTokenState(token);
        setUser(userData);
        setScanError('');
      },
      (err) => {
        setScanError(`Google Auth Error: ${err}`);
      }
    );
  }, [clientId]);

  // Handle saving new Client ID
  const handleSaveClientId = (newId) => {
    setClientId(newId);
    if (newId) {
      localStorage.setItem('google_oauth_client_id', newId);
    } else {
      localStorage.removeItem('google_oauth_client_id');
    }
  };

  // Google Sign In & Sign Out
  const handleGoogleLogin = () => {
    if (!clientId) {
      setIsSettingsOpen(true);
      return;
    }
    try {
      requestGoogleLogin();
    } catch (err) {
      setScanError(err.message);
    }
  };

  const handleGoogleLogout = () => {
    logoutGoogle();
    setUser(null);
    setAccessTokenState(null);
    setAuditData(null);
  };

  // Run Drive Scan
  const handleStartScan = async (folderIdOverride) => {
    setScanError('');
    setIsScanning(true);

    const folderId = folderIdOverride || extractDriveFolderId(driveUrl);
    if (!folderId) {
      setScanError('Please enter a valid Google Drive folder URL or Folder ID.');
      setIsScanning(false);
      return;
    }

    if (!accessToken) {
      setScanError('Google authentication required. Click "Sign in with Google" to authorize access.');
      setIsScanning(false);
      handleGoogleLogin();
      return;
    }

    try {
      const result = await scanDriveFolder(folderId, accessToken, scanDepth, (statusMsg) => {
        setScanProgress(statusMsg);
      });
      setAuditData(result);
    } catch (err) {
      console.error('Scan Error:', err);
      setScanError(err.message || 'An error occurred while scanning the Google Drive folder. Please check your folder link and permissions.');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header Navbar */}
      <Navbar
        user={user}
        clientId={clientId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onForceRefresh={() => handleStartScan()}
        isScanning={isScanning}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Drive URL Input */}
        <DriveUrlInput
          driveUrl={driveUrl}
          setDriveUrl={setDriveUrl}
          scanDepth={scanDepth}
          setScanDepth={setScanDepth}
          onStartScan={handleStartScan}
          isScanning={isScanning}
          scanProgress={scanProgress}
          accessToken={accessToken}
          onLogin={handleGoogleLogin}
        />

        {/* Global Error Banner */}
        {scanError && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm p-4 rounded-xl mb-6 flex items-center justify-between shadow-sm">
            <span>{scanError}</span>
            <button
              onClick={() => setScanError('')}
              className="text-red-500 hover:text-red-700 font-bold ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Welcome Empty State Hero (shown before scanning) */}
        {!auditData && !isScanning && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm my-6">
            <div className="w-16 h-16 bg-blue-50 text-google-blue rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <HardDrive className="w-8 h-8 stroke-[2]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Google Drive Submission Inspector</h2>
            <p className="text-sm text-gray-600 max-w-lg mx-auto mb-6">
              Audit student submissions in any Google Drive folder. Automatically inspects nested subfolders to track <strong>who</strong> submitted <strong>what</strong>, <strong>when</strong>, and <strong>where</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left mb-6">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-google-blue" />
                  1. Sign In
                </div>
                <div className="text-gray-500">Sign in with your Google account to grant read access.</div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-500" />
                  2. Paste Folder Link
                </div>
                <div className="text-gray-500">Paste your class or project folder link into the box above.</div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  3. Audit Submissions
                </div>
                <div className="text-gray-500">View matrix overview, missing folders & export to CSV.</div>
              </div>
            </div>

            {!accessToken && (
              <button
                onClick={handleGoogleLogin}
                className="px-6 py-3 bg-google-blue hover:bg-google-hover text-white rounded-xl text-sm font-bold shadow-md transition-all inline-flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google to Start</span>
              </button>
            )}
          </div>
        )}

        {/* Audit Results Dashboard */}
        {auditData && (
          <>
            {/* Metric Summary Cards */}
            <StatsCards
              stats={auditData.stats}
              rootFolder={auditData.rootFolder}
              scannedAt={auditData.scannedAt}
            />

            {/* View Tabs Selector */}
            <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl p-1.5 border shadow-sm">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-google-blue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Submission Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('table')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'table'
                    ? 'bg-google-blue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Detailed File List ({auditData.files?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('tree')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'tree'
                    ? 'bg-google-blue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>Drive Tree Inspector</span>
              </button>
            </div>

            {/* Tab 1: Submission Matrix */}
            {activeTab === 'matrix' && (
              <SubmissionMatrix
                matrixRows={auditData.matrixRows}
                milestones={auditData.milestones}
                rootFolderName={auditData.rootFolder?.name}
              />
            )}

            {/* Tab 2: Detailed File Table */}
            {activeTab === 'table' && (
              <FileDetailsTable
                files={auditData.files}
                rootFolderName={auditData.rootFolder?.name}
              />
            )}

            {/* Tab 3: Folder Tree */}
            {activeTab === 'tree' && (
              <FolderTreeView tree={auditData.tree} />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        Google Drive Submission Inspector &bull; Built with React & Google Drive API v3
      </footer>

      {/* OAuth Settings Modal */}
      <ClientIdModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clientId={clientId}
        onSaveClientId={handleSaveClientId}
      />

    </div>
  );
}
