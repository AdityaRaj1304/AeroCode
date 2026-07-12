import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CollapsiblePanelProps } from '../../types';

/**
 * CollapsiblePanel — a reusable container that expands/collapses with animation.
 */
const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="border-b border-white/5">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-indigo-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
        <span>{title}</span>
      </button>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
};

export default CollapsiblePanel;
