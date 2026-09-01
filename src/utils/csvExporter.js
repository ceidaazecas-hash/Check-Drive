import ExcelJS from 'exceljs';
import { getSubmissionStatus } from './weekDeadlineManager';
import { cleanStudentFolderName } from '../services/driveApi';

/**
 * Export audit files to CSV
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
 * Exact Excel Color Formatting Matching User's Template
 */
const EXCEL_STYLES = {
  border: {
    top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
  },
  headerMain: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }, // Soft peach
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  headerSub: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, // Light cream
    font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
  },
  studentName: {
    font: { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 }
  },
  submitted: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, // Soft baby green
    font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF006100' } }, // Dark green text
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  late: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }, // Soft baby yellow
    font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF9C6500' } }, // Dark yellow text
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  empty: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }, // Soft baby pink/red
    font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF9C0006' } }, // Dark red text
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  dash: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
    font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF9C0006' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  }
};

/**
 * Export 1 Single Clean Styled Excel (.xlsx) Sheet
 * Exactly matching the format shown in the user's reference image
 */
export async function exportMatrixToExcel(matrixData, columnItems, rootFolderName = 'Drive_Submission_Matrix', weekDeadlines = {}) {
  if (!matrixData || matrixData.length === 0 || !columnItems || columnItems.length === 0) return;

  // Group columns strictly by category to prevent duplicate/interleaved tables
  const categoryMap = new Map();
  columnItems.forEach(col => {
    const key = typeof col === 'object' ? col.key : String(col);
    const category = typeof col === 'object' ? (col.category || 'General') : (String(col).split(' > ')[0] || 'General');
    const subfolder = typeof col === 'object' ? (col.subfolder || key) : (String(col).split(' > ')[1] || key);

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category).push({ key, category, subfolder });
  });

  const parsedCols = [];
  const categoryRanges = [];
  let currentColumnIndex = 2; // Column A is Student Name (index 1), so subfolders start at Column B (index 2)

  categoryMap.forEach((cols, categoryName) => {
    const startIdx = currentColumnIndex;
    cols.forEach(col => {
      parsedCols.push(col);
      currentColumnIndex++;
    });
    const endIdx = currentColumnIndex - 1;
    categoryRanges.push({ category: categoryName, start: startIdx, end: endIdx });
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Drive Submission Inspector';
  workbook.created = new Date();

  // Create ONE single clean worksheet
  const ws = workbook.addWorksheet('Submission Matrix', {
    views: [{ showGridLines: true }]
  });

  ws.getRow(1).height = 24;
  ws.getRow(2).height = 24;

  // Cell A1: [Main Folder]
  const cellA1 = ws.getCell(1, 1);
  cellA1.value = '[Main Folder]';
  Object.assign(cellA1, {
    fill: EXCEL_STYLES.headerMain.fill,
    font: EXCEL_STYLES.headerMain.font,
    alignment: EXCEL_STYLES.headerMain.alignment,
    border: EXCEL_STYLES.border
  });

  // Cell A2: Student Name / [Subfolder]
  const cellA2 = ws.getCell(2, 1);
  cellA2.value = 'Student Name / [Subfolder]';
  Object.assign(cellA2, {
    fill: EXCEL_STYLES.headerSub.fill,
    font: EXCEL_STYLES.headerSub.font,
    alignment: EXCEL_STYLES.headerSub.alignment,
    border: EXCEL_STYLES.border
  });

  // Row 2: Subfolder Headers
  parsedCols.forEach((col, idx) => {
    const colNumber = idx + 2;
    const subCell = ws.getCell(2, colNumber);
    subCell.value = col.subfolder;
    Object.assign(subCell, {
      fill: EXCEL_STYLES.headerSub.fill,
      font: EXCEL_STYLES.headerSub.font,
      alignment: EXCEL_STYLES.headerSub.alignment,
      border: EXCEL_STYLES.border
    });
  });

  // Row 1: Merged Category Headers
  categoryRanges.forEach(catRange => {
    if (catRange.start <= catRange.end) {
      if (catRange.start < catRange.end) {
        ws.mergeCells(1, catRange.start, 1, catRange.end);
      }
      const catCell = ws.getCell(1, catRange.start);
      catCell.value = catRange.category;

      for (let c = catRange.start; c <= catRange.end; c++) {
        const cell = ws.getCell(1, c);
        Object.assign(cell, {
          fill: EXCEL_STYLES.headerMain.fill,
          font: EXCEL_STYLES.headerMain.font,
          alignment: EXCEL_STYLES.headerMain.alignment,
          border: EXCEL_STYLES.border
        });
      }
    }
  });

  // Data Rows: Student submissions
  matrixData.forEach((row, rIdx) => {
    const rowNumber = rIdx + 3;
    const excelRow = ws.getRow(rowNumber);
    excelRow.height = 20;

    // Student Name (Col A)
    const nameCell = ws.getCell(rowNumber, 1);
    nameCell.value = cleanStudentFolderName(row.studentName);
    Object.assign(nameCell, {
      font: EXCEL_STYLES.studentName.font,
      alignment: EXCEL_STYLES.studentName.alignment,
      border: EXCEL_STYLES.border
    });

    // Subfolder Cells
    parsedCols.forEach((col, cIdx) => {
      const colNumber = cIdx + 2;
      const cell = row.submissions[col.key] || row.submissions[col.subfolder] || row.submissions[col.category];
      const targetCell = ws.getCell(rowNumber, colNumber);

      if (!cell) {
        targetCell.value = '-';
        Object.assign(targetCell, {
          fill: EXCEL_STYLES.dash.fill,
          font: EXCEL_STYLES.dash.font,
          alignment: EXCEL_STYLES.dash.alignment,
          border: EXCEL_STYLES.border
        });
      } else if (cell.isFolderEmpty) {
        targetCell.value = 'Empty';
        Object.assign(targetCell, {
          fill: EXCEL_STYLES.empty.fill,
          font: EXCEL_STYLES.empty.font,
          alignment: EXCEL_STYLES.empty.alignment,
          border: EXCEL_STYLES.border
        });
      } else {
        const firstFile = cell.files && cell.files[0];
        const deadlineIso = weekDeadlines[col.key] || weekDeadlines[col.subfolder] || weekDeadlines[col.category];
        const statusInfo = getSubmissionStatus(firstFile?.dateIso || firstFile?.date, deadlineIso);

        targetCell.value = statusInfo.isLate ? 'Late' : 'Submitted';

        const styleTheme = statusInfo.isLate ? EXCEL_STYLES.late : EXCEL_STYLES.submitted;
        Object.assign(targetCell, {
          fill: styleTheme.fill,
          font: styleTheme.font,
          alignment: styleTheme.alignment,
          border: EXCEL_STYLES.border
        });
      }
    });
  });

  // Column Widths
  ws.getColumn(1).width = 24; // Student Name
  for (let c = 2; c <= parsedCols.length + 1; c++) {
    ws.getColumn(c).width = 13.5;
  }

  // Generate binary and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${rootFolderName.replace(/\s+/g, '_')}_Matrix_Report.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Backward compatibility alias
export const exportMatrixToCSV = exportMatrixToExcel;
