import { formatBytes, formatDate } from '../utils/driveUrlParser';

/**
 * High-Speed Google Drive API v3 Batch Crawler with Multi-Parent Batching
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Fetch folder details by ID
 */
export async function getFolderMetadata(folderId, accessToken, abortSignal = null) {
  const fields = 'id,name,mimeType,owners,createdTime,modifiedTime,webViewLink';
  const res = await fetch(`${DRIVE_API_BASE}/files/${folderId}?fields=${encodeURIComponent(fields)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: abortSignal
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch folder (Status ${res.status}). Check permissions or folder ID.`);
  }

  return await res.json();
}

/**
 * List direct children of a single folder
 */
export async function listFolderChildren(folderId, accessToken, abortSignal = null) {
  const fields = 'files(id,name,mimeType,owners,lastModifyingUser,createdTime,modifiedTime,size,webViewLink,parents)';
  const q = `'${folderId}' in parents and trashed = false`;
  
  let allFiles = [];
  let pageToken = null;

  do {
    if (abortSignal?.aborted) {
      throw new DOMException('Scan cancelled by user', 'AbortError');
    }

    const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields + ',nextPageToken')}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: abortSignal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed listing files in folder ${folderId}`);
    }

    const data = await res.json();
    if (data.files) {
      allFiles = allFiles.concat(data.files);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

/**
 * Ultra-Fast: List children for multiple parent folders in single batch requests
 */
export async function listMultiFolderChildren(folderIds, accessToken, abortSignal = null) {
  if (!folderIds || folderIds.length === 0) return [];

  // Group folder IDs in chunks of 15
  const CHUNK_SIZE = 15;
  const chunks = [];
  for (let i = 0; i < folderIds.length; i += CHUNK_SIZE) {
    chunks.push(folderIds.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(chunks.map(async (chunkIds) => {
    const parentQuery = chunkIds.map(id => `'${id}' in parents`).join(' or ');
    const q = `(${parentQuery}) and trashed = false`;
    const fields = 'files(id,name,mimeType,owners,lastModifyingUser,createdTime,modifiedTime,size,webViewLink,parents)';
    
    let allFiles = [];
    let pageToken = null;

    do {
      if (abortSignal?.aborted) {
        throw new DOMException('Scan cancelled by user', 'AbortError');
      }

      const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields + ',nextPageToken')}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: abortSignal
      });

      if (!res.ok) {
        // Fallback to individual requests if batch query is restricted
        const individual = await Promise.all(chunkIds.map(id => listFolderChildren(id, accessToken, abortSignal).catch(() => [])));
        return individual.flat();
      }

      const data = await res.json();
      if (data.files) {
        allFiles = allFiles.concat(data.files);
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return allFiles;
  }));

  return results.flat();
}

/**
 * Ultra-Fast Level-by-Level Batch Crawler
 */
export async function scanDriveFolder(rootFolderId, accessToken, maxDepth = 4, progressCallback = null, abortSignal = null) {
  const rootMeta = await getFolderMetadata(rootFolderId, accessToken, abortSignal);
  
  const allDiscoveredFiles = [];
  const folderStats = {
    totalFoldersScanned: 1,
    studentFoldersCount: 0,
    totalFilesFound: 0,
    submittedFoldersCount: 0,
    emptyFoldersCount: 0,
    uniqueSubmittersCount: 0
  };

  const submitterEmails = new Set();
  const folderMap = new Map(); // id -> { id, name, path, parentId, studentName, childrenFolders: [], files: [] }

  folderMap.set(rootFolderId, {
    id: rootFolderId,
    name: rootMeta.name,
    path: rootMeta.name,
    parentId: null,
    studentName: '',
    childrenFolders: [],
    files: []
  });

  if (progressCallback) {
    progressCallback({
      currentPath: rootMeta.name,
      foldersScanned: 1,
      filesFound: 0
    });
  }

  // Level-by-Level Queue
  let currentLevelFolderIds = [rootFolderId];

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (abortSignal?.aborted) {
      throw new DOMException('Scan cancelled by user', 'AbortError');
    }

    if (currentLevelFolderIds.length === 0) break;

    // Fetch all children of all folders at this level in parallel batches!
    const childrenItems = await listMultiFolderChildren(currentLevelFolderIds, accessToken, abortSignal);
    const nextLevelFolderIds = [];

    for (const item of childrenItems) {
      if (abortSignal?.aborted) {
        throw new DOMException('Scan cancelled by user', 'AbortError');
      }

      const parentId = item.parents && item.parents[0] ? item.parents[0] : null;
      const parentObj = parentId ? folderMap.get(parentId) : null;
      const parentPath = parentObj ? parentObj.path : rootMeta.name;
      const parentStudent = parentObj ? parentObj.studentName : '';

      const isFolder = item.mimeType === 'application/vnd.google-apps.folder';

      if (isFolder) {
        folderStats.totalFoldersScanned++;
        const itemPath = `${parentPath} > ${item.name}`;
        
        // If this is Level 1 under root, this is a student folder!
        const studentName = (depth === 1)
          ? item.name.replace(/ - (Major|Computer|Assignment).*$/, '').trim()
          : parentStudent;

        const folderNode = {
          id: item.id,
          name: item.name,
          path: itemPath,
          parentId,
          studentName,
          childrenFolders: [],
          files: []
        };

        folderMap.set(item.id, folderNode);
        if (parentObj) {
          parentObj.childrenFolders.push(folderNode);
        }

        if (depth < maxDepth) {
          nextLevelFolderIds.push(item.id);
        }
      } else {
        // File item
        folderStats.totalFilesFound++;
        const owner = item.owners && item.owners[0] ? item.owners[0] : {};
        const ownerName = owner.displayName || 'Unknown';
        const ownerEmail = owner.emailAddress || '';
        const lastModBy = item.lastModifyingUser?.displayName || ownerName;

        if (ownerEmail) submitterEmails.add(ownerEmail);

        const pathParts = parentPath.split(' > ');
        const folderLeaf = pathParts[pathParts.length - 1] || 'General';

        const processedFile = {
          id: item.id,
          name: item.name,
          mimeType: item.mimeType,
          size: item.size ? parseInt(item.size, 10) : 0,
          formattedSize: formatBytes(item.size ? parseInt(item.size, 10) : 0),
          createdTime: item.createdTime,
          createdTimeFormatted: formatDate(item.createdTime),
          modifiedTime: item.modifiedTime,
          modifiedTimeFormatted: formatDate(item.modifiedTime),
          ownerName,
          ownerEmail,
          lastModifiedBy: lastModBy,
          folderPath: parentPath,
          studentName: parentStudent || 'General',
          milestone: folderLeaf,
          webViewLink: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`
        };

        allDiscoveredFiles.push(processedFile);

        if (parentObj) {
          parentObj.files.push({
            id: item.id,
            name: item.name,
            type: 'file',
            owner: ownerName,
            time: formatDate(item.modifiedTime),
            dateIso: item.modifiedTime || item.createdTime,
            size: processedFile.formattedSize,
            webViewLink: processedFile.webViewLink
          });
        }
      }
    }

    if (progressCallback) {
      progressCallback({
        currentPath: `Level ${depth} completed (${folderStats.totalFoldersScanned} folders, ${folderStats.totalFilesFound} files)`,
        foldersScanned: folderStats.totalFoldersScanned,
        filesFound: folderStats.totalFilesFound
      });
    }

    currentLevelFolderIds = nextLevelFolderIds;
  }

  // Build recursive tree and student matrix rows
  const rootNode = folderMap.get(rootFolderId);
  const firstLevelFolders = rootNode ? rootNode.childrenFolders : [];
  folderStats.studentFoldersCount = firstLevelFolders.length;
  folderStats.uniqueSubmittersCount = submitterEmails.size;

  const allLeafMilestones = new Set();
  const matrixRows = [];

  for (const studentFolder of firstLevelFolders) {
    const rawStudentName = studentFolder.name;
    const cleanStudentName = rawStudentName.replace(/ - (Major Project|Computer Application|June|Semester|\d).*$/i, '').trim() || rawStudentName;
    
    const studentSubmissions = {};
    let studentSubmittedCount = 0;
    let studentEmptyCount = 0;

    function collectStudentMilestones(node) {
      const hasFiles = node.files.length > 0;
      const hasSubfolders = node.childrenFolders.length > 0;

      if (!hasSubfolders || hasFiles) {
        allLeafMilestones.add(node.name);
        if (hasFiles) {
          studentSubmissions[node.name] = {
            status: 'submitted',
            files: node.files,
            isFolderEmpty: false
          };
          studentSubmittedCount += node.files.length;
          folderStats.submittedFoldersCount++;
        } else {
          studentSubmissions[node.name] = {
            status: 'empty',
            files: [],
            isFolderEmpty: true
          };
          studentEmptyCount++;
          folderStats.emptyFoldersCount++;
        }
      }

      for (const child of node.childrenFolders) {
        collectStudentMilestones(child);
      }
    }

    collectStudentMilestones(studentFolder);

    matrixRows.push({
      studentName: cleanStudentName,
      fullFolderName: rawStudentName,
      submissions: studentSubmissions,
      submittedCount: studentSubmittedCount,
      emptyCount: studentEmptyCount
    });
  }

  // Construct UI Tree
  function buildUiTree(node) {
    return {
      id: node.id,
      name: node.name,
      type: 'folder',
      isEmpty: node.childrenFolders.length === 0 && node.files.length === 0,
      children: [
        ...node.childrenFolders.map(buildUiTree),
        ...node.files
      ]
    };
  }

  const rootTree = rootNode ? buildUiTree(rootNode) : { id: rootFolderId, name: rootMeta.name, type: 'folder', children: [] };

  // Natural sort milestone names
  const sortedMilestones = Array.from(allLeafMilestones).sort((a, b) => {
    const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
    const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
    if (numA && numB && numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });

  return {
    rootFolder: rootMeta,
    stats: folderStats,
    files: allDiscoveredFiles,
    matrixRows,
    milestones: sortedMilestones,
    tree: rootTree,
    scannedAt: new Date().toISOString()
  };
}
