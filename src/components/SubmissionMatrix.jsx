import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, Download, Search, Info, Clock, AlertTriangle, ExternalLink,
  User, Folder, ChevronRight, X, LayoutGrid, Table, CreditCard, Filter, ChevronDown, Check
} from 'lucide-react';
import { exportMatrixToCSV } from '../utils/csvExporter';
import { getSubmissionStatus } from '../utils/weekDeadlineManager';

const CATEGORY_THEMES = [
  { name: 'blue', bg: 'bg-blue-50/90', headerBg: 'bg-blue-100/70', border: 'border-blue-200', text: 'text-blue-900', pill: 'bg-blue-50 text-blue-800 border-blue-200' },
  { name: 'purple', bg: 'bg-purple-50/90', headerBg: 'bg-purple-100/70', border: 'border-purple-200', text: 'text-purple-900', pill: 'bg-purple-50 text-purple-800 border-purple-200' },
  { name: 'emerald', bg: 'bg-emerald-50/90', headerBg: 'bg-emerald-100/70', border: 'border-emerald-200', text: 'text-emerald-900', pill: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { name: 'amber', bg: 'bg-amber-50/90', headerBg: 'bg-amber-100/70', border: 'border-amber-200', text: 'text-amber-900', pill: 'bg-amber-50 text-amber-800 border-amber-200' },
  { name: 'indigo', bg: 'bg-indigo-50/90', headerBg: 'bg-indigo-100/70', border: 'border-indigo-200', text: 'text-indigo-900', pill: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
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
  const [layoutMode, setLayoutMode] = useState('heatmap'); // 'heatmap' (0-scroll), 'cards' (0-scroll), 'table' (full)
  const [viewDensity, setViewDensity] = useState('compact'); // 'compact', 'standard', 'detailed'
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 w-full">
      
      {/* Top Header & View Mode Switcher */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/70">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">Submission Audit Matrix</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Track student submissions across all folders. Toggle layout below to fit all columns without scrolling!
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

          {/* Layout Mode Selector (Zero Scroll Heatmap, Cards, Table) */}
          <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-bold border border-gray-300/60 shadow-2xs">
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

            <button
              onClick={() => setLayoutMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                layoutMode === 'table' ? 'bg-white text-google-blue shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Expanded 2-tier full table view"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Full Table</span>
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={() => exportMatrixToCSV(matrixRows, visibleFlattenedCols.map(c => c.key), rootFolderName, weekDeadlines)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
            title="Download clean matrix report as CSV/Excel (Submitted, Late, Empty)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills (Focus on 1 Category without horizontal scroll) */}
      {groups.length > 1 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-gray-500 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gray-400" />
            Category:
          </span>
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
              activeCategoryFilter === 'all'
                ? 'bg-google-blue text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            All Folders ({visibleFlattenedCols.length})
          </button>
          {groups.map((g, idx) => {
            const theme = CATEGORY_THEMES[idx % CATEGORY_THEMES.length];
            const isSelected = activeCategoryFilter === g.categoryName;
            return (
              <button
                key={g.categoryName}
                onClick={() => setActiveCategoryFilter(g.categoryName)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                    : `${theme.bg} ${theme.text} ${theme.border} hover:opacity-80`
                }`}
              >
                <span>{g.categoryName}</span>
                <span className="opacity-60 text-[10px]">({g.columns.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: ZERO-HORIZONTAL-SCROLL FIT-SCREEN HEATMAP (The user's favorite!) */}
      {/* ========================================================================= */}
      {layoutMode === 'heatmap' && (
        <div className="w-full divide-y divide-gray-200">
          
          {/* Column Names Bar */}
          <div className="p-3 bg-gray-100/90 border-b border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-600">
            <span className="w-52 shrink-0">Student ({filteredRows.length})</span>
            <div className="flex-1 flex items-center justify-end gap-1 overflow-hidden px-2">
              <span className="text-[10px] text-gray-400 font-medium mr-2 hidden md:inline">
                Hover or click any tile for file details &rarr;
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ✓ On Time
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                L Late
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                ✕ Missing
              </span>
            </div>
            <span className="w-20 text-right shrink-0">Progress</span>
          </div>

          {/* Student Rows */}
          <div className="divide-y divide-gray-100 max-h-[72vh] overflow-y-auto">
            {filteredRows.map((row, rIdx) => {
              const totalItems = visibleFlattenedCols.length;
              const submittedCount = visibleFlattenedCols.filter(col => {
                const cell = row.submissions[col.key];
                return cell && !cell.isFolderEmpty;
              }).length;
              const pct = totalItems > 0 ? Math.round((submittedCount / totalItems) * 100) : 0;

              return (
                <div
                  key={row.studentName || rIdx}
                  className="p-2.5 px-4 flex items-center justify-between gap-2 hover:bg-blue-50/30 transition-colors"
                >
                  
                  {/* Student Name */}
                  <div className="w-52 shrink-0 flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-google-blue font-bold text-[11px] flex items-center justify-center shrink-0 border border-blue-200">
                      {getInitials(row.studentName) || 'ST'}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-xs text-gray-900 truncate" title={row.fullFolderName || row.studentName}>
                        {row.studentName}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">
                        {submittedCount} / {totalItems} completed
                      </span>
                    </div>
                  </div>

                  {/* All Milestone Tiles (Fitting 100% horizontally on screen with NO SCROLL!) */}
                  <div className="flex-1 flex items-center justify-end gap-1 flex-wrap sm:flex-nowrap">
                    {visibleFlattenedCols.map((col, cIdx) => {
                      const cellData = row.submissions[col.key];
                      const deadlineIso = weekDeadlines[col.subfolder] || weekDeadlines[col.category];

                      if (!cellData) {
                        return (
                          <div
                            key={col.key}
                            className="flex-1 min-w-[24px] max-w-[42px] h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-300 font-bold"
                            title={`${col.category} > ${col.subfolder}: Not assigned`}
                          >
                            &mdash;
                          </div>
                        );
                      }

                      if (cellData.isFolderEmpty) {
                        return (
                          <button
                            key={col.key}
                            onClick={() => setSelectedCell({ student: row.studentName, category: col.category, subfolder: col.subfolder, cellData, isLate: false, statusInfo: { label: 'Empty' } })}
                            className="flex-1 min-w-[24px] max-w-[42px] h-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 flex flex-col items-center justify-center text-rose-700 font-extrabold text-[10px] transition-all shadow-2xs group relative"
                            title={`${col.category} > ${col.subfolder}: EMPTY (0 files)`}
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span className="text-[8px] opacity-70 leading-none truncate max-w-full px-0.5">
                              {col.subfolder.replace(/Week\s+/i, 'W').slice(0, 4)}
                            </span>
                          </button>
                        );
                      }

                      // Check if files are late
                      const firstFile = cellData.files[0];
                      const fileDateIso = firstFile?.dateIso || firstFile?.date;
                      const statusInfo = getSubmissionStatus(fileDateIso, deadlineIso);
                      const isLate = statusInfo.isLate;

                      return (
                        <button
                          key={col.key}
                          onClick={() => setSelectedCell({ student: row.studentName, category: col.category, subfolder: col.subfolder, cellData, isLate, statusInfo })}
                          className={`flex-1 min-w-[24px] max-w-[42px] h-8 rounded-lg flex flex-col items-center justify-center font-extrabold text-[10px] transition-all shadow-2xs border cursor-pointer hover:scale-105 ${
                            isLate
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                          }`}
                          title={`${col.category} > ${col.subfolder}: ${isLate ? `Late (${statusInfo.label})` : 'Submitted On Time'}\nFile: ${firstFile?.name || ''}`}
                        >
                          {isLate ? (
                            <span className="text-[10px] font-black text-amber-800">L</span>
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-700" />
                          )}
                          <span className="text-[8px] opacity-70 leading-none truncate max-w-full px-0.5">
                            {col.subfolder.replace(/Week\s+/i, 'W').slice(0, 4)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Completion Rate Pill */}
                  <div className="w-20 shrink-0 text-right pl-2">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-extrabold ${pct === 100 ? 'text-emerald-700' : pct >= 75 ? 'text-blue-700' : 'text-amber-700'}`}>
                        {pct}%
                      </span>
                      <div className="w-14 bg-gray-200 rounded-full h-1.5 mt-0.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-google-blue' : 'bg-amber-500'}`}
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
      {/* MODE 2: STUDENT ACCORDION CARDS (Zero horizontal scroll, beautiful cards) */}
      {/* ========================================================================= */}
      {layoutMode === 'cards' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto bg-gray-50/50">
          {filteredRows.map((row, idx) => {
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
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-google-blue font-black text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                        {getInitials(row.studentName) || 'ST'}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-sm text-gray-900 truncate" title={row.fullFolderName || row.studentName}>
                          {row.studentName}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium truncate block">
                          {row.fullFolderName}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold shrink-0 border ${
                      pct === 100
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : pct >= 60
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {pct}% Done
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden border border-gray-200">
                    <div
                      className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-google-blue'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Category Breakdown Badges */}
                  <div className="space-y-2">
                    {visibleGroups.map((group, gIdx) => {
                      const theme = CATEGORY_THEMES[gIdx % CATEGORY_THEMES.length];
                      return (
                        <div key={group.categoryName} className={`p-2.5 rounded-xl border ${theme.bg} ${theme.border}`}>
                          <div className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>{group.categoryName}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {group.columns.map(col => {
                              const cellData = row.submissions[col.key];
                              const deadlineIso = weekDeadlines[col.subfolder] || weekDeadlines[col.category];

                              if (!cellData) {
                                return (
                                  <span key={col.key} className="px-2 py-0.5 rounded bg-gray-100 text-gray-400 text-[10px] font-medium">
                                    {col.subfolder}: —
                                  </span>
                                );
                              }

                              if (cellData.isFolderEmpty) {
                                return (
                                  <button
                                    key={col.key}
                                    onClick={() => setSelectedCell({ student: row.studentName, category: col.category, subfolder: col.subfolder, cellData, isLate: false, statusInfo: { label: 'Empty' } })}
                                    className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                                  >
                                    <XCircle className="w-3 h-3 text-rose-600" />
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
                                  onClick={() => setSelectedCell({ student: row.studentName, category: col.category, subfolder: col.subfolder, cellData, isLate, statusInfo })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs border ${
                                    isLate
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                                  }`}
                                >
                                  {isLate ? (
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  )}
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
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                  <span className="text-emerald-700">✓ {submittedCount} Submitted</span>
                  <span className="text-rose-700">✕ {emptyCount} Missing</span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: EXPANDED 2-TIER TABLE                                             */}
      {/* ========================================================================= */}
      {layoutMode === 'table' && (
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="sticky top-0 z-20 shadow-xs">
              
              {/* Tier 1: Parent Category Headers */}
              <tr className="border-b border-gray-200 text-xs font-extrabold tracking-wide uppercase">
                <th
                  rowSpan={2}
                  className="py-3.5 px-4 sticky left-0 bg-gray-100 border-r border-gray-200 z-30 w-64 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] align-middle text-gray-900"
                >
                  Student Name
                </th>

                {visibleGroups.map((group, gIdx) => {
                  const theme = CATEGORY_THEMES[gIdx % CATEGORY_THEMES.length];
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
                {visibleFlattenedCols.map(col => {
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

                          {viewDensity !== 'compact' && firstFile?.date && (
                            <span className="text-[9px] text-gray-500 font-medium mt-1 whitespace-nowrap">
                              {firstFile.date.replace(/, 202\d/, '')}
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
      )}

      {/* Footer Legend */}
      <div className="p-3.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 font-medium text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Green = On Time</span>
          </div>
          <div className="flex items-center space-x-1.5 font-bold text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>L = Late</span>
          </div>
          <div className="flex items-center space-x-1.5 font-medium text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Empty = Missing</span>
          </div>
        </div>

        <span className="text-xs text-gray-500 font-semibold">
          Showing {filteredRows.length} of {matrixRows.length} Students &bull; <span className="text-google-blue">Click any tile for file details</span>
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
