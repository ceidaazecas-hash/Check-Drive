import React, { useState } from 'react';

function TreeNode({ node, level = 0 }) {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto expand top 2 levels

  const isFolder = node.type === 'folder';
  const isEmptyFolder = isFolder && (node.isEmpty || (!node.children || node.children.length === 0));

  return (
    <div className="select-none text-xs">
      <div
        className={`flex items-center space-x-2 py-1.5 px-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-0 ${
          isEmptyFolder ? 'bg-rose-50 text-rose-800' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => isFolder && setIsOpen(!isOpen)}
      >
        {isFolder ? (
          <>
            <span className="font-mono text-gray-500 font-bold text-[11px] w-4">
              {isOpen ? '[-]' : '[+]'}
            </span>
            <span className={`font-black ${isEmptyFolder ? 'text-rose-800' : 'text-gray-900'}`}>
              {node.name}
            </span>

            {isEmptyFolder && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#f56565] text-white border-0 shadow-2xs">
                EMPTY FOLDER
              </span>
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <span className="text-gray-800 font-bold truncate">{node.name}</span>
            {node.owner && <span className="text-[10px] text-gray-400 font-medium">({node.owner})</span>}
            {node.time && <span className="text-[10px] text-gray-400 font-medium ml-auto">{node.time}</span>}
            {node.webViewLink && (
              <a
                href={node.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 bg-google-blue text-white rounded font-bold text-[10px] hover:bg-google-hover border-0 ml-1"
                title="Open in Drive"
              >
                Open
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
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 mb-6 border-0">
      <h3 className="text-base font-black text-gray-900 mb-1">
        Interactive Drive Hierarchy Inspector
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Expand or collapse folders to inspect nested files and pinpoint empty submission directories.
      </p>

      <div className="bg-gray-50 rounded-2xl p-3 max-h-[500px] overflow-y-auto border-0">
        <TreeNode node={tree} level={0} />
      </div>
    </div>
  );
}
