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

export function exportMatrixToCSV(matrixData, columns, rootFolderName = 'Drive_Submission_Matrix') {
  if (!matrixData || matrixData.length === 0) return;

  const headers = ['Student / Folder Name', ...columns.map(c => `"${c.replace(/"/g, '""')}"`), 'Total Submitted', 'Total Empty'];

  const rows = matrixData.map(row => {
    const colValues = columns.map(col => {
      const cell = row.submissions[col];
      if (!cell) return '"-"';
      if (cell.isFolderEmpty) return '"[EMPTY]"';
      return `"${cell.files.length} file(s): ${cell.files.map(f => f.name).join('; ')}"`;
    });
    return [
      `"${row.studentName.replace(/"/g, '""')}"`,
      ...colValues,
      row.submittedCount,
      row.emptyCount
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${rootFolderName.replace(/\s+/g, '_')}_Matrix_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
