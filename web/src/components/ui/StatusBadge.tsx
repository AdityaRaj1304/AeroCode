import React from 'react';
import type { StatusBadgeProps } from '../../types';

/**
 * StatusBadge — displays the Air-Gapped status with an animated indicator.
 *
 * - Green pulsing dot + "Air-Gapped" when model is loaded
 * - Amber pulsing dot + loading percentage when loading
 * - Gray dot + "Offline" when no model is available
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, paranoid }) => {
  // If the model is not yet loaded, we can show a minimal loading state
  if (status.loadProgress > 0 && status.loadProgress < 100) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-500/10 bg-amber-500/5 px-3 py-1.5 transition-all">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
        <span className="font-mono text-[11px] text-amber-400/90">
          LOADING: {status.loadProgress}%
        </span>
      </div>
    );
  }

  // If offline
  if (!status.modelLoaded) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-slate-500/10 bg-slate-500/5 px-3 py-1.5 transition-all">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span className="font-mono text-[11px] text-slate-400">OFFLINE</span>
      </div>
    );
  }

  // Air-Gapped (Loaded)
  const bytesOut = paranoid ? (paranoid.bytesLeaked / 1024).toFixed(2) : '0.00';
  
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/5 bg-[#0d0d14] px-3 py-1.5 shadow-sm transition-all">
      <span className="h-[6px] w-[6px] rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      <span className="font-mono text-[11px] font-medium text-slate-300">
        AIR-GAPPED: {bytesOut} KB OUTBOUND
      </span>
    </div>
  );
};

export default StatusBadge;
