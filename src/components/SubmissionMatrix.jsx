import React, { useState } from 'react';
import { Download, Search, LayoutGrid, Table, CreditCard, Filter, X, ExternalLink } from 'lucide-react';
import { exportMatrixToExcel } from '../utils/csvExporter';
import { getSubmissionStatus } from '../utils/weekDeadlineManager';
import { formatDate } from '../utils/driveUrlParser';
import { cleanStudentFolderName } from '../services/driveApi';

const SOLID_CATEGORY_THEMES = [
  { name: 'purple', solidBg: 'bg-[#805ad5]', hoverBg: 'hover:bg-[#6b46c1]', tileContainer: 'bg-purple-50/50 border-purple-200/60' },
  { name: 'pink', solidBg: 'bg-[#d53f8c]', hoverBg: 'hover:bg-[#b83280]', tileContainer: 'bg-pink-50/50 border-pink-200/60' },
  { name: 'teal', solidBg: 'bg-[#319795]', hoverBg: 'hover:bg-[#234e52]', tileContainer: 'bg-teal-50/50 border-teal-200/60' },
  { name: 'orange', solidBg: 'bg-[#dd6b20]', hoverBg: 'hover:bg-[#c05621]', tileContainer: 'bg-orange-50/50 border-orange-200/60' },
  { name: 'indigo', solidBg: 'bg-[#4c51bf]', hoverBg: 'hover:bg-[#3c366b]', tileContainer: 'bg-indigo-50/50 border-indigo-200/60' },
  { name: 'cyan', solidBg: 'bg-[#008080]', hoverBg: 'hover:bg-[#005555]', tileContainer: 'bg-cyan-50/50 border-cyan-200/60' }
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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [layoutMode, setLayoutMode] = useState('table'); // 'heatmap' (0-scroll), 'cards' (0-scroll), 'table' (full)
  const [tableDetailMode, setTableDetailMode] = useState('detailed'); // 'compact', 'standard', 'detailed'
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

  // Filter groups by active category
  const visibleGroups = activeCategoryFilter === 'all'
    ? groups
    : groups.filter(g => g.categoryName === activeCategoryFilter);

  const visibleFlattenedCols = visibleGroups.flatMap(g => g.columns);

  // Filter rows by search term and submission status
  const filteredRows = matrixRows.filter(row => {
    const cleanName = cleanStudentFolderName(row.studentName);
    const matchesSearch =
      cleanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.fullFolderName && row.fullFolderName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'missing') return row.emptyCount > 0;
    if (filterStatus === 'completed') return row.emptyCount === 0;
    return true;
  });

  // Get initials for avatar
  const getInitials = (name) => {
    const cleanName = cleanStudentFolderName(name);
    return cleanName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 w-full">
      
      {/* Top Header & View Mode Switcher */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/70">
        <div>
          <h3 className="text-base font-bold text-gray-900">Submission Audit Matrix</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Main Folder &gt; Subfolder / Milestone with file names and timestamps.
          </p>
        </div>

        {/* View Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name..."
              className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-google-blue focus:border-google-blue min-w-[170px]"
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

          {/* Table Detail Density Toggle (when in Full Table view) */}
          {layoutMode === 'table' && (
            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-bold border-0 shadow-2xs">
              <button
                onClick={() => setTableDetailMode('compact')}
                className={`px-2.5 py-1 rounded-lg transition-all ${tableDetailMode === 'compact' ? 'bg-white text-google-blue shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'}`}
                title="Show solid status badges only"
              >
                Badges Only
              </button>
              <button
                onClick={() => setTableDetailMode('standard')}
                className={`px-2.5 py-1 rounded-lg transition-all ${tableDetailMode === 'standard' ? 'bg-white text-google-blue shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'}`}
                title="Show status badges + upload timestamps"
              >
                + Time
              </button>
              <button
                onClick={() => setTableDetailMode('detailed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${tableDetailMode === 'detailed' ? 'bg-white text-google-blue shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'}`}
                title="Show status badges + exact file names + timestamps"
              >
                + Files & Time
              </button>
            </div>
          )}

          {/* Layout Mode Selector (Zero Scroll Heatmap, Cards, Table) */}
          <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-bold border-0 shadow-2xs">
            <button
              onClick={() => setLayoutMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                layoutMode === 'table' ? 'bg-white text-google-blue shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Expanded 2-tier full table view with files & timestamps"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Full Table</span>
            </button>

            <button
              onClick={() => setLayoutMode('heatmap')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                layoutMode === 'heatmap' ? 'bg-white text-google-blue shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Fit all 18+ weeks on screen on one line with ZERO horizontal scroll!"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fit Screen (0 Scroll)</span>
            </button>

            <button
              onClick={() => setLayoutMode('cards')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                layoutMode === 'cards' ? 'bg-white text-google-blue shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Student card view with completion progress bars and zero horizontal scroll"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Student Cards</span>
            </button>
          </div>

          {/* Export Excel (.xlsx) button */}
          <button
            onClick={() => exportMatrixToExcel(matrixRows, visibleFlattenedCols, rootFolderName, weekDeadlines)}
            className="px-3.5 py-1.5 bg-[#48bb78] hover:bg-[#38a169] text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm transition-all border-0"
            title="Download formatted Excel (.xlsx) with Summary and Detailed (Files & Time) sheets"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills (Clean, Centered, No Icons, No Emojis, No Outlines) */}
      {groups.length > 1 && (
        <div className="px-4 py-3 bg-gray-50/90 border-b border-gray-200 flex items-center justify-center gap-2 overflow-x-auto text-xs">
          <span className="text-gray-500 font-bold mr-1 shrink-0">
            Category:
          </span>

          {/* All Folders Button */}
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all text-xs shrink-0 border-0 shadow-2xs text-center justify-center ${
              activeCategoryFilter === 'all'
                ? 'bg-[#1a73e8] text-white shadow-sm ring-2 ring-blue-300'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Folders ({visibleFlattenedCols.length})
          </button>

          {/* Individual Category Buttons */}
          {groups.map((g, idx) => {
            const theme = SOLID_CATEGORY_THEMES[idx % SOLID_CATEGORY_THEMES.length];
            const isSelected = activeCategoryFilter === g.categoryName;
            return (
              <button
                key={g.categoryName}
                onClick={() => setActiveCategoryFilter(g.categoryName)}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 shrink-0 border-0 shadow-2xs text-white text-center ${theme.solidBg} ${theme.hoverBg} ${
                  isSelected
                    ? 'ring-2 ring-gray-900 shadow-md scale-105'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <span>{g.categoryName}</span>
                <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-md text-[10px] font-black">
                  {g.columns.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: EXPANDED 2-TIER FULL TABLE (With Detailed Files & Time)          */}
      {/* ========================================================================= */}
      {layoutMode === 'table' && (
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full text-center border-collapse min-w-[950px]">
            <thead className="sticky top-0 z-20 shadow-xs">
              
              {/* Tier 1: Parent Category Headers (Clean Centered, No Icons) */}
              <tr className="border-b border-gray-200 text-xs font-extrabold tracking-wide uppercase">
                <th
                  rowSpan={2}
                  className="py-3.5 px-4 sticky left-0 bg-gray-100 border-r border-gray-200 z-30 w-64 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] align-middle text-gray-900 text-center"
                >
                  Student Name
                </th>

                {visibleGroups.map((group, gIdx) => {
                  const theme = SOLID_CATEGORY_THEMES[gIdx % SOLID_CATEGORY_THEMES.length];
                  return (
                    <th
                      key={group.categoryName}
                      colSpan={group.columns.length}
                      className={`py-2.5 px-3 border-r border-white/20 text-center ${theme.solidBg} text-white font-black tracking-wider text-[11px]`}
                    >
                      <div className="flex items-center justify-center text-center">
                        <span>{group.categoryName}</span>
                      </div>
                    </th>
                  );
                })}

                <th rowSpan={2} className="py-3 px-3 text-center min-w-[85px] bg-[#48bb78] text-white font-black align-middle border-r border-gray-200">
                  Submitted
                </th>
                <th rowSpan={2} className="py-3 px-3 text-center min-w-[85px] bg-[#f56565] text-white font-black align-middle">
                  Empty
                </th>
              </tr>

              {/* Tier 2: Subfolder Headers */}
              <tr className="bg-gray-50/95 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider text-center">
                {visibleFlattenedCols.map(col => {
                  const rangeObj = rangeLookup[col.subfolder] || rangeLookup[col.category];
                  return (
                    <th key={col.key} className="py-2 px-2 border-r border-gray-200 text-center min-w-[130px]">
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="font-bold text-gray-800 text-center">{col.subfolder}</span>
                        {rangeObj && (
                          <span className="text-[9px] font-normal text-gray-500 normal-case mt-0.5 text-center">
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
              {filteredRows.map((row, idx) => {
                const cleanName = cleanStudentFolderName(row.studentName);
                return (
                  <tr key={row.studentName || idx} className={`transition-colors ${idx % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/40 hover:bg-blue-50/30'}`}>
                    
                    {/* Student Name Sticky Cell with Running Marquee Text */}
                    <td className={`py-3 px-4 font-bold text-gray-900 sticky left-0 border-r border-gray-200 z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-google-blue font-bold text-[11px] flex items-center justify-center shrink-0 border border-blue-200">
                          {getInitials(row.studentName) || 'ST'}
                        </div>
                        <div className="flex flex-col overflow-hidden max-w-[180px] text-center">
                          <div className="running-text-container text-center">
                            <span className="font-bold text-xs text-gray-900 running-text text-center" title={row.fullFolderName || cleanName}>
                              {cleanName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Hierarchical Column Cells */}
                    {visibleFlattenedCols.map(col => {
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
                          <td key={col.key} className="py-2.5 px-2 text-center border-r border-gray-200 bg-rose-50/30">
                            <span
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#f56565] text-white border-0 shadow-2xs text-center"
                              title={`Main Folder: ${col.category} | Subfolder: ${col.subfolder} | Status: EMPTY (0 files uploaded)`}
                            >
                              Empty
                            </span>
                          </td>
                        );
                      }

                      // Check if files are late
                      const firstFile = cellData.files[0];
                      const fileDateIso = firstFile?.dateIso || firstFile?.date || firstFile?.time;
                      const statusInfo = getSubmissionStatus(fileDateIso, deadlineIso);
                      const isLate = statusInfo.isLate;
                      const uploadTimeFormatted = firstFile?.date || firstFile?.time || (firstFile?.dateIso ? formatDate(firstFile.dateIso) : '');

                      return (
                        <td
                          key={col.key}
                          onClick={() => setSelectedCell({ student: cleanName, category: col.category, subfolder: col.subfolder, cellData, isLate, statusInfo })}
                          className={`py-2 px-2 text-center border-r border-gray-200 cursor-pointer transition-all hover:ring-2 hover:ring-google-blue/40 ${
                            isLate ? 'bg-amber-50/40 hover:bg-amber-100/50' : 'bg-emerald-50/20 hover:bg-emerald-100/40'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center py-1 text-center">
                            
                            {/* Solid Status Badge */}
                            {isLate ? (
                              <span
                                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#f6ad55] text-white border-0 shadow-2xs text-center"
                                title={`Main Folder: ${col.category} | Subfolder: ${col.subfolder} | Uploaded late (${statusInfo.daysLate} working days late)`}
                              >
                                {statusInfo.label}
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#48bb78] text-white border-0 shadow-2xs text-center"
                                title={`Main Folder: ${col.category} | Subfolder: ${col.subfolder} | Submitted on time`}
                              >
                                {cellData.files.length === 1 ? '1 file' : `${cellData.files.length} files`}
                              </span>
                            )}

                            {/* Detailed View: File Name with Running Marquee Text */}
                            {tableDetailMode === 'detailed' && firstFile?.name && (
                              <a
                                href={firstFile.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[9.5px] font-bold text-google-blue hover:text-blue-800 hover:underline max-w-[125px] block mt-1.5 shadow-2xs bg-blue-50/90 px-1.5 py-0.5 rounded border border-blue-200/70 overflow-hidden text-center justify-center"
                                title={`Open ${firstFile.name} in Google Drive`}
                              >
                                <div className="running-text-container text-center">
                                  <span className="running-text text-center">{firstFile.name}</span>
                                </div>
                              </a>
                            )}

                            {/* Standard & Detailed View: Upload Date & Time */}
                            {tableDetailMode !== 'compact' && uploadTimeFormatted && (
                              <span className="text-[9px] text-gray-500 font-mono mt-1 whitespace-nowrap text-center">
                                {uploadTimeFormatted.replace(/, 202\d/, '')}
                              </span>
                            )}

                          </div>
                        </td>
                      );
                    })}

                    {/* Submitted Total Count */}
                    <td className="py-3 px-3 text-center border-r border-gray-200 font-bold text-[#48bb78] bg-emerald-50/20">
                      {row.submittedCount}
                    </td>

                    {/* Empty Folders Count */}
                    <td className="py-3 px-3 text-center font-bold text-[#f56565] bg-rose-50/20">
                      {row.emptyCount}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: ZERO-HORIZONTAL-SCROLL FIT-SCREEN HEATMAP                         */}
      {/* ========================================================================= */}
      {layoutMode === 'heatmap' && (
        <div className="w-full divide-y divide-gray-200">
          
          {/* 2-Tier Header Bar above Heatmap (Centered, No Icons) */}
          <div className="bg-gray-100/90 border-b border-gray-200 text-xs select-none">
            
            {/* Tier 1: Main Parent Folder Category Bar */}
            <div className="flex items-center justify-center p-2 px-4 gap-2 border-b border-gray-200/80">
              <span className="w-52 shrink-0 font-extrabold text-gray-700 text-xs uppercase tracking-wider text-center">
                Student Name ({filteredRows.length})
              </span>

              {/* Grouped Parent Category Blocks */}
              <div className="flex-1 flex items-center justify-center gap-2">
                {visibleGroups.map((group, gIdx) => {
                  const theme = SOLID_CATEGORY_THEMES[gIdx % SOLID_CATEGORY_THEMES.length];
                  return (
                    <div
                      key={group.categoryName}
                      style={{ flex: group.columns.length }}
                      className={`py-1 px-2 rounded-lg border-0 ${theme.solidBg} text-white text-[11px] font-black text-center truncate flex items-center justify-center shadow-2xs`}
                      title={`Main Folder: ${group.categoryName} (${group.columns.length} subfolders)`}
                    >
                      <span className="truncate text-center">{group.categoryName}</span>
                    </div>
                  );
                })}
              </div>

              <span className="w-20 text-center shrink-0 font-extrabold text-gray-700 text-xs uppercase tracking-wider">
                Progress
              </span>
            </div>

            {/* Tier 2: Subfolder Labels Bar & Legend */}
            <div className="flex items-center justify-center p-1.5 px-4 gap-2 text-[10px] font-bold text-gray-500 bg-gray-50">
              <div className="w-52 shrink-0 flex items-center justify-center gap-1.5">
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#48bb78] text-white font-extrabold text-[9px] shadow-2xs text-center">
                  On Time
                </span>
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#f6ad55] text-white font-extrabold text-[9px] shadow-2xs text-center">
                  Late
                </span>
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#f56565] text-white font-extrabold text-[9px] shadow-2xs text-center">
                  Missing
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center gap-2">
                {visibleGroups.map((group, gIdx) => (
                  <div key={group.categoryName} style={{ flex: group.columns.length }} className="flex gap-1 justify-center">
                    {group.columns.map(col => (
                      <div
                        key={col.key}
                        className="flex-1 min-w-[22px] max-w-[42px] text-center running-tile-container text-[9px] text-gray-600 font-bold"
                        title={`${group.categoryName} > ${col.subfolder}`}
                      >
                        <span className="running-tile-text text-center">
                          {col.subfolder.replace(/Week\s+/i, 'W')}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <span className="w-20 text-center shrink-0 text-gray-400">Rate</span>
            </div>

          </div>

          {/* Student Rows */}
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {filteredRows.map((row, rIdx) => {
              const cleanName = cleanStudentFolderName(row.studentName);
              const totalItems = visibleFlattenedCols.length;
              const submittedCount = visibleFlattenedCols.filter(col => {
                const cell = row.submissions[col.key];
                return cell && !cell.isFolderEmpty;
              }).length;
              const pct = totalItems > 0 ? Math.round((submittedCount / totalItems) * 100) : 0;

              return (
                <div
                  key={row.studentName || rIdx}
                  className="p-2.5 px-4 flex items-center justify-between gap-2 hover:bg-blue-50/30 transition-colors text-center"
                >
                  
                  {/* Student Name with Running Marquee Text on Hover */}
                  <div className="w-52 shrink-0 flex items-center justify-center space-x-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-google-blue font-bold text-[11px] flex items-center justify-center shrink-0 border border-blue-200">
                      {getInitials(row.studentName) || 'ST'}
                    </div>
                    <div className="flex flex-col overflow-hidden max-w-[160px] text-center">
                      <div className="running-text-container text-center">
                        <span className="font-bold text-xs text-gray-900 running-text text-center" title={row.fullFolderName || cleanName}>
                          {cleanName}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 text-center">
                        {submittedCount} / {totalItems} completed
                      </span>
                    </div>
                  </div>

                  {/* Category Grouped Milestone Tiles */}
                  <div className="flex-1 flex items-center justify-center gap-2">
                    {visibleGroups.map((group, gIdx) => {
                      const theme = SOLID_CATEGORY_THEMES[gIdx % SOLID_CATEGORY_THEMES.length];
                      return (
                        <div
                          key={group.categoryName}
                          style={{ flex: group.columns.length }}
                          className={`p-1 rounded-xl border ${theme.tileContainer} flex gap-1 justify-center`}
                        >
                          {group.columns.map(col => {
                            const cellData = row.submissions[col.key];
                            const deadlineIso = weekDeadlines[col.subfolder] || weekDeadlines[col.category];

                            if (!cellData) {
                              return (
                                <div
                                  key={col.key}
                                  className="flex-1 min-w-[20px] max-w-[40px] h-8 rounded-lg bg-gray-200/90 border border-gray-300/60 flex items-center justify-center text-[10px] text-gray-400 font-bold text-center"
                                  title={`Main Folder: ${col.category} | Subfolder: ${col.subfolder} | Status: Not assigned`}
                                >
                                  &mdash;
                                </div>
                              );
                            }

                            // Empty Submission: Solid Baby Red
                            if (cellData.isFolderEmpty) {
                              return (
                                <button
                                  key={col.key}
                                  onClick={() => setSelectedCell({ student: cleanName, category: col.category, subfolder: col.subfolder, cellData, isLate: false, statusInfo: { label: 'Empty' } })}
                                  className="flex-1 min-w-[20px] max-w-[40px] h-8 rounded-lg bg-[#f56565] hover:bg-[#e53e3e] border-0 flex flex-col items-center justify-center text-white font-extrabold text-[10px] transition-all shadow-2xs cursor-pointer hover:scale-105 running-tile-container text-center"
                                  title={`Main Folder: ${col.category} | Subfolder: ${col.subfolder} | Status: EMPTY (0 files uploaded)`}
                                >
                                  <span className="text-[10px] font-black leading-none">X</span>
                                  <div className="running-tile-container max-w-full px-0.5 text-center">
                                    <span className="text-[7.5px] text-white/90 leading-none running-tile-text font-bold text-center">
                                      {col.subfolder.replace(/Week\s+/i, 'W')}
                                    </span>
                                  </div>
                                </button>
                              );
                            }

                            // Check if files are late
                            const firstFile = cellData.files[0];
                            const fileDateIso = firstFile?.dateIso || firstFile?.date;
                            const statusInfo = getSubmissionStatus(fileDateIso, deadlineIso);
                            const isLate = statusInfo.isLate;

                            // Late: Solid Baby Yellow
                            // On Time: Solid Baby Green
                            return (
                              <button
                                key={col.key}
                                onClick={() => setSelectedCell({ student: cleanName, category: col.category, subfolder: col.subfolder, cellData, isLate, statusInfo })}
                                className={`flex-1 min-w-[20px] max-w-[40px] h-8 rounded-lg flex flex-col items-center justify-center font-extrabold text-[10px] transition-all shadow-2xs border-0 cursor-pointer hover:scale-105 running-tile-container text-center ${
                                  isLate
                                    ? 'bg-[#f6ad55] hover:bg-[#ed8936] text-white'
                                    : 'bg-[#48bb78] hover:bg-[#38a169] text-white'
                                }`}
                                title={`Main Folder: ${col.category} | Subfolder: ${col.subfolder} | Status: ${isLate ? `Late (${statusInfo.label})` : 'Submitted On Time'} | File: ${firstFile?.name || ''} | Uploaded: ${firstFile?.date || ''}`}
                              >
                                <span className="text-[10px] font-black leading-none">
                                  {isLate ? 'L' : 'OK'}
                                </span>
                                <div className="running-tile-container max-w-full px-0.5 text-center">
                                  <span className="text-[7.5px] text-white/90 leading-none running-tile-text font-bold text-center">
                                    {col.subfolder.replace(/Week\s+/i, 'W')}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Completion Rate Progress */}
                  <div className="w-20 shrink-0 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className={`text-xs font-extrabold ${pct === 100 ? 'text-[#48bb78]' : pct >= 75 ? 'text-blue-700' : 'text-[#f6ad55]'}`}>
                        {pct}%
                      </span>
                      <div className="w-14 bg-gray-200 rounded-full h-1.5 mt-0.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct === 100 ? 'bg-[#48bb78]' : pct >= 75 ? 'bg-google-blue' : 'bg-[#f6ad55]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: STUDENT ACCORDION CARDS                                           */}
      {/* ========================================================================= */}
      {layoutMode === 'cards' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto bg-gray-50/50">
          {filteredRows.map((row, idx) => {
            const cleanName = cleanStudentFolderName(row.studentName);
            const totalItems = visibleFlattenedCols.length;
            const submittedCount = visibleFlattenedCols.filter(col => {
              const cell = row.submissions[col.key];
              return cell && !cell.isFolderEmpty;
            }).length;
            const emptyCount = totalItems - submittedCount;
            const pct = totalItems > 0 ? Math.round((submittedCount / totalItems) * 100) : 0;

            return (
              <div
                key={row.studentName || idx}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Header with Running Text on Hover */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-google-blue font-black text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                        {getInitials(row.studentName) || 'ST'}
                      </div>
                      <div className="overflow-hidden max-w-[200px]">
                        <div className="running-text-container">
                          <h4 className="font-bold text-sm text-gray-900 running-text" title={row.fullFolderName || cleanName}>
                            {cleanName}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold shrink-0 border-0 ${
                      pct === 100
                        ? 'bg-[#48bb78] text-white'
                        : pct >= 60
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-[#f6ad55] text-white'
                    }`}>
                      {pct}% Done
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden border border-gray-200">
                    <div
                      className={`h-full rounded-full ${pct === 100 ? 'bg-[#48bb78]' : 'bg-google-blue'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Category Breakdown Badges */}
                  <div className="space-y-2">
                    {visibleGroups.map((group, gIdx) => {
                      const theme = SOLID_CATEGORY_THEMES[gIdx % SOLID_CATEGORY_THEMES.length];
                      return (
                        <div key={group.categoryName} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="text-[10px] font-extrabold text-white uppercase tracking-wider mb-1.5 flex items-center justify-center">
                            <span className={`px-2 py-0.5 rounded-md ${theme.solidBg} text-center`}>
                              {group.categoryName}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {group.columns.map(col => {
                              const cellData = row.submissions[col.key];
                              const deadlineIso = weekDeadlines[col.subfolder] || weekDeadlines[col.category];

                              if (!cellData) {
                                return (
                                  <span key={col.key} className="px-2 py-0.5 rounded bg-gray-200 text-gray-400 text-[10px] font-bold text-center">
                                    {col.subfolder}: —
                                  </span>
                                );
                              }

                              if (cellData.isFolderEmpty) {
                                return (
                                  <button
                                    key={col.key}
                                    onClick={() => setSelectedCell({ student: cleanName, category: col.category, subfolder: col.subfolder, cellData, isLate: false, statusInfo: { label: 'Empty' } })}
                                    className="px-2 py-0.5 rounded bg-[#f56565] hover:bg-[#e53e3e] text-white border-0 text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs text-center"
                                  >
                                    <span>{col.subfolder}: Empty</span>
                                  </button>
                                );
                              }

                              const firstFile = cellData.files[0];
                              const fileDateIso = firstFile?.dateIso || firstFile?.date;
                              const statusInfo = getSubmissionStatus(fileDateIso, deadlineIso);
                              const isLate = statusInfo.isLate;

                              return (
                                <button
                                  key={col.key}
                                  onClick={() => setSelectedCell({ student: cleanName, category: col.category, subfolder: col.subfolder, cellData, isLate, statusInfo })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs border-0 text-center ${
                                    isLate
                                      ? 'bg-[#f6ad55] hover:bg-[#ed8936] text-white'
                                      : 'bg-[#48bb78] hover:bg-[#38a169] text-white'
                                  }`}
                                >
                                  <span>{col.subfolder}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Summary */}
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold text-center">
                  <span className="text-[#48bb78] font-bold">{submittedCount} Submitted</span>
                  <span className="text-[#f56565] font-bold">{emptyCount} Missing</span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Footer Legend (Clean, Centered, No Emojis) */}
      <div className="p-3.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex flex-wrap items-center justify-center gap-6 text-center">
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-1.5 font-bold text-gray-800">
            <span className="w-3.5 h-3.5 rounded bg-[#48bb78] flex items-center justify-center text-white text-[9px] font-black">OK</span>
            <span>Solid Baby Green = On Time</span>
          </div>
          <div className="flex items-center space-x-1.5 font-bold text-gray-800">
            <span className="w-3.5 h-3.5 rounded bg-[#f6ad55] flex items-center justify-center text-white text-[9px] font-black">L</span>
            <span>Solid Baby Yellow = Late</span>
          </div>
          <div className="flex items-center space-x-1.5 font-bold text-gray-800">
            <span className="w-3.5 h-3.5 rounded bg-[#f56565] flex items-center justify-center text-white text-[9px] font-black">X</span>
            <span>Solid Baby Red = Missing</span>
          </div>
        </div>

        <span className="text-xs text-gray-500 font-semibold text-center">
          Showing {filteredRows.length} of {matrixRows.length} Students &bull; Click any cell for complete file details
        </span>
      </div>

      {/* Cell Detail Preview Modal with Breadcrumbs */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-5 relative animate-in fade-in zoom-in duration-150 text-center">
            
            <button
              onClick={() => setSelectedCell(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center justify-center space-y-2 mb-3 text-center">
              <div className={`px-4 py-1.5 rounded-xl font-black text-sm text-white ${
                selectedCell.isLate
                  ? 'bg-[#f6ad55]'
                  : selectedCell.cellData.isFolderEmpty
                  ? 'bg-[#f56565]'
                  : 'bg-[#48bb78]'
              }`}>
                {selectedCell.isLate ? 'Late' : selectedCell.cellData.isFolderEmpty ? 'Missing / Empty' : 'Submitted On Time'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{selectedCell.student}</h4>
                <div className="text-xs text-gray-500 font-medium mt-0.5 text-center">
                  <span className="text-gray-700 font-semibold">{selectedCell.category}</span>
                  {' > '}
                  <span className="text-google-blue font-bold">{selectedCell.subfolder}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 space-y-2 text-xs text-center">
              <div className="border-t border-gray-200 pt-2 space-y-2">
                <span className="text-gray-500 block font-semibold text-center">Uploaded Files ({selectedCell.cellData.files.length}):</span>
                {selectedCell.cellData.files.length === 0 ? (
                  <div className="text-gray-400 italic text-center py-2">No files uploaded to this folder yet.</div>
                ) : (
                  selectedCell.cellData.files.map((file, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between gap-2 shadow-2xs text-left">
                      <div className="overflow-hidden">
                        <div className="font-semibold text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{file.date}</span>
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
                  ))
                )}
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
