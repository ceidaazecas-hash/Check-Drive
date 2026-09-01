import React, { useState } from 'react';
import { exportFilesToCSV } from '../utils/csvExporter';
import { getSubmissionStatus } from '../utils/weekDeadlineManager';
import { cleanStudentFolderName } from '../services/driveApi';

export default function FileDetailsTable({ files, rootFolderName, weekDeadlines = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'on_time', 'late'
  const [sortField, setSortField] = useState('modifiedTime'); // 'name', 'ownerName', 'modifiedTime', 'size'
  const [sortOrder, setSortOrder] = useState('desc');

  if (!files || files.length === 0) return null;

  // Extract unique student names for filtering
  const studentNames = Array.from(new Set(files.map(f => cleanStudentFolderName(f.studentName || f.ownerName)))).filter(Boolean).sort();

  // Filter files
  const filteredFiles = files.filter(file => {
    const studentName = cleanStudentFolderName(file.studentName || file.ownerName);
    const matchesSearch =
      (file.name && file.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (studentName && studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.folderPath && file.folderPath.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.ownerEmail && file.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (studentFilter !== 'all' && studentName !== studentFilter) {
      return false;
    }

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
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'name' || sortField === 'ownerName') {
      valA = (valA || '').toLowerCase();
      valB = (valB || '').toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (sortField === 'modifiedTime' || sortField === 'createdTime') {
      const timeA = new Date(valA || 0).getTime();
      const timeB = new Date(valB || 0).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }

    if (sortField === 'size') {
      return sortOrder === 'asc' ? (a.size || 0) - (b.size || 0) : (b.size || 0) - (a.size || 0);
    }

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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border-0">
      
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/70">
        <div>
          <h3 className="text-base font-black text-gray-900">Detailed Files List</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {filteredFiles.length} of {files.length} Total Uploaded Files
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
              className="px-3.5 py-1.5 bg-gray-100 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-google-blue min-w-[200px] border-0 font-medium"
            />
          </div>

          {/* Student Filter */}
          {studentNames.length > 0 && (
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="bg-gray-100 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-bold border-0 focus:ring-2 focus:ring-google-blue cursor-pointer"
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
            className="bg-gray-100 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-bold border-0 focus:ring-2 focus:ring-google-blue cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="on_time">On Time Only</option>
            <option value="late">Late (L) Only</option>
          </select>

          {/* CSV Export */}
          <button
            onClick={() => exportFilesToCSV(sortedFiles, rootFolderName)}
            className="px-3.5 py-1.5 bg-google-blue hover:bg-google-hover text-white rounded-xl text-xs font-black shadow-xs transition-all border-0"
          >
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Files Table */}
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full text-center border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr className="text-[11px] font-black text-gray-700 uppercase tracking-wider text-center">
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors text-left"
              >
                <span>File Name</span>
              </th>
              <th
                onClick={() => toggleSort('ownerName')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors text-left"
              >
                <span>Student / Submitter</span>
              </th>
              <th
                onClick={() => toggleSort('modifiedTime')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors text-center"
              >
                <span>Uploaded Time</span>
              </th>
              <th className="py-3 px-4 text-center">
                <span>Status</span>
              </th>
              <th className="py-3 px-4 text-left">
                <span>Folder Path</span>
              </th>
              <th
                onClick={() => toggleSort('size')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors text-center"
              >
                <span>Size</span>
              </th>
              <th className="py-3 px-4 text-center">
                <span>Action</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs">
            {sortedFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 font-medium italic">
                  No submission files match your search criteria.
                </td>
              </tr>
            ) : (
              sortedFiles.map((file, idx) => {
                const deadlineIso = weekDeadlines[file.milestone];
                const statusInfo = getSubmissionStatus(file.createdTime || file.modifiedTime, deadlineIso);
                const studentName = cleanStudentFolderName(file.studentName || file.ownerName);

                return (
                  <tr key={file.id || idx} className="hover:bg-blue-50/30 transition-colors text-center">
                    
                    {/* File Name */}
                    <td className="py-3 px-4 font-bold text-gray-900 max-w-[220px] text-left">
                      <span className="truncate block" title={file.name}>{file.name}</span>
                    </td>

                    {/* Submitter Owner */}
                    <td className="py-3 px-4 text-gray-800 text-left">
                      <div className="flex flex-col">
                        <span className="font-bold truncate max-w-[160px]">{studentName}</span>
                        {file.ownerEmail && (
                          <span className="text-[10px] text-gray-400 truncate max-w-[160px]">
                            {file.ownerEmail}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap font-mono text-[11px] text-center">
                      <span>{file.modifiedTimeFormatted || file.createdTimeFormatted}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {statusInfo.isLate ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#f6ad55] text-white border-0 shadow-2xs">
                          <span>{statusInfo.label}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#48bb78] text-white border-0 shadow-2xs">
                          <span>On Time</span>
                        </span>
                      )}
                    </td>

                    {/* Location / Folder Breadcrumb */}
                    <td className="py-3 px-4 text-gray-600 max-w-[240px] text-left">
                      <span className="truncate text-[11px] block" title={file.folderPath}>
                        {file.folderPath}
                      </span>
                    </td>

                    {/* File Size */}
                    <td className="py-3 px-4 text-center text-gray-600 font-mono text-[11px]">
                      {file.formattedSize}
                    </td>

                    {/* Direct Link */}
                    <td className="py-3 px-4 text-center">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-1 bg-google-blue hover:bg-google-hover text-white rounded-lg text-[11px] font-bold transition-all border-0 shadow-2xs"
                        title="Open file in Google Drive"
                      >
                        <span>Open</span>
                      </a>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
