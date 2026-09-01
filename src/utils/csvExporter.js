import { getSubmissionStatus } from './weekDeadlineManager';

/**
 * Export audit files and submission matrix to CSV files
 */
export function exportFilesToCSV(files, rootFolderName = 'Drive_Submission_Audit') {
  if (!files || files.length === 0) return;

  const headers = ['File Name', 'Folder Path', 'Submitter / Owner', 'Owner Email', 'Last Modified By', 'Created Time', 'Modified Time', 'File Size', 'MIME Type', 'Drive URL'];
  
  const rows = files.map(file => [
    `"${(file.name || '').replace(/"/g, '""')}"`,
    `"${(file.folderPath || '').replace(/"/g, '""')}"`,
    `"${(file.ownerName || '').replace(/"/g, '""')}"`,
    `"${(file.ownerEmail || '').replace(/"/g, '""')}"`,
    `"${(file.lastModifiedBy || '').replace(/"/g, '""')}"`,
    `"${file.createdTimeFormatted || ''}"`,
    `"${file.modifiedTimeFormatted || ''}"`,
    `"${file.formattedSize || ''}"`,
    `"${file.mimeType || ''}"`,
    `"${file.webViewLink || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${rootFolderName.replace(/\s+/g, '_')}_Files_Audit.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Hierarchical Matrix with 2 Header Rows (Main Parent Folder & Subfolder)
 * Cell values are strictly: Submitted, Late, Empty, or -
 */
export function exportMatrixToCSV(matrixData, columnItems, rootFolderName = 'Drive_Submission_Matrix', weekDeadlines = {}) {
  if (!matrixData || matrixData.length === 0 || !columnItems || columnItems.length === 0) return;

  // Handle both array of objects { key, category, subfolder } or array of strings "Category > Subfolder"
  const parsedCols = columnItems.map(col => {
    if (typeof col === 'object' && col !== null) {
      return {
        key: col.key,
        category: col.category || 'General',
        subfolder: col.subfolder || col.key
      };
    }
    const parts = String(col).split(' > ');
    return {
      key: String(col),
      category: parts.length > 1 ? parts[0] : 'Main Folder',
      subfolder: parts.length > 1 ? parts[1] : parts[0]
    };
  });

  // Header Row 1: Main Parent Folder Name
  const parentFolderHeaderRow = [
    '"[Main Folder]"',
    ...parsedCols.map(c => `"${c.category.replace(/"/g, '""')}"`),
    '""',
    '""'
  ];

  // Header Row 2: Subfolder / Milestone Name
  const subfolderHeaderRow = [
    '"Student Name / [Subfolder]"',
    ...parsedCols.map(c => `"${c.subfolder.replace(/"/g, '""')}"`),
    '"Total Submitted"',
    '"Total Empty"'
  ];

  // Student Data Rows
  const dataRows = matrixData.map(row => {
    const colValues = parsedCols.map(col => {
      const cell = row.submissions[col.key] || row.submissions[col.subfolder] || row.submissions[col.category];
      if (!cell) return '"-"';
      if (cell.isFolderEmpty) return '"Empty"';

      const firstFile = cell.files && cell.files[0];
      const deadlineIso = weekDeadlines[col.key] || weekDeadlines[col.subfolder] || weekDeadlines[col.category];
      const statusInfo = getSubmissionStatus(firstFile?.dateIso || firstFile?.date, deadlineIso);

      if (statusInfo.isLate) {
        return '"Late"';
      }
      return '"Submitted"';
    });

    return [
      `"${row.studentName.replace(/"/g, '""')}"`,
      ...colValues,
      row.submittedCount,
      row.emptyCount
    ];
  });

  const csvContent = [
    parentFolderHeaderRow.join(','),
    subfolderHeaderRow.join(','),
    ...dataRows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${rootFolderName.replace(/\s+/g, '_')}_Matrix_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
