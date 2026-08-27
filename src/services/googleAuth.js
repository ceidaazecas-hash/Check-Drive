/**
 * Google OAuth 2.0 Identity Services wrapper
 */

let tokenClient = null;
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
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    console.warn('Google Identity Services script not loaded yet.');
    return null;
  }

  if (!clientId) {
    return null;
  }

  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (response) => {
        if (response.error) {
          console.error('Google OAuth Error:', response);
          if (onError) onError(response.error);
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

        if (onTokenReceived) onTokenReceived(token, currentUser);
      },
    });

    return tokenClient;
  } catch (e) {
    console.error('Failed to initialize Google OAuth:', e);
    return null;
  }
}

export function requestGoogleLogin() {
  if (!tokenClient) {
    throw new Error('Google OAuth Client ID is not configured. Please set your Client ID in settings.');
  }
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

export function logoutGoogle() {
  setAccessToken(null);
  currentUser = null;
  localStorage.removeItem('google_drive_user');
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}
