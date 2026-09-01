import { formatBytes, formatDate } from '../utils/driveUrlParser';

/**
 * Google Drive API v3 Client for fast, recursive folder auditing with parallel concurrency
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const CONCURRENCY_LIMIT = 8; // Process 8 folders concurrently in parallel

/**
 * Helper to run async tasks in parallel with a concurrency pool
 */
async function mapConcurrent(items, limit, fn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

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
 * List direct children of a folder
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
 * Recursively scan Google Drive folder structure up to maxDepth with parallel processing
 */
export async function scanDriveFolder(rootFolderId, accessToken, maxDepth = 4, progressCallback = null, abortSignal = null) {
  const rootMeta = await getFolderMetadata(rootFolderId, accessToken, abortSignal);
  
  const allDiscoveredFiles = [];
  const folderStats = {
    totalFoldersScanned: 0,
    studentFoldersCount: 0,
    totalFilesFound: 0,
    submittedFoldersCount: 0,
    emptyFoldersCount: 0,
    uniqueSubmittersCount: 0
  };

  const submitterEmails = new Set();

  // Recursive tree crawler with parallel subfolder execution
  async function crawlFolder(currentFolderId, currentPath, currentDepth, studentName = '') {
    if (abortSignal?.aborted) {
      throw new DOMException('Scan cancelled by user', 'AbortError');
    }

    folderStats.totalFoldersScanned++;
    if (progressCallback) {
      progressCallback({
        currentPath,
        foldersScanned: folderStats.totalFoldersScanned,
        filesFound: folderStats.totalFilesFound
      });
    }

    const children = await listFolderChildren(currentFolderId, accessToken, abortSignal);
    const subfolders = children.filter(c => c.mimeType === 'application/vnd.google-apps.folder');
    const filesInFolder = children.filter(c => c.mimeType !== 'application/vnd.google-apps.folder');

    // Track tree structure node
    const treeNode = {
      id: currentFolderId,
      name: currentPath.split(' > ').pop() || rootMeta.name,
      type: 'folder',
      isEmpty: children.length === 0,
      children: []
    };

    // Processing files
    if (filesInFolder.length > 0) {
      folderStats.submittedFoldersCount++;
      for (const f of filesInFolder) {
        if (abortSignal?.aborted) {
          throw new DOMException('Scan cancelled by user', 'AbortError');
        }

        folderStats.totalFilesFound++;
        const owner = f.owners && f.owners[0] ? f.owners[0] : {};
        const ownerName = owner.displayName || 'Unknown';
        const ownerEmail = owner.emailAddress || '';
        const lastModBy = f.lastModifyingUser?.displayName || ownerName;

        if (ownerEmail) submitterEmails.add(ownerEmail);

        // Detect milestone / week
        const pathParts = currentPath.split(' > ');
        const folderLeaf = pathParts[pathParts.length - 1] || 'General';

        const processedFile = {
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size ? parseInt(f.size, 10) : 0,
          formattedSize: formatBytes(f.size ? parseInt(f.size, 10) : 0),
          createdTime: f.createdTime,
          createdTimeFormatted: formatDate(f.createdTime),
          modifiedTime: f.modifiedTime,
          modifiedTimeFormatted: formatDate(f.modifiedTime),
          ownerName,
          ownerEmail,
          lastModifiedBy: lastModBy,
          folderPath: `${currentPath}`,
          studentName: studentName || 'General',
          milestone: folderLeaf,
          webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`
        };

        allDiscoveredFiles.push(processedFile);
        treeNode.children.push({
          id: f.id,
          name: f.name,
          type: 'file',
          owner: ownerName,
          time: formatDate(f.modifiedTime),
          webViewLink: processedFile.webViewLink
        });
      }
    } else if (subfolders.length === 0) {
      // Leaf folder with zero files = Empty submission folder!
      folderStats.emptyFoldersCount++;
    }

    // Recurse into subfolders concurrently up to maxDepth
    if (currentDepth < maxDepth && subfolders.length > 0) {
      const childNodes = await mapConcurrent(subfolders, CONCURRENCY_LIMIT, async (sf) => {
        if (abortSignal?.aborted) {
          throw new DOMException('Scan cancelled by user', 'AbortError');
        }
        const nextStudent = (currentDepth === 1) ? sf.name.replace(/ - (Major|Computer|Assignment).*$/, '').trim() : studentName;
        const sfPath = `${currentPath} > ${sf.name}`;
        return await crawlFolder(sf.id, sfPath, currentDepth + 1, nextStudent);
      });

      treeNode.children.push(...childNodes);
    }

    return treeNode;
  }

  // Start crawl from root
  const rootTree = await crawlFolder(rootFolderId, rootMeta.name, 1, '');

  // Extract 1st-level subfolders (students) & matrix columns
  const firstLevelFolders = rootTree.children.filter(c => c.type === 'folder');
  folderStats.studentFoldersCount = firstLevelFolders.length;
  folderStats.uniqueSubmittersCount = submitterEmails.size;

  // Build matrix rows and dynamic milestones
  const allLeafMilestones = new Set();
  const matrixRows = [];

  for (const studentFolder of firstLevelFolders) {
    const studentName = studentFolder.name;
    const studentSubmissions = {};
    let studentSubmittedCount = 0;
    let studentEmptyCount = 0;

    // Traverse student tree to collect milestone subfolders
    function collectStudentMilestones(node) {
      if (node.type === 'folder') {
        const hasFiles = node.children.some(c => c.type === 'file');
        const hasSubfolders = node.children.some(c => c.type === 'folder');

        if (!hasSubfolders || hasFiles) {
          allLeafMilestones.add(node.name);
          const files = node.children.filter(c => c.type === 'file');
          if (files.length > 0) {
            studentSubmissions[node.name] = {
              status: 'submitted',
              files: files.map(f => ({ name: f.name, date: f.time, webViewLink: f.webViewLink })),
              isFolderEmpty: false
            };
            studentSubmittedCount += files.length;
          } else {
            studentSubmissions[node.name] = {
              status: 'empty',
              files: [],
              isFolderEmpty: true
            };
            studentEmptyCount++;
          }
        }

        for (const child of node.children) {
          if (child.type === 'folder') {
            collectStudentMilestones(child);
          }
        }
      }
    }

    collectStudentMilestones(studentFolder);

    matrixRows.push({
      studentName,
      submissions: studentSubmissions,
      submittedCount: studentSubmittedCount,
      emptyCount: studentEmptyCount
    });
  }

  // Natural sort milestone column names
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
