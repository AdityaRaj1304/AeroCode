import React from 'react';
import {
  Shield,
  PanelRightOpen,
  PanelRightClose,
  Terminal,
  Cpu,
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import type { NavbarProps } from '../../types';

/**
 * Navbar — top navigation bar with glassmorphism styling.
 *
 * Features:
 * - AeroCode logo and title with gradient text
 * - Air-Gapped Status badge
 * - "Load Model" button that triggers INIT_MODEL
 * - Animated progress bar during model download
 * - Sidebar toggle button
 */
const Navbar: React.FC<NavbarProps> = ({
  status,
  onToggleSidebar,
  isSidebarOpen,
  onInitModel,
  paranoid,
}) => {
  const showLoadButton =
    !status.modelLoaded &&
    status.loadProgress === 0 &&
    !status.isOnline; // isOnline = isInitializing here

  const showProgress =
    status.isOnline && !status.modelLoaded && status.loadProgress > 0;

  return (
    <div className="relative z-50">
      <nav className="flex h-14 items-center justify-between border-b border-white/10 bg-[#0d0d14]/80 px-5 backdrop-blur-xl">
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
          <StatusBadge status={status} paranoid={paranoid} />
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          {/* Load Model button */}
          {showLoadButton && onInitModel && (
            <button
              onClick={onInitModel}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-indigo-200"
            >
              <Cpu className="h-3 w-3" />
              Load Model
            </button>
          )}

          {/* Loading indicator in navbar */}
          {status.isOnline && !status.modelLoaded && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
              <span className="hidden sm:inline">
                {status.loadProgress > 0
                  ? `${status.loadProgress}%`
                  : 'Starting...'}
              </span>
            </div>
          )}

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

      {/* Progress bar — thin line below navbar */}
      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${status.loadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Navbar;
