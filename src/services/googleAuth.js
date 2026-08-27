/**
 * Google OAuth 2.0 Identity Services wrapper with resilient script loading & on-demand initialization
 */

let tokenClient = null;
let savedClientId = null;
let savedOnTokenReceived = null;
let savedOnError = null;

let accessToken = localStorage.getItem('google_drive_access_token') || null;
let currentUser = JSON.parse(localStorage.getItem('google_drive_user') || 'null');

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem('google_drive_access_token', token);
  } else {
    localStorage.removeItem('google_drive_access_token');
  }
}

export function initGoogleAuth(clientId, onTokenReceived, onError) {
  if (clientId) savedClientId = clientId;
  if (onTokenReceived) savedOnTokenReceived = onTokenReceived;
  if (onError) savedOnError = onError;

  const targetClientId = clientId || savedClientId;

  if (!targetClientId) {
    return null;
  }

  // Check if Google GSI library is loaded
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    console.warn('Google Identity Services script loading... retrying initialization.');
    // Poll until window.google is ready
    const checkInterval = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        clearInterval(checkInterval);
        initGoogleAuth(targetClientId, savedOnTokenReceived, savedOnError);
      }
    }, 200);
    return null;
  }

  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: targetClientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (response) => {
        if (response.error) {
          console.error('Google OAuth Error:', response);
          if (savedOnError) savedOnError(response.error);
          return;
        }

        const token = response.access_token;
        setAccessToken(token);

        // Fetch User Info
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            currentUser = {
              name: userData.name,
              email: userData.email,
              picture: userData.picture
            };
            localStorage.setItem('google_drive_user', JSON.stringify(currentUser));
          }
        } catch (e) {
          console.warn('Could not fetch user profile details', e);
        }

        if (savedOnTokenReceived) savedOnTokenReceived(token, currentUser);
      },
    });

    return tokenClient;
  } catch (e) {
    console.error('Failed to initialize Google OAuth:', e);
    return null;
  }
}

export function requestGoogleLogin() {
  if (!tokenClient && savedClientId) {
    initGoogleAuth(savedClientId, savedOnTokenReceived, savedOnError);
  }

  if (!tokenClient) {
    throw new Error('Google OAuth Client ID is not initialized yet. Please check your network connection or Client ID settings.');
  }

  tokenClient.requestAccessToken({ prompt: 'select_account' });
}

export function logoutGoogle() {
  setAccessToken(null);
  currentUser = null;
  localStorage.removeItem('google_drive_user');
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}
