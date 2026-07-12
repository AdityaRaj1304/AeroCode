import React from 'react';
import type { StatusBadgeProps } from '../../types';

/**
 * StatusBadge — displays the Air-Gapped status with an animated indicator.
 *
 * - Green pulsing dot + "Air-Gapped" when model is loaded
 * - Amber pulsing dot + loading percentage when loading
 * - Gray dot + "Offline" when no model is available
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    if (status.modelLoaded) {
      return {
        dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
        pulseClass: 'animate-pulse',
        label: 'Air-Gapped',
        sublabel: status.modelName.split('-').slice(0, 2).join(' '),
        containerClass:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      };
    }

    if (status.loadProgress > 0 && status.loadProgress < 100) {
      return {
        dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
        pulseClass: 'animate-pulse',
        label: 'Loading Model',
        sublabel: `${status.loadProgress}%`,
        containerClass: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      };
    }

    return {
      dotClass: 'bg-slate-500',
      pulseClass: '',
      label: 'Offline',
      sublabel: 'No model',
      containerClass: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
    };
  };

  const config = getStatusConfig();

  return (
    <div
      className={`flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${config.containerClass}`}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5">
        {config.pulseClass && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass} ${config.pulseClass}`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dotClass}`}
        />
      </span>

      {/* Label */}
      <div className="flex flex-col leading-none">
        <span className="font-semibold tracking-wide">{config.label}</span>
        <span className="mt-0.5 text-[10px] opacity-70">
          {config.sublabel}
        </span>
      </div>
    </div>
  );
};

export default StatusBadge;
