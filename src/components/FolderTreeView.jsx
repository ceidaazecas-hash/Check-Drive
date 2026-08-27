import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, ExternalLink, AlertCircle } from 'lucide-react';

function TreeNode({ node, level = 0 }) {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto expand top 2 levels

  const isFolder = node.type === 'folder';
  const isEmptyFolder = isFolder && (node.isEmpty || (!node.children || node.children.length === 0));

  return (
    <div className="select-none text-xs">
      <div
        className={`flex items-center space-x-2 py-1.5 px-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
          isEmptyFolder ? 'bg-rose-50/50 text-rose-800' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => isFolder && setIsOpen(!isOpen)}
      >
        {isFolder ? (
          <>
            <button className="p-0.5 text-gray-400 hover:text-gray-700">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {isOpen ? (
              <FolderOpen className={`w-4 h-4 ${isEmptyFolder ? 'text-rose-500' : 'text-amber-500'}`} />
            ) : (
              <Folder className={`w-4 h-4 ${isEmptyFolder ? 'text-rose-500' : 'text-amber-500'}`} />
            )}
            <span className={`font-semibold ${isEmptyFolder ? 'text-rose-800 font-bold' : 'text-gray-900'}`}>
              {node.name}
            </span>

            {isEmptyFolder && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                EMPTY FOLDER
              </span>
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 h-3.5" /> {/* spacing alignment */}
            <FileText className="w-4 h-4 text-google-blue flex-shrink-0" />
            <span className="text-gray-800 font-medium truncate">{node.name}</span>
            {node.owner && <span className="text-[10px] text-gray-400 font-normal">({node.owner})</span>}
            {node.time && <span className="text-[10px] text-gray-400 font-normal ml-auto">{node.time}</span>}
            {node.webViewLink && (
              <a
                href={node.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-google-blue p-0.5"
                title="Open in Drive"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </>
        )}
      </div>

      {isFolder && isOpen && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((childNode, idx) => (
            <TreeNode key={childNode.id || childNode.name || idx} node={childNode} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTreeView({ tree }) {
  if (!tree) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
      <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-amber-500" />
        Interactive Drive Hierarchy Inspector
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Expand or collapse folders to inspect nested files and pinpoint empty submission directories.
      </p>

      <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3 max-h-[500px] overflow-y-auto">
        <TreeNode node={tree} level={0} />
      </div>
    </div>
  );
}
