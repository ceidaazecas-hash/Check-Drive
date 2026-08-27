import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DriveUrlInput from './components/DriveUrlInput';
import StatsCards from './components/StatsCards';
import SubmissionMatrix from './components/SubmissionMatrix';
import FileDetailsTable from './components/FileDetailsTable';
import FolderTreeView from './components/FolderTreeView';
import ClientIdModal from './components/ClientIdModal';

import { MOCK_AUDIT_RESULT } from './services/mockDriveData';
import { initGoogleAuth, requestGoogleLogin, logoutGoogle, getAccessToken, getCurrentUser } from './services/googleAuth';
import { scanDriveFolder } from './services/driveApi';
import { extractDriveFolderId } from './utils/driveUrlParser';
import { Grid, FileText, FolderTree, Sparkles } from 'lucide-react';

export default function App() {
  // App state
  const [clientId, setClientId] = useState(localStorage.getItem('google_oauth_client_id') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [accessToken, setAccessTokenState] = useState(getAccessToken());

  const [isDemoMode, setIsDemoMode] = useState(true);
  const [driveUrl, setDriveUrl] = useState('https://drive.google.com/drive/u/1/folders/1QRHck2OWHZmDuqqZlBJQNHLdc12ts2gu');
  const [scanDepth, setScanDepth] = useState(4);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scanError, setScanError] = useState('');
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix', 'table', 'tree'

  // Current active audit data (starts with demo screenshot data)
  const [auditData, setAuditData] = useState(MOCK_AUDIT_RESULT);

  // Initialize Google Auth when Client ID is available
  useEffect(() => {
    if (clientId) {
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
    }
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
  };

  // Run Drive Scan (or Demo Scan)
  const handleStartScan = async (folderIdOverride) => {
    setScanError('');
    setIsScanning(true);

    if (isDemoMode) {
      // Simulate network scanning latency for realistic demo UX
      setScanProgress('Connecting to Drive folder structure...');
      await new Promise(r => setTimeout(r, 600));
      setScanProgress('Traversing student subfolders (Chea Bunthay, Hak Venthean, Hor Kimly...)...');
      await new Promise(r => setTimeout(r, 700));
      setScanProgress('Extracting owner details, timestamps & file sizes...');
      await new Promise(r => setTimeout(r, 500));
      
      setAuditData(MOCK_AUDIT_RESULT);
      setIsScanning(false);
      setScanProgress('');
      return;
    }

    const folderId = folderIdOverride || extractDriveFolderId(driveUrl);
    if (!folderId) {
      setScanError('Please enter a valid Google Drive folder URL or Folder ID.');
      setIsScanning(false);
      return;
    }

    if (!accessToken) {
      setScanError('Google authentication token missing. Please sign in to Google.');
      setIsScanning(false);
      return;
    }

    try {
      const result = await scanDriveFolder(folderId, accessToken, scanDepth, (statusMsg) => {
        setScanProgress(statusMsg);
      });
      setAuditData(result);
    } catch (err) {
      console.error('Scan Error:', err);
      setScanError(err.message || 'An error occurred while scanning the Google Drive folder.');
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
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
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
          isDemoMode={isDemoMode}
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
