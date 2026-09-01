import React from 'react';
import { formatDate } from '../utils/driveUrlParser';

export default function StatsCards({ stats, rootFolder, scannedAt }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      
      {/* Student / Subfolder count */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-black text-google-blue leading-tight">{stats.studentFoldersCount}</div>
        <div className="text-xs font-bold text-gray-600 mt-1">Student Folders</div>
      </div>

      {/* Total Files Uploaded */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-black text-gray-900 leading-tight">{stats.totalFilesFound}</div>
        <div className="text-xs font-bold text-gray-600 mt-1">Files Uploaded</div>
      </div>

      {/* Submitted Folders */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-black text-[#48bb78] leading-tight">{stats.submittedFoldersCount}</div>
        <div className="text-xs font-bold text-gray-600 mt-1">Folders with Submissions</div>
      </div>

      {/* Empty / Missing Folders */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-black text-[#f56565] leading-tight">{stats.emptyFoldersCount}</div>
        <div className="text-xs font-bold text-gray-600 mt-1">Empty / Missing Folders</div>
      </div>

      {/* Root Folder & Last Scanned */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-0 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
        <div className="text-xs font-black text-gray-900 truncate max-w-full" title={rootFolder?.name}>
          {rootFolder?.name || 'Drive Scan'}
        </div>
        <div className="text-[11px] font-semibold text-gray-500 truncate max-w-full mt-1" title={scannedAt ? formatDate(scannedAt) : ''}>
          {scannedAt ? formatDate(scannedAt) : 'Just now'}
        </div>
      </div>

    </div>
  );
}
