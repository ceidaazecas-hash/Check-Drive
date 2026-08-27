/**
 * Extract Google Drive Folder ID from a URL or raw ID string.
 * @param {string} input - Drive URL or folder ID
 * @returns {string|null} - Clean Folder ID or null if invalid
 */
export function extractDriveFolderId(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Standard folder URL pattern: /drive/folders/{folderId} or /drive/u/1/folders/{folderId}
  const folderUrlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderUrlMatch && folderUrlMatch[1]) {
    return folderUrlMatch[1];
  }

  // Open URL pattern: ?id={folderId}
  const openUrlMatch = trimmed.match(/[\?&]id=([a-zA-Z0-9_-]+)/);
  if (openUrlMatch && openUrlMatch[1]) {
    return openUrlMatch[1];
  }

  // Direct alphanumeric folder ID (typically 25-45 chars long)
  if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format ISO date string into readable date & time
 */
export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
}
