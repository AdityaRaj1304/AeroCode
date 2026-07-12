import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown } from 'lucide-react';
import type { FileSystemNode } from '../../types';

interface FileNodeProps {
  node: FileSystemNode;
  level: number;
  onOpenFile: (fileHandle: any, fileName: string) => void;
  activeHandleName?: string;
}

const FileNodeItem: React.FC<FileNodeProps> = ({ node, level, onOpenFile, activeHandleName }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isDir = node.kind === 'directory';
  const isActive = node.kind === 'file' && activeHandleName === node.name;

  const handleClick = () => {
    if (isDir) {
      setIsOpen(!isOpen);
    } else {
      onOpenFile(node.handle, node.name);
    }
  };

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1.5 px-2 py-1 transition-colors hover:bg-white/5 ${
          isActive ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-400 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isDir ? (
          isOpen ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : <ChevronRight className="h-3.5 w-3.5 opacity-70" />
        ) : (
          <span className="w-3.5" /> // Spacer for alignment
        )}
        
        {isDir ? (
          isOpen ? <FolderOpen className="h-3.5 w-3.5 text-indigo-400" /> : <Folder className="h-3.5 w-3.5 text-indigo-400" />
        ) : (
          <FileCode className="h-3.5 w-3.5 text-slate-500" />
        )}
        
        <span className="truncate text-xs">{node.name}</span>
      </div>

      {isDir && isOpen && node.children && (
        <div>
          {node.children.map((child, i) => (
            <FileNodeItem
              key={`${child.name}-${i}`}
              node={child}
              level={level + 1}
              onOpenFile={onOpenFile}
              activeHandleName={activeHandleName}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export interface FileExplorerProps {
  fileTree: FileSystemNode | null;
  onOpenDirectory: () => void;
  onOpenFile: (fileHandle: any, fileName: string) => void;
  activeHandleName?: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ fileTree, onOpenDirectory, onOpenFile, activeHandleName }) => {
  return (
    <div className="flex h-full w-64 flex-col border-r border-white/5 bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-4">
        <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Explorer</h2>
        <button
          onClick={onOpenDirectory}
          className="rounded hover:bg-white/10 p-1 text-slate-400 transition-colors hover:text-white"
          title="Open Folder"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
      </div>

      {/* File Tree Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {!fileTree ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Folder className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-xs">No folder opened.</p>
            <button
              onClick={onOpenDirectory}
              className="mt-4 rounded-md bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
            >
              Open Folder
            </button>
          </div>
        ) : (
          <div className="py-2">
            <div className="px-2 pb-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
              {fileTree.name}
            </div>
            {fileTree.children?.map((child, i) => (
              <FileNodeItem
                key={`${child.name}-${i}`}
                node={child}
                level={0}
                onOpenFile={onOpenFile}
                activeHandleName={activeHandleName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
