import React from 'react';
import { Users, FileText, CheckCircle2, AlertTriangle, Clock, Folder } from 'lucide-react';
import { formatDate } from '../utils/driveUrlParser';

export default function StatsCards({ stats, rootFolder, scannedAt }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      
      {/* Student / Subfolder count */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center space-x-3">
        <div className="p-2.5 rounded-lg bg-blue-50 text-google-blue">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-gray-900 leading-tight">{stats.studentFoldersCount}</div>
          <div className="text-[11px] font-medium text-gray-500">Student Folders</div>
        </div>
      </div>

      {/* Total Files Uploaded */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center space-x-3">
        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-gray-900 leading-tight">{stats.totalFilesFound}</div>
          <div className="text-[11px] font-medium text-gray-500">Files Uploaded</div>
        </div>
      </div>

      {/* Submitted Folders */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center space-x-3">
        <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-green-700 leading-tight">{stats.submittedFoldersCount}</div>
          <div className="text-[11px] font-medium text-gray-500">Folders with Submissions</div>
        </div>
      </div>

      {/* Empty / Missing Folders */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center space-x-3">
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-extrabold text-rose-700 leading-tight">{stats.emptyFoldersCount}</div>
          <div className="text-[11px] font-medium text-gray-500">Empty / Missing Folders</div>
        </div>
      </div>

      {/* Root Folder & Last Scanned */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center space-x-3 col-span-2 md:col-span-1">
        <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-900 truncate" title={rootFolder?.name}>
            {rootFolder?.name || 'Drive Scan'}
          </div>
          <div className="text-[11px] text-gray-500 truncate" title={scannedAt ? formatDate(scannedAt) : ''}>
            {scannedAt ? formatDate(scannedAt) : 'Just now'}
          </div>
        </div>
      </div>

    </div>
  );
}
