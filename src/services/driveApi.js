import { formatBytes, formatDate } from '../utils/driveUrlParser';

/**
 * Robust Google Drive API v3 Crawler with Exponential Backoff, Shared Drives Support,
 * Recursive File Gathering, and Shortcut Resolution.
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Fetch helper with automatic retry and exponential backoff for rate limits (429) & 5xx server errors
 */
async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 600) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (attempt === retries) return res;
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (options.signal?.aborted) throw err;
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
    }
  }
}

/**
 * Clean student folder name by removing course codes, majors, or trailing hyphens
 * e.g. "Seng Hour - Interaction Design & UX/UI" -> "Seng Hour"
 * e.g. "Seng Vichea - - Interaction Design & UX/UI" -> "Seng Vichea"
 */
export function cleanStudentFolderName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  let cleaned = rawName.trim();
  
  // 1. Split on hyphens / dashes like " - ", " - - ", " -- ", " – ", " — "
  const splitParts = cleaned.split(/\s*[-–—]+\s*/);
  if (splitParts.length > 1 && splitParts[0].trim().length > 1) {
    cleaned = splitParts[0].trim();
  }
  
  // 2. Strip any trailing course parentheticals like (Interaction Design) or [UX/UI]
  cleaned = cleaned.replace(/\s*[\(\[\{].*?[\)\]\}]/g, '').trim();
  
  return cleaned || rawName;
}

/**
 * Helper: Recursively collect all files within a folder and all its subfolders
 * This ensures that if a student uploaded files inside deeper nested directories,
 * they are NEVER missed or marked as empty!
 */
export function getAllFilesInFolderRecursive(folderNode) {
  if (!folderNode) return [];
  const filesList = [...(folderNode.files || [])];
  if (folderNode.childrenFolders && folderNode.childrenFolders.length > 0) {
    for (const child of folderNode.childrenFolders) {
      filesList.push(...getAllFilesInFolderRecursive(child));
    }
  }
  return filesList;
}

/**
 * Fetch folder details by ID with Shared Drives support
 */
export async function getFolderMetadata(folderId, accessToken, abortSignal = null) {
  const fields = 'id,name,mimeType,owners,createdTime,modifiedTime,webViewLink';
  const url = `${DRIVE_API_BASE}/files/${folderId}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`;
  
  const res = await fetchWithRetry(url, {
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
 * List direct children of a single folder with pagination and Shared Drives support
 */
export async function listFolderChildren(folderId, accessToken, abortSignal = null) {
  const fields = 'files(id,name,mimeType,owners,lastModifyingUser,createdTime,modifiedTime,size,webViewLink,parents,shortcutDetails)';
  const q = `'${folderId}' in parents and trashed = false`;
  
  let allFiles = [];
  let pageToken = null;

  do {
    if (abortSignal?.aborted) {
      throw new DOMException('Scan cancelled by user', 'AbortError');
    }

    const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields + ',nextPageToken')}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ''}`;
    
    const res = await fetchWithRetry(url, {
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
 * Ultra-Fast: List children for multiple parent folders in single batch requests with fallback
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
    const fields = 'files(id,name,mimeType,owners,lastModifyingUser,createdTime,modifiedTime,size,webViewLink,parents,shortcutDetails)';
    
    let allFiles = [];
    let pageToken = null;

    try {
      do {
        if (abortSignal?.aborted) {
          throw new DOMException('Scan cancelled by user', 'AbortError');
        }

        const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields + ',nextPageToken')}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ''}`;
        
        const res = await fetchWithRetry(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: abortSignal
        });

        if (!res.ok) {
          // Fallback to individual requests if batch query fails
          const individual = await Promise.all(
            chunkIds.map(id => listFolderChildren(id, accessToken, abortSignal).catch(() => []))
          );
          return individual.flat();
        }

        const data = await res.json();
        if (data.files) {
          allFiles = allFiles.concat(data.files);
        }
        pageToken = data.nextPageToken;
      } while (pageToken);

      return allFiles;
    } catch (e) {
      if (abortSignal?.aborted) throw e;
      // Fallback to individual requests on error
      const individual = await Promise.all(
        chunkIds.map(id => listFolderChildren(id, accessToken, abortSignal).catch(() => []))
      );
      return individual.flat();
    }
  }));

  return results.flat();
}

