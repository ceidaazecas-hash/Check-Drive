import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Search, User, Calendar, Folder, ArrowUpDown, AlertTriangle, CheckCircle2, Check } from 'lucide-react';
import { exportFilesToCSV } from '../utils/csvExporter';
import { getSubmissionStatus } from '../utils/weekDeadlineManager';

export default function FileDetailsTable({ files, rootFolderName, weekDeadlines = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'on_time', 'late'
  const [sortField, setSortField] = useState('modifiedTime'); // 'name', 'ownerName', 'modifiedTime', 'size'
  const [sortOrder, setSortOrder] = useState('desc');

  if (!files || files.length === 0) return null;

  // Extract unique student names for filtering
  const studentNames = Array.from(new Set(files.map(f => f.studentName).filter(Boolean)));

  // Filter files
  const filteredFiles = files.filter(file => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      file.name.toLowerCase().includes(searchLower) ||
      file.ownerName.toLowerCase().includes(searchLower) ||
      (file.ownerEmail && file.ownerEmail.toLowerCase().includes(searchLower)) ||
      file.folderPath.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;
    if (studentFilter !== 'all' && file.studentName !== studentFilter) return false;

    // Status filter
    if (statusFilter !== 'all') {
      const deadlineIso = weekDeadlines[file.milestone];
      const statusInfo = getSubmissionStatus(file.createdTime || file.modifiedTime, deadlineIso);
      if (statusFilter === 'late' && !statusInfo.isLate) return false;
      if (statusFilter === 'on_time' && statusInfo.isLate) return false;
    }

    return true;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (sortField === 'size') {
      aVal = Number(a.size) || 0;
      bVal = Number(b.size) || 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-google-blue" />
            Detailed File Submissions List ({filteredFiles.length})
          </h3>
          <p className="text-xs text-gray-500">
            Audit file upload timestamps, submitter email, folder location, and late submission (L) status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files, submitter, location..."
              className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-1 focus:ring-google-blue min-w-[200px]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Student Filter */}
          {studentNames.length > 0 && (
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:ring-1 focus:ring-google-blue"
            >
              <option value="all">All Students ({studentNames.length})</option>
              {studentNames.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:ring-1 focus:ring-google-blue"
          >
            <option value="all">All Statuses</option>
            <option value="on_time">On Time Only</option>
            <option value="late">Late (L) Only</option>
          </select>

          {/* CSV Export */}
          <button
            onClick={() => exportFilesToCSV(sortedFiles, rootFolderName)}
            className="px-3 py-1.5 bg-google-blue hover:bg-google-hover text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Files Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100/80 text-[11px] font-bold text-gray-700 border-b border-gray-200 uppercase tracking-wider">
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200/70 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>File Name</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('ownerName')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200/70 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Submitted By</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('modifiedTime')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200/70 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Upload Date & Time</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4">Drive Location Path</th>
              <th
                onClick={() => toggleSort('size')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200/70 transition-colors text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Size</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Drive Link</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-xs">
            {sortedFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 font-medium">
                  No submission files match your search criteria.
                </td>
              </tr>
            ) : (
              sortedFiles.map((file, idx) => {
                const deadlineIso = weekDeadlines[file.milestone];
                const statusInfo = getSubmissionStatus(file.createdTime || file.modifiedTime, deadlineIso);

                return (
                  <tr key={file.id || idx} className="hover:bg-blue-50/30 transition-colors">
                    
                    {/* File Name */}
                    <td className="py-3 px-4 font-semibold text-gray-900 max-w-[220px]">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-google-blue flex-shrink-0" />
                        <span className="truncate" title={file.name}>{file.name}</span>
                      </div>
                    </td>

                    {/* Submitter Owner */}
                    <td className="py-3 px-4 text-gray-800">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5 font-medium">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[140px]">{file.ownerName}</span>
                        </div>
                        {file.ownerEmail && (
                          <span className="text-[10px] text-gray-400 pl-4 truncate max-w-[140px]">
                            {file.ownerEmail}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{file.modifiedTimeFormatted || file.createdTimeFormatted}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {statusInfo.isLate ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#f6ad55] text-white border-0 shadow-2xs">
                          <span>{statusInfo.label}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#48bb78] text-white border border-[#38a169] shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3] text-white" />
                          <span>On Time</span>
                        </span>
                      )}
                    </td>

                    {/* Location / Folder Breadcrumb */}
                    <td className="py-3 px-4 text-gray-600 max-w-[240px]">
                      <div className="flex items-center space-x-1.5">
                        <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="truncate text-[11px]" title={file.folderPath}>
                          {file.folderPath}
                        </span>
                      </div>
                    </td>

                    {/* File Size */}
                    <td className="py-3 px-4 text-right text-gray-600 font-mono text-[11px]">
                      {file.formattedSize}
                    </td>

                    {/* Direct Link */}
                    <td className="py-3 px-4 text-center">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 hover:bg-google-blue hover:text-white text-gray-700 rounded-md text-[11px] font-semibold transition-colors"
                        title="Open file in Google Drive"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-right">
        Showing {sortedFiles.length} of {files.length} total files discovered
      </div>

    </div>
  );
}
