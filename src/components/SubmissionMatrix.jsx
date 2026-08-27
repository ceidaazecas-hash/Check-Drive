import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText, Download, Search, Info, ExternalLink } from 'lucide-react';
import { exportMatrixToCSV } from '../utils/csvExporter';

export default function SubmissionMatrix({ matrixRows, milestones, rootFolderName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'missing', 'completed'
  const [activeTooltipCell, setActiveTooltipCell] = useState(null);

  if (!matrixRows || matrixRows.length === 0) return null;

  // Filter rows by search term and submission status
  const filteredRows = matrixRows.filter(row => {
    const matchesSearch = row.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'missing') return row.emptyCount > 0;
    if (filterStatus === 'completed') return row.emptyCount === 0;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Submission Audit Matrix
          </h3>
          <p className="text-xs text-gray-500">
            Overview of student subfolders vs weekly milestone folders. Identifies submitted files vs empty folders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter student name..."
              className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-1 focus:ring-google-blue"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Filter dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:ring-1 focus:ring-google-blue"
          >
            <option value="all">All Students</option>
            <option value="missing">With Missing Work</option>
            <option value="completed">All Submitted</option>
          </select>

          {/* Export button */}
          <button
            onClick={() => exportMatrixToCSV(matrixRows, milestones, rootFolderName)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            title="Download matrix report as CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Matrix CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-gray-100/80 text-[11px] font-bold text-gray-700 border-b border-gray-200 uppercase tracking-wider">
              <th className="py-3 px-4 sticky left-0 bg-gray-100 border-r border-gray-200 z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Student Subfolder
              </th>
              {milestones.map(m => (
                <th key={m} className="py-3 px-3 border-r border-gray-200 text-center min-w-[110px]">
                  {m}
                </th>
              ))}
              <th className="py-3 px-3 text-center min-w-[90px]">Submitted</th>
              <th className="py-3 px-3 text-center min-w-[90px]">Empty</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-xs">
            {filteredRows.map((row, idx) => (
              <tr key={row.studentName} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                
                {/* Student Folder Name */}
                <td className="py-3 px-4 font-semibold text-gray-900 sticky left-0 bg-white border-r border-gray-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[210px]" title={row.studentName}>{row.studentName}</span>
                    {row.email && (
                      <span className="text-[10px] text-gray-400 font-normal truncate max-w-[210px]">{row.email}</span>
                    )}
                  </div>
                </td>

                {/* Milestone columns */}
                {milestones.map(milestone => {
                  const cellData = row.submissions[milestone];
                  const cellKey = `${row.studentName}-${milestone}`;

                  if (!cellData) {
                    return (
                      <td key={milestone} className="py-3 px-2 text-center border-r border-gray-200 text-gray-400">
                        <span className="text-[10px] text-gray-300">-</span>
                      </td>
                    );
                  }

                  if (cellData.isFolderEmpty) {
                    return (
                      <td key={milestone} className="py-2.5 px-2 text-center border-r border-gray-200 bg-rose-50/40">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200" title="Folder exists but is EMPTY (0 files uploaded)">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Empty</span>
                        </span>
                      </td>
                    );
                  }

                  // Submitted files
                  return (
                    <td key={milestone} className="py-2.5 px-2 text-center border-r border-gray-200 bg-emerald-50/30 relative">
                      <div className="flex flex-col items-center justify-center">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{cellData.files.length} file{cellData.files.length > 1 ? 's' : ''}</span>
                        </span>

                        {/* File detail preview snippet */}
                        {cellData.files[0] && (
                          <span
                            className="text-[9px] text-gray-500 hover:text-google-blue truncate max-w-[100px] cursor-pointer mt-0.5 block"
                            title={`${cellData.files[0].name} (${cellData.files[0].date})`}
                          >
                            {cellData.files[0].name}
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

      {/* Footer hint */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-google-blue" />
          <span>Green badges indicate submitted files. Red <span className="font-semibold text-rose-700">Empty</span> badges flag missing work in expected milestone folders.</span>
        </div>
        <span className="font-semibold text-gray-700">{filteredRows.length} Student Folders</span>
      </div>

    </div>
  );
}
