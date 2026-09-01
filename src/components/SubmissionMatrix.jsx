import React, { useState } from 'react';
import { CheckCircle2, XCircle, Download, Search, Info, Clock, AlertTriangle, ExternalLink, User, Folder, ChevronRight, X } from 'lucide-react';
import { exportMatrixToCSV } from '../utils/csvExporter';
import { getSubmissionStatus } from '../utils/weekDeadlineManager';

const CATEGORY_COLORS = [
  { bg: 'bg-blue-50/80', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' },
  { bg: 'bg-purple-50/80', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800' },
  { bg: 'bg-emerald-50/80', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800' },
  { bg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' },
  { bg: 'bg-indigo-50/80', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-800' }
];

export default function SubmissionMatrix({
  matrixRows,
  milestones,
  groupedMilestones = [],
  allFlattenedColumns = [],
  rootFolderName,
  weekDeadlines = {},
  weekRanges = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewDensity, setViewDensity] = useState('standard'); // 'compact', 'standard', 'detailed'
  const [selectedCell, setSelectedCell] = useState(null);

  if (!matrixRows || matrixRows.length === 0) return null;

  // Build a lookup map of week range objects
  const rangeLookup = {};
  weekRanges.forEach(w => {
    rangeLookup[w.name] = w;
  });

  // Fallback if groupedMilestones is empty
  const groups = groupedMilestones && groupedMilestones.length > 0
    ? groupedMilestones
    : [{
        categoryName: 'Submission Milestones',
        columns: (milestones || []).map(m => ({ key: m, category: 'Milestones', subfolder: m, isDirectCategory: true }))
      }];

  const flattenedCols = allFlattenedColumns && allFlattenedColumns.length > 0
    ? allFlattenedColumns
    : groups.flatMap(g => g.columns);

  // Filter rows by search term and submission status
  const filteredRows = matrixRows.filter(row => {
    const matchesSearch =
      row.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.fullFolderName && row.fullFolderName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'missing') return row.emptyCount > 0;
    if (filterStatus === 'completed') return row.emptyCount === 0;
    return true;
  });

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      
      {/* Header controls & density toggle */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50/70">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Hierarchical Submission Matrix
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Grouped by <strong>Parent Folders</strong> (Top Tier) and <strong>Subfolders / Milestones</strong> (Bottom Tier).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name..."
              className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-google-blue focus:border-google-blue min-w-[190px]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Filter dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-semibold focus:ring-2 focus:ring-google-blue"
          >
            <option value="all">All Students ({matrixRows.length})</option>
            <option value="missing">With Missing Work</option>
            <option value="completed">All Submitted</option>
          </select>

          {/* View Density Switcher */}
          <div className="flex items-center bg-gray-200/70 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewDensity('compact')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewDensity === 'compact' ? 'bg-white text-google-blue shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Compact icons view"
            >
              Compact
            </button>
            <button
              onClick={() => setViewDensity('standard')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewDensity === 'standard' ? 'bg-white text-google-blue shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Standard view with clean badges and dates"
            >
              Standard
            </button>
            <button
              onClick={() => setViewDensity('detailed')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewDensity === 'detailed' ? 'bg-white text-google-blue shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Detailed view with filenames"
            >
              Detailed
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={() => exportMatrixToCSV(matrixRows, flattenedCols.map(c => c.key), rootFolderName, weekDeadlines)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
            title="Download clean matrix report as CSV/Excel (Submitted, Late, Empty)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Table with 2-Tier Grouped Headers */}
      <div className="overflow-x-auto max-h-[75vh]">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead className="sticky top-0 z-20 shadow-xs">
            
            {/* Tier 1: Parent Category Headers */}
            <tr className="border-b border-gray-200 text-xs font-extrabold tracking-wide uppercase">
              
              {/* Sticky Student Header */}
              <th
                rowSpan={2}
                className="py-3.5 px-4 sticky left-0 bg-gray-100 border-r border-gray-200 z-30 w-64 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] align-middle text-gray-900"
              >
                Student Name
              </th>

              {/* Grouped Category Headers */}
              {groups.map((group, gIdx) => {
                const theme = CATEGORY_COLORS[gIdx % CATEGORY_COLORS.length];
                return (
                  <th
                    key={group.categoryName}
                    colSpan={group.columns.length}
                    className={`py-2.5 px-3 border-r border-gray-200 text-center ${theme.bg} ${theme.text} font-black tracking-wider text-[11px] border-b-2 ${theme.border}`}
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <Folder className="w-3.5 h-3.5 opacity-70" />
                      <span>{group.categoryName}</span>
                    </div>
                  </th>
                );
              })}

              <th rowSpan={2} className="py-3 px-3 text-center min-w-[85px] bg-emerald-50 text-emerald-900 font-bold align-middle border-r border-gray-200">
                Submitted
              </th>
              <th rowSpan={2} className="py-3 px-3 text-center min-w-[85px] bg-rose-50 text-rose-900 font-bold align-middle">
                Empty
              </th>
            </tr>

            {/* Tier 2: Subfolder Headers */}
            <tr className="bg-gray-50/95 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              {flattenedCols.map(col => {
                const rangeObj = rangeLookup[col.subfolder] || rangeLookup[col.category];
                return (
                  <th key={col.key} className="py-2 px-2 border-r border-gray-200 text-center min-w-[125px]">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-800">{col.subfolder}</span>
                      {rangeObj && (
                        <span className="text-[9px] font-normal text-gray-500 normal-case mt-0.5">
                          {rangeObj.formattedRange}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

          </thead>

          <tbody className="divide-y divide-gray-200 text-xs">
            {filteredRows.map((row, idx) => (
              <tr key={row.studentName || idx} className={`transition-colors ${idx % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/40 hover:bg-blue-50/30'}`}>
                
                {/* Student Name Sticky Cell */}
                <td className={`py-3 px-4 font-bold text-gray-900 sticky left-0 border-r border-gray-200 z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-google-blue font-bold text-[11px] flex items-center justify-center shrink-0 border border-blue-200">
                      {getInitials(row.studentName) || 'ST'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate max-w-[180px] text-xs text-gray-900" title={row.fullFolderName || row.studentName}>
                        {row.studentName}
                      </span>
                      {row.fullFolderName && row.fullFolderName !== row.studentName && (
                        <span className="text-[10px] text-gray-400 font-normal truncate max-w-[180px]" title={row.fullFolderName}>
                          {row.fullFolderName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Hierarchical Column Cells */}
                {flattenedCols.map(col => {
                  const cellData = row.submissions[col.key];
                  const deadlineIso = weekDeadlines[col.subfolder] || weekDeadlines[col.category];

                  if (!cellData) {
                    return (
                      <td key={col.key} className="py-3 px-2 text-center border-r border-gray-200 text-gray-300">
                        <span className="text-sm font-light">&mdash;</span>
                      </td>
                    );
                  }

                  if (cellData.isFolderEmpty) {
                    return (
                      <td key={col.key} className="py-2 px-2 text-center border-r border-gray-200 bg-rose-50/30">
                        <span
                          className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                          title={`Folder "${col.subfolder}" exists in "${col.category}" but is EMPTY (0 files uploaded)`}
                        >
                          <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>Empty</span>
                        </span>
                      </td>
                    );
                  }

                  // Check if files are late
                  const firstFile = cellData.files[0];
                  const fileDateIso = firstFile?.dateIso || firstFile?.date;
                  const statusInfo = getSubmissionStatus(fileDateIso, deadlineIso);
                  const isLate = statusInfo.isLate;

                  return (
                    <td
                      key={col.key}
                      onClick={() => setSelectedCell({ student: row.studentName, category: col.category, subfolder: col.subfolder, cellData, isLate, statusInfo })}
                      className={`py-2 px-2 text-center border-r border-gray-200 cursor-pointer transition-all hover:ring-2 hover:ring-google-blue/40 ${
                        isLate ? 'bg-amber-50/40 hover:bg-amber-100/50' : 'bg-emerald-50/20 hover:bg-emerald-100/40'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        
                        {/* Compact Badge */}
                        {isLate ? (
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100/80 text-amber-900 border border-amber-300 shadow-2xs"
                            title={`Uploaded late after deadline (${statusInfo.daysLate} working days late)`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{statusInfo.label}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-300 shadow-2xs"
                            title="Submitted on time"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{cellData.files.length === 1 ? '1 file' : `${cellData.files.length} files`}</span>
                          </span>
                        )}

                        {/* Standard View: Upload Date */}
                        {viewDensity !== 'compact' && firstFile?.date && (
                          <span className="text-[9px] text-gray-500 font-medium mt-1 whitespace-nowrap">
                            {firstFile.date.replace(/, 202\d/, '')}
                          </span>
                        )}

                        {/* Detailed View: File Name */}
                        {viewDensity === 'detailed' && firstFile?.name && (
                          <span className="text-[9px] text-google-blue font-semibold truncate max-w-[110px] mt-0.5 underline" title={firstFile.name}>
                            {firstFile.name}
                          </span>
                        )}

                      </div>
                    </td>
                  );
                })}

                {/* Submitted Total Count */}
                <td className="py-3 px-3 text-center border-r border-gray-200 font-bold text-emerald-700 bg-emerald-50/20">
                  {row.submittedCount}
                </td>

                {/* Empty Folders Count */}
                <td className="py-3 px-3 text-center font-bold text-rose-700 bg-rose-50/20">
                  {row.emptyCount}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="p-3.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 font-medium text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Green = On Time Submission</span>
          </div>
          <div className="flex items-center space-x-1.5 font-bold text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>L = Late Submission</span>
          </div>
          <div className="flex items-center space-x-1.5 font-medium text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Empty = Missing Work</span>
          </div>
        </div>

        <span className="text-xs text-gray-500 font-semibold">
          Showing {filteredRows.length} of {matrixRows.length} Students &bull; <span className="text-google-blue">Click any cell for file preview</span>
        </span>
      </div>

      {/* Cell Detail Preview Modal with Breadcrumbs */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-5 relative animate-in fade-in zoom-in duration-150">
            
            <button
              onClick={() => setSelectedCell(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2.5 rounded-xl ${selectedCell.isLate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {selectedCell.isLate ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{selectedCell.student}</h4>
                <div className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                  <span className="text-gray-700 font-semibold">{selectedCell.category}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className="text-google-blue font-bold">{selectedCell.subfolder}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Submission Status:</span>
                {selectedCell.isLate ? (
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    {selectedCell.statusInfo.label}
                  </span>
                ) : (
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ On Time
                  </span>
                )}
              </div>

              <div className="border-t border-gray-200 pt-2 space-y-2">
                <span className="text-gray-500 block font-semibold">Uploaded Files ({selectedCell.cellData.files.length}):</span>
                {selectedCell.cellData.files.map((file, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="overflow-hidden">
                      <div className="font-semibold text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>🕒 {file.date}</span>
                        {file.size && <span>&bull; {file.size}</span>}
                      </div>
                    </div>

                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-google-blue hover:bg-google-hover text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
            >
              Close Preview
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
