import ExcelJS from 'exceljs';
import { getSubmissionStatus } from './weekDeadlineManager';

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
 * Colors configuration matching native Excel spreadsheet formatting exactly
 */
const EXCEL_STYLES = {
  border: {
    top: { style: 'thin', color: { argb: 'FF808080' } },
    left: { style: 'thin', color: { argb: 'FF808080' } },
    bottom: { style: 'thin', color: { argb: 'FF808080' } },
    right: { style: 'thin', color: { argb: 'FF808080' } }
  },
  headerMain: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }, // Soft peach
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  headerSub: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, // Light cream
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
  },
  studentName: {
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 }
  },
  submitted: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, // Soft baby green
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF006100' } }, // Dark green text
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  late: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }, // Soft baby yellow
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF9C6500' } }, // Dark yellow/brown text
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  empty: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }, // Soft baby pink/red
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF9C0006' } }, // Dark red text
    alignment: { vertical: 'middle', horizontal: 'center' }
  },
  dash: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }, // Soft baby pink
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF9C0006' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  }
};

/**
 * Export Hierarchical Matrix directly to a Styled Excel (.xlsx) file with merged headers and colors
 */
export async function exportMatrixToExcel(matrixData, columnItems, rootFolderName = 'Drive_Submission_Matrix', weekDeadlines = {}) {
  if (!matrixData || matrixData.length === 0 || !columnItems || columnItems.length === 0) return;

  // Parse columns
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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Drive Submission Inspector';
  workbook.lastModifiedBy = 'Drive Submission Inspector';
  workbook.created = new Date();
  workbook.modified = new Date();

  const cleanSheetName = (rootFolderName || 'Submission Matrix').replace(/[*?:/\\\[\]]/g, ' ').slice(0, 31);
  const worksheet = workbook.addWorksheet(cleanSheetName, {
    views: [{ showGridLines: true }]
  });

  // Set Row Heights
  worksheet.getRow(1).height = 26;
  worksheet.getRow(2).height = 26;

  // Column A: Student Name Header
  const cellA1 = worksheet.getCell(1, 1);
  cellA1.value = '[Main Folder]';
  Object.assign(cellA1, {
    fill: EXCEL_STYLES.headerMain.fill,
    font: EXCEL_STYLES.headerMain.font,
    alignment: EXCEL_STYLES.headerMain.alignment,
    border: EXCEL_STYLES.border
  });

  const cellA2 = worksheet.getCell(2, 1);
  cellA2.value = 'Student Name / [Subfolder]';
  Object.assign(cellA2, {
    fill: EXCEL_STYLES.headerSub.fill,
    font: EXCEL_STYLES.headerSub.font,
    alignment: EXCEL_STYLES.headerSub.alignment,
    border: EXCEL_STYLES.border
  });

  // Group columns by category for merged headers in Row 1
  const categoryRanges = [];
  let currentCat = null;
  let startIdx = 0;

  parsedCols.forEach((col, idx) => {
    const colNumber = idx + 2; // Column index in Excel (1-based, B is 2)

    // Row 2: Subfolder header
    const subCell = worksheet.getCell(2, colNumber);
    subCell.value = col.subfolder;
    Object.assign(subCell, {
      fill: EXCEL_STYLES.headerSub.fill,
      font: EXCEL_STYLES.headerSub.font,
      alignment: EXCEL_STYLES.headerSub.alignment,
      border: EXCEL_STYLES.border
    });

    if (col.category !== currentCat) {
      if (currentCat !== null) {
        categoryRanges.push({ category: currentCat, start: startIdx, end: colNumber - 1 });
      }
      currentCat = col.category;
      startIdx = colNumber;
    }
  });

  if (currentCat !== null) {
    categoryRanges.push({ category: currentCat, start: startIdx, end: parsedCols.length + 1 });
  }

  // Merge and style Row 1 Category headers
  categoryRanges.forEach(catRange => {
    if (catRange.start <= catRange.end) {
      if (catRange.start < catRange.end) {
        worksheet.mergeCells(1, catRange.start, 1, catRange.end);
      }
      const catCell = worksheet.getCell(1, catRange.start);
      catCell.value = catRange.category;

      for (let c = catRange.start; c <= catRange.end; c++) {
        const cell = worksheet.getCell(1, c);
        Object.assign(cell, {
          fill: EXCEL_STYLES.headerMain.fill,
          font: EXCEL_STYLES.headerMain.font,
          alignment: EXCEL_STYLES.headerMain.alignment,
          border: EXCEL_STYLES.border
        });
      }
    }
  });

  // Write Student Data Rows (Starting at Row 3)
  matrixData.forEach((row, rIdx) => {
    const rowNumber = rIdx + 3;
    const excelRow = worksheet.getRow(rowNumber);
    excelRow.height = 22;

    // Student Name
    const nameCell = worksheet.getCell(rowNumber, 1);
    nameCell.value = row.studentName;
    Object.assign(nameCell, {
      font: EXCEL_STYLES.studentName.font,
      alignment: EXCEL_STYLES.studentName.alignment,
      border: EXCEL_STYLES.border
    });

    // Milestone Submissions
    parsedCols.forEach((col, cIdx) => {
      const colNumber = cIdx + 2;
      const cell = row.submissions[col.key] || row.submissions[col.subfolder] || row.submissions[col.category];
      const targetCell = worksheet.getCell(rowNumber, colNumber);

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

        if (statusInfo.isLate) {
          targetCell.value = 'Late';
          Object.assign(targetCell, {
            fill: EXCEL_STYLES.late.fill,
            font: EXCEL_STYLES.late.font,
            alignment: EXCEL_STYLES.late.alignment,
            border: EXCEL_STYLES.border
          });
        } else {
          targetCell.value = 'Submitted';
          Object.assign(targetCell, {
            fill: EXCEL_STYLES.submitted.fill,
            font: EXCEL_STYLES.submitted.font,
            alignment: EXCEL_STYLES.submitted.alignment,
            border: EXCEL_STYLES.border
          });
        }
      }
    });
  });

  // Set Column Widths
  worksheet.getColumn(1).width = 28; // Student name column
  for (let c = 2; c <= parsedCols.length + 1; c++) {
    worksheet.getColumn(c).width = 14; // Milestone columns
  }

  // Generate Excel buffer and download .xlsx file
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
