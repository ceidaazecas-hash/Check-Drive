import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import DriveUrlInput from './components/DriveUrlInput';
import StatsCards from './components/StatsCards';
import SubmissionMatrix from './components/SubmissionMatrix';
import FileDetailsTable from './components/FileDetailsTable';
import FolderTreeView from './components/FolderTreeView';
import ClientIdModal from './components/ClientIdModal';
import DeadlineSettingsModal from './components/DeadlineSettingsModal';

import { initGoogleAuth, requestGoogleLogin, logoutGoogle, getAccessToken, getCurrentUser, isTokenExpired, setAccessToken } from './services/googleAuth';
import { scanDriveFolder } from './services/driveApi';
import { extractDriveFolderId } from './utils/driveUrlParser';
import { generateDefaultWeekRanges, DEFAULT_SEMESTER_START } from './utils/weekDeadlineManager';
// No icons imported

const DEFAULT_CLIENT_ID = '668113678070-o2ifl6k4encmi4na97r6mkgbjcrmirtm.apps.googleusercontent.com';

export default function App() {
  // App state
  const [clientId, setClientId] = useState(() => {
    const saved = localStorage.getItem('google_oauth_client_id');
    if (!saved || saved.includes('973292062953')) {
      localStorage.setItem('google_oauth_client_id', DEFAULT_CLIENT_ID);
      return DEFAULT_CLIENT_ID;
    }
    return saved;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeadlinesOpen, setIsDeadlinesOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [accessToken, setAccessTokenState] = useState(getAccessToken());

  // Deadline & Schedule state
  const [semesterStartDate, setSemesterStartDate] = useState(
    localStorage.getItem('semester_start_date') || DEFAULT_SEMESTER_START
  );
  const [customDeadlines, setCustomDeadlines] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_week_deadlines') || '{}');
    } catch {
      return {};
    }
  });

  const [driveUrl, setDriveUrl] = useState('');
  const [scanDepth, setScanDepth] = useState(4);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  const [scanError, setScanError] = useState('');
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix', 'table', 'tree'

  // Current active audit data
  const [auditData, setAuditData] = useState(null);

  // Cancellation controller ref
  const abortControllerRef = useRef(null);

  // Calculate 18 weeks of date ranges
  const weekRanges = useMemo(() => {
    return generateDefaultWeekRanges(semesterStartDate);
  }, [semesterStartDate]);

  // Combine default deadlines with custom deadline overrides
  const weekDeadlines = useMemo(() => {
    const map = {};
    weekRanges.forEach(w => {
      map[w.name] = customDeadlines[w.name] || w.deadlineIso;
    });
    return map;
  }, [weekRanges, customDeadlines]);

  // Persist deadline changes
  useEffect(() => {
    localStorage.setItem('semester_start_date', semesterStartDate);
  }, [semesterStartDate]);

  useEffect(() => {
    localStorage.setItem('custom_week_deadlines', JSON.stringify(customDeadlines));
  }, [customDeadlines]);

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

  // Cancel Scan
  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
    setScanProgress(null);
  };

  // Run Drive Scan
  const handleStartScan = async (folderIdOverride) => {
    setScanError('');

    // Determine target folder ID: passed override, parsed input driveUrl, or existing scanned root folder ID
    const folderId = (typeof folderIdOverride === 'string' && folderIdOverride)
      ? folderIdOverride
      : extractDriveFolderId(driveUrl) || auditData?.rootFolder?.id;

    if (!folderId) {
      setScanError('Please paste a Google Drive folder link in the box above to inspect.');
      return;
    }

    const currentToken = getAccessToken() || accessToken;
    if (!currentToken || isTokenExpired()) {
      setAccessToken(null);
      setAccessTokenState(null);
      setScanError('Your Google login session has expired. Click "Sign in with Google" to renew access.');
      handleGoogleLogin();
      return;
    }

    // Cancel any previous ongoing scan
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsScanning(true);
    setScanProgress('Initializing scan...');

    try {
      const result = await scanDriveFolder(
        folderId,
        currentToken,
        scanDepth,
        (progressInfo) => {
          setScanProgress(progressInfo);
        },
        controller.signal
      );
      setAuditData(result);
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        console.log('Drive scan was cancelled by user.');
        return;
      }
      console.error('Scan Error:', err);
      if (err.isAuthError || err.status === 401 || err.message?.includes('invalid authentication credentials') || err.message?.includes('Invalid Credentials') || err.message?.includes('UNAUTHENTICATED')) {
        setAccessToken(null);
        setAccessTokenState(null);
        setScanError('Your Google session has expired. Click "Sign In with Google" below to renew your access.');
        handleGoogleLogin();
        return;
      }
      setScanError(err.message || 'An error occurred while scanning the Google Drive folder. Please check your folder link and permissions.');
    } finally {
      setIsScanning(false);
      setScanProgress(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header Navbar */}
      <Navbar
        user={user}
        clientId={clientId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDeadlines={() => setIsDeadlinesOpen(true)}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onForceRefresh={() => handleStartScan()}
        isScanning={isScanning}
      />

      {/* Main Container - 100% Full Width */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6">
        
        {/* Drive URL Input & Progress Bar */}
        <DriveUrlInput
          driveUrl={driveUrl}
          setDriveUrl={setDriveUrl}
          scanDepth={scanDepth}
          setScanDepth={setScanDepth}
          onStartScan={handleStartScan}
          onCancelScan={handleCancelScan}
          isScanning={isScanning}
          scanProgress={scanProgress}
          accessToken={accessToken}
          onLogin={handleGoogleLogin}
        />

        {/* Global Error Banner */}
        {scanError && (
          <div className="bg-red-50 text-red-900 text-xs sm:text-sm p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border-0">
            <span className="font-bold">{scanError}</span>
            <div className="flex items-center space-x-2 shrink-0">
              {(!accessToken || scanError.includes('session has expired') || scanError.includes('authentication') || scanError.includes('Sign In')) && (
                <button
                  onClick={handleGoogleLogin}
                  className="px-3.5 py-1.5 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-black shadow-xs border-0"
                >
                  Sign in with Google
                </button>
              )}
              <button
                onClick={() => setScanError('')}
                className="text-red-500 hover:text-red-700 font-black px-2 py-1"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Welcome Empty State Hero (shown before scanning) */}
        {!auditData && !isScanning && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm my-6 border-0">
            <h2 className="text-xl font-black text-gray-900 mb-2">Google Drive Submission Inspector</h2>
            <p className="text-sm text-gray-600 max-w-lg mx-auto mb-6">
              Audit student submissions in any Google Drive folder. Automatically inspects nested subfolders to track <strong>who</strong> submitted <strong>what</strong>, <strong>when</strong>, and detect late submissions (<strong>L</strong>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-center mb-6">
              <div className="p-4 bg-gray-50 rounded-2xl text-xs border-0">
                <div className="font-black text-gray-900 mb-1">1. Sign In</div>
                <div className="text-gray-500">Sign in with your Google account to grant read access.</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-xs border-0">
                <div className="font-black text-gray-900 mb-1">2. Paste Folder Link</div>
                <div className="text-gray-500">Paste your class or project folder link into the box above.</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-xs border-0">
                <div className="font-black text-gray-900 mb-1">3. Audit & Track Late</div>
                <div className="text-gray-500">View matrix overview, timestamps, late badges & export to Excel.</div>
              </div>
            </div>

            {!accessToken && (
              <button
                onClick={handleGoogleLogin}
                className="px-6 py-3 bg-google-blue hover:bg-google-hover text-white rounded-xl text-sm font-black shadow-xs transition-all border-0"
              >
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

            {/* View Tabs Selector (Solid, No Outlines, No Icons) */}
            <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border-0">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all border-0 ${
                  activeTab === 'matrix'
                    ? 'bg-google-blue text-white shadow-xs'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Submission Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('table')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all border-0 ${
                  activeTab === 'table'
                    ? 'bg-google-blue text-white shadow-xs'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Detailed File List ({auditData.files?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('tree')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all border-0 ${
                  activeTab === 'tree'
                    ? 'bg-google-blue text-white shadow-xs'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Drive Tree Inspector</span>
              </button>
            </div>

            {/* Tab 1: Submission Matrix */}
            {activeTab === 'matrix' && (
              <SubmissionMatrix
                matrixRows={auditData.matrixRows}
                milestones={auditData.milestones}
                groupedMilestones={auditData.groupedMilestones}
                allFlattenedColumns={auditData.allFlattenedColumns}
                rootFolderName={auditData.rootFolder?.name}
                weekDeadlines={weekDeadlines}
                weekRanges={weekRanges}
              />
            )}

            {/* Tab 2: Detailed File Table */}
            {activeTab === 'table' && (
              <FileDetailsTable
                files={auditData.files}
                rootFolderName={auditData.rootFolder?.name}
                weekDeadlines={weekDeadlines}
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

      {/* Deadline & Schedule Settings Modal */}
      <DeadlineSettingsModal
        isOpen={isDeadlinesOpen}
        onClose={() => setIsDeadlinesOpen(false)}
        semesterStartDate={semesterStartDate}
        setSemesterStartDate={setSemesterStartDate}
        customDeadlines={customDeadlines}
        setCustomDeadlines={setCustomDeadlines}
      />

    </div>
  );
}