/**
 * Level-by-Level BFS Scanner with Accurate Hierarchy, Shared Drives, and Recursive Submissions
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
  const folderMap = new Map();

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

      // Check if item is a folder (or a shortcut to a folder)
      const isFolder = item.mimeType === 'application/vnd.google-apps.folder' ||
        (item.mimeType === 'application/vnd.google-apps.shortcut' && item.shortcutDetails?.targetMimeType === 'application/vnd.google-apps.folder');

      if (isFolder) {
        folderStats.totalFoldersScanned++;
        const itemPath = `${parentPath} > ${item.name}`;
        
        const studentName = (depth === 1)
          ? cleanStudentFolderName(item.name)
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
            time: formatDate(item.modifiedTime || item.createdTime),
            date: formatDate(item.modifiedTime || item.createdTime),
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

  // Build Hierarchical Category & Subfolder Groups
  // e.g. { "Concept Note (Week 2 - 4)": ["Document", "Final Concept"] }
  const categoryGroupsMap = new Map(); // categoryName -> Set of subfolderNames

  // Discover all category groups across all students
  for (const studentFolder of firstLevelFolders) {
    for (const catFolder of studentFolder.childrenFolders) {
      const catName = catFolder.name;
      if (!categoryGroupsMap.has(catName)) {
        categoryGroupsMap.set(catName, new Set());
      }
      const subSet = categoryGroupsMap.get(catName);

      if (catFolder.childrenFolders.length > 0) {
        for (const sub of catFolder.childrenFolders) {
          subSet.add(sub.name);
        }
      } else {
        // Direct category folder has files directly
        subSet.add(catName);
      }
    }
  }

  // Flatten into sorted hierarchical groups array
  const groupedMilestones = [];
  const allFlattenedColumns = [];

  for (const [categoryName, subSet] of categoryGroupsMap.entries()) {
    const subfoldersList = Array.from(subSet).sort((a, b) => {
      const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
      const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
      if (numA && numB && numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    const groupItems = subfoldersList.map(subName => {
      const colKey = subName === categoryName ? categoryName : `${categoryName} > ${subName}`;
      return {
        key: colKey,
        category: categoryName,
        subfolder: subName,
        isDirectCategory: subName === categoryName
      };
    });

    groupedMilestones.push({
      categoryName,
      columns: groupItems
    });

    allFlattenedColumns.push(...groupItems);
  }

  // Build student matrix rows with hierarchical keys and recursive file gathering
  const matrixRows = [];
  let totalSubmittedFolders = 0;
  let totalEmptyFolders = 0;

  for (const studentFolder of firstLevelFolders) {
    const rawStudentName = studentFolder.name;
    const cleanStudentName = cleanStudentFolderName(rawStudentName);
    
    const studentSubmissions = {};
    let studentSubmittedMilestonesCount = 0;
    let studentEmptyMilestonesCount = 0;

    // Check each category and subfolder
    for (const catGroup of groupedMilestones) {
      const catFolder = studentFolder.childrenFolders.find(c => c.name === catGroup.categoryName);

      for (const col of catGroup.columns) {
        if (!catFolder) {
          // Student doesn't have this category folder at all
          studentSubmissions[col.key] = null;
          continue;
        }

        if (col.isDirectCategory) {
          // Direct category: Gather all files recursively inside catFolder
          const files = getAllFilesInFolderRecursive(catFolder);
          if (files.length > 0) {
            studentSubmissions[col.key] = {
              status: 'submitted',
              files,
              isFolderEmpty: false,
              category: catGroup.categoryName,
              subfolder: col.subfolder
            };
            studentSubmittedMilestonesCount++;
            totalSubmittedFolders++;
          } else {
            studentSubmissions[col.key] = {
              status: 'empty',
              files: [],
              isFolderEmpty: true,
              category: catGroup.categoryName,
              subfolder: col.subfolder
            };
            studentEmptyMilestonesCount++;
            totalEmptyFolders++;
          }
        } else {
          // Find the specific subfolder inside this category
          const subFolder = catFolder.childrenFolders.find(s => s.name === col.subfolder);
          if (!subFolder) {
            studentSubmissions[col.key] = null;
          } else {
            // Gather all files recursively inside subFolder (including nested subfolders)
            const files = getAllFilesInFolderRecursive(subFolder);
            if (files.length > 0) {
              studentSubmissions[col.key] = {
                status: 'submitted',
                files,
                isFolderEmpty: false,
                category: catGroup.categoryName,
                subfolder: col.subfolder
              };
              studentSubmittedMilestonesCount++;
              totalSubmittedFolders++;
            } else {
              studentSubmissions[col.key] = {
                status: 'empty',
                files: [],
                isFolderEmpty: true,
                category: catGroup.categoryName,
                subfolder: col.subfolder
              };
              studentEmptyMilestonesCount++;
              totalEmptyFolders++;
            }
          }
        }
      }
    }

    matrixRows.push({
      studentName: cleanStudentName,
      fullFolderName: rawStudentName,
      submissions: studentSubmissions,
      submittedCount: studentSubmittedMilestonesCount,
      emptyCount: studentEmptyMilestonesCount
    });
  }

  folderStats.submittedFoldersCount = totalSubmittedFolders;
  folderStats.emptyFoldersCount = totalEmptyFolders;

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

  return {
    rootFolder: rootMeta,
    stats: folderStats,
    files: allDiscoveredFiles,
    matrixRows,
    groupedMilestones,
    allFlattenedColumns,
    milestones: allFlattenedColumns.map(c => c.key),
    tree: rootTree,
    scannedAt: new Date().toISOString()
  };
}
