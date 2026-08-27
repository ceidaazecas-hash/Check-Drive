import { formatBytes, formatDate } from '../utils/driveUrlParser';

/**
 * Google Drive API v3 Client for recursive folder auditing
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Fetch folder details by ID
 */
export async function getFolderMetadata(folderId, accessToken) {
  const fields = 'id,name,mimeType,owners,createdTime,modifiedTime,webViewLink';
  const res = await fetch(`${DRIVE_API_BASE}/files/${folderId}?fields=${encodeURIComponent(fields)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
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
export async function listFolderChildren(folderId, accessToken) {
  const fields = 'files(id,name,mimeType,owners,lastModifyingUser,createdTime,modifiedTime,size,webViewLink,parents)';
  const q = `'${folderId}' in parents and trashed = false`;
  
  let allFiles = [];
  let pageToken = null;

  do {
    const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields + ',nextPageToken')}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
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
 * Recursively scan Google Drive folder structure up to maxDepth
 */
export async function scanDriveFolder(rootFolderId, accessToken, maxDepth = 4, progressCallback = null) {
  const rootMeta = await getFolderMetadata(rootFolderId, accessToken);
  
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
  const studentFolderNodes = [];

  // Recursive tree crawler
  async function crawlFolder(currentFolderId, currentPath, currentDepth, studentName = '') {
    folderStats.totalFoldersScanned++;
    if (progressCallback) {
      progressCallback(`Scanning folder: ${currentPath}`);
    }

    const children = await listFolderChildren(currentFolderId, accessToken);
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
        folderStats.totalFilesFound++;
        const owner = f.owners && f.owners[0] ? f.owners[0] : {};
        const ownerName = owner.displayName || 'Unknown';
        const ownerEmail = owner.emailAddress || '';
        const lastModBy = f.lastModifyingUser?.displayName || ownerName;

        if (ownerEmail) submitterEmails.add(ownerEmail);

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

    // Recurse into subfolders if within maxDepth
    if (currentDepth < maxDepth) {
      for (const sf of subfolders) {
        const nextStudent = (currentDepth === 1) ? sf.name.replace(/ - Major.*$/, '').trim() : studentName;
        const sfPath = `${currentPath} > ${sf.name}`;
        const childNode = await crawlFolder(sf.id, sfPath, currentDepth + 1, nextStudent);
        treeNode.children.push(childNode);
      }
    }

    return treeNode;
  }

  // Start crawl from root
  const rootTree = await crawlFolder(rootFolderId, rootMeta.name, 1, '');

  // Extract 1st-level subfolders (students) & matrix columns
  const firstLevelFolders = rootTree.children.filter(c => c.type === 'folder');
  folderStats.studentFoldersCount = firstLevelFolders.length;
  folderStats.uniqueSubmittersCount = submitterEmails.size;

  // Build matrix rows and column headers (weeks / milestones)
  const milestoneSet = new Set();
  const matrixRows = firstLevelFolders.map(studentNode => {
    const studentName = studentNode.name;
    const submissions = {};
    let studentSubmittedCount = 0;
    let studentEmptyCount = 0;

    // Collect all sub-leaf folders under this student
    function collectMilestones(node, parentTopic = '') {
      if (node.type === 'folder') {
        if (node.children.length === 0 || node.children.some(c => c.type === 'file')) {
          const colName = node.name.replace(/\s*\(EMPTY\)/i, '');
          milestoneSet.add(colName);
          const files = node.children.filter(c => c.type === 'file');
          const isFolderEmpty = files.length === 0;

          if (isFolderEmpty) studentEmptyCount++;
          else studentSubmittedCount++;

          submissions[colName] = {
            isFolderEmpty,
            folderPath: node.name,
            files: files.map(f => ({ name: f.name, date: f.time, owner: f.owner, link: f.webViewLink }))
          };
        } else {
          node.children.forEach(c => collectMilestones(c, node.name));
        }
      }
    }

    studentNode.children.forEach(c => collectMilestones(c, studentNode.name));

    return {
      studentName,
      folderPath: `${rootMeta.name} > ${studentNode.name}`,
      submittedCount: studentSubmittedCount,
      emptyCount: studentEmptyCount,
      submissions
    };
  });

  return {
    rootFolder: rootMeta,
    scannedAt: new Date().toISOString(),
    stats: folderStats,
    files: allDiscoveredFiles,
    milestones: Array.from(milestoneSet),
    matrixRows,
    tree: rootTree
  };
}
