/**
 * Google OAuth 2.0 Identity Services wrapper with Persistent Background Auto-Renewal
 * Ensures the user stays permanently logged in until they explicitly click "Sign Out".
 */

let tokenClient = null;
let savedClientId = null;
let savedOnTokenReceived = null;
let savedOnError = null;

let accessToken = localStorage.getItem('google_drive_access_token') || null;
let tokenExpiresAt = Number(localStorage.getItem('google_drive_token_expires_at')) || 0;
let currentUser = JSON.parse(localStorage.getItem('google_drive_user') || 'null');

let refreshPromise = null;
let autoRefreshTimer = null;

export function isTokenExpired() {
  if (!accessToken) return true;
  if (!tokenExpiresAt) return false;
  // If less than 2 minutes left, treat as expired to renew proactively
  return Date.now() >= (tokenExpiresAt - 120000);
}

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function setAccessToken(token, expiresInSeconds = 3600) {
  accessToken = token;
  if (token) {
    tokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
    localStorage.setItem('google_drive_access_token', token);
    localStorage.setItem('google_drive_token_expires_at', tokenExpiresAt.toString());
  } else {
    tokenExpiresAt = 0;
    localStorage.removeItem('google_drive_access_token');
    localStorage.removeItem('google_drive_token_expires_at');
  }
}

/**
 * Silently renews access token in background with zero popups if user is already authenticated
 */
export async function getValidAccessToken(forceRefresh = false) {
  // If token is still fresh and not forcing refresh, return it immediately
  if (!forceRefresh && accessToken && !isTokenExpired()) {
    return accessToken;
  }

  // If user has never logged in (no saved user), return null
  const savedUser = currentUser || JSON.parse(localStorage.getItem('google_drive_user') || 'null');
  if (!savedUser && !accessToken) {
    return null;
  }

  // If a renewal is already in flight, reuse it
  if (refreshPromise) {
    return await refreshPromise;
  }

  refreshPromise = new Promise((resolve) => {
    if (!tokenClient && savedClientId) {
      initGoogleAuth(savedClientId, savedOnTokenReceived, savedOnError);
    }

    if (!tokenClient) {
      refreshPromise = null;
      resolve(accessToken);
      return;
    }

    // Safety timeout in case silent renewal is blocked
    const timer = setTimeout(() => {
      refreshPromise = null;
      resolve(accessToken);
    }, 5000);

    const tempCallback = (response) => {
      clearTimeout(timer);
      refreshPromise = null;

      if (response && response.access_token) {
        const token = response.access_token;
        const expiresIn = response.expires_in ? Number(response.expires_in) : 3600;
        setAccessToken(token, expiresIn);
        if (savedOnTokenReceived) savedOnTokenReceived(token, currentUser);
        resolve(token);
      } else {
        resolve(accessToken);
      }
    };

    try {
      const hintEmail = savedUser?.email;
      // prompt: '' enables silent renewal in the background without opening a popup
      tokenClient.callback = tempCallback;
      tokenClient.requestAccessToken({
        prompt: '',
        hint: hintEmail || undefined
      });
    } catch (e) {
      clearTimeout(timer);
      refreshPromise = null;
      resolve(accessToken);
    }
  });

  return await refreshPromise;
}

/**
 * Schedule background refresh every 45 minutes so token never expires
 */
function startProactiveAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(async () => {
    const savedUser = currentUser || JSON.parse(localStorage.getItem('google_drive_user') || 'null');
    if (savedUser) {
      console.log('[Auth] Proactively renewing Google Drive access token in background...');
      await getValidAccessToken(true);
    }
  }, 45 * 60 * 1000);
}

export function initGoogleAuth(clientId, onTokenReceived, onError) {
  if (clientId) savedClientId = clientId;
  if (onTokenReceived) savedOnTokenReceived = onTokenReceived;
  if (onError) savedOnError = onError;

  const targetClientId = clientId || savedClientId;
  if (!targetClientId) return null;

  // Check if Google GSI library is loaded
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
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
        const expiresIn = response.expires_in ? Number(response.expires_in) : 3600;
        setAccessToken(token, expiresIn);

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

    startProactiveAutoRefresh();

    // If user was previously signed in, silently ensure a fresh token is ready right now!
    const savedUser = currentUser || JSON.parse(localStorage.getItem('google_drive_user') || 'null');
    if (savedUser) {
      getValidAccessToken();
    }

    return tokenClient;
  } catch (e) {
    console.error('Failed to initialize Google OAuth:', e);
    return null;
  }
}

export function requestGoogleLogin(promptType = 'select_account') {
  if (!tokenClient && savedClientId) {
    initGoogleAuth(savedClientId, savedOnTokenReceived, savedOnError);
  }

  if (!tokenClient) {
    throw new Error('Google OAuth Client ID is not initialized yet. Please check your network connection or Client ID settings.');
  }

  const savedUser = currentUser || JSON.parse(localStorage.getItem('google_drive_user') || 'null');
  tokenClient.requestAccessToken({
    prompt: promptType,
    hint: savedUser?.email || undefined
  });
}

export function logoutGoogle() {
  setAccessToken(null);
  currentUser = null;
  localStorage.removeItem('google_drive_user');
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}
