import React from 'react';
import {
  Shield,
  PanelRightOpen,
  PanelRightClose,
  Terminal,
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import type { NavbarProps } from '../../types';

/**
 * Navbar — top navigation bar with glassmorphism styling.
 *
 * Features:
 * - AeroCode logo and title with gradient text
 * - Air-Gapped Status badge
 * - Sidebar toggle button
 */
const Navbar: React.FC<NavbarProps> = ({
  status,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <nav className="relative z-50 flex h-14 items-center justify-between border-b border-white/10 bg-[#0d0d14]/80 px-5 backdrop-blur-xl">
      {/* Left — Logo & Title */}
      <div className="flex items-center gap-3">
        {/* Logo icon */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
          <Terminal className="h-4 w-4 text-white" />
        </div>

        {/* Title */}
        <div className="flex flex-col">
          <h1 className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-sm font-bold tracking-wide text-transparent">
            AeroCode
          </h1>
          <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
            Air-Gapped AI
          </span>
        </div>

        {/* Separator */}
        <div className="mx-2 h-6 w-px bg-white/10" />

        {/* Security badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Shield className="h-3 w-3" />
          <span>Secure</span>
        </div>
      </div>

      {/* Center — Status */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <StatusBadge status={status} />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
          title={isSidebarOpen ? 'Close AI Panel' : 'Open AI Panel'}
        >
          {isSidebarOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
