import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  FileSearch,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  Send,
  Shield,
  ClipboardCheck,
  Zap,
  Bug,
} from 'lucide-react';
import type {
  SidebarProps,
  SidebarTab,
  AIReviewResult,
  ChatMessage,
} from '../../types';

/**
 * Sidebar — right-hand collapsible AI panel.
 *
 * Features:
 * - Three tabs: Review, Explain, Chat
 * - Smooth slide animation (300ms)
 * - Review cards with severity indicators
 * - "Analyze Code" action button
 */
const Sidebar: React.FC<SidebarProps> = ({
  sidebarState,
  onTabChange,
  onClose,
  onAnalyze,
  onRefactor,
  onExplain,
  onRunComplianceAudit,
  onRunAutonomousLoop,
  onTestCodeChange,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages] = useState<ChatMessage[]>([]);

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'review', label: 'Review', icon: <FileSearch className="h-3.5 w-3.5" /> },
    { id: 'explain', label: 'Explain', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ];

  const getSeverityConfig = (severity: AIReviewResult['severity']) => {
    switch (severity) {
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/20',
        };
    }
  };

  return (
    <div
      className={`flex h-full flex-col border-l border-white/10 bg-[#0d0d14]/95 backdrop-blur-xl transition-all duration-300 ease-in-out ${
        sidebarState.isOpen
          ? 'w-[380px] min-w-[380px] opacity-100'
          : 'w-0 min-w-0 overflow-hidden opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-200 ${
              sidebarState.activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Review Tab */}
        {sidebarState.activeTab === 'review' && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={onAnalyze}
                disabled={sidebarState.isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sidebarState.isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <FileSearch className="h-4 w-4" />
                    Run Security Audit
                  </>
                )}
              </button>
              
              <button
                onClick={onRefactor}
                disabled={sidebarState.isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sidebarState.isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refactoring...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Refactor Code (Diff)
                  </>
                )}
              </button>
              
              <button
                onClick={onRunAutonomousLoop}
                disabled={sidebarState.isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sidebarState.isProcessing && sidebarState.loopProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Debugging...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4" />
                    Run Autonomous Debugger
                  </>
                )}
              </button>
            </div>

            {/* Test Input & Tracker */}
            <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/5 p-3">
              <label className="text-xs font-semibold text-slate-300">Unit Tests (expect syntax)</label>
              <textarea
                value={sidebarState.testCode || ''}
                onChange={(e) => onTestCodeChange?.(e.target.value)}
                placeholder="expect(myFunc(1)).toEqual(2)"
                className="min-h-[80px] w-full rounded border border-white/10 bg-black/50 p-2 text-xs font-mono text-emerald-400 placeholder-slate-600 outline-none focus:border-indigo-500/50"
              />
              
              {sidebarState.loopProgress && (
                <div className="mt-2 flex flex-col gap-2 rounded border border-indigo-500/20 bg-indigo-500/5 p-3">
                  <span className="text-xs font-medium text-indigo-300">Debugger Progress:</span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {sidebarState.loopProgress.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                    {sidebarState.loopProgress.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                    {['testing', 'analyzing', 'applying_patch'].includes(sidebarState.loopProgress.status) && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    )}
                    <span>{sidebarState.loopProgress.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Compliance Lenses (Horizontal Scroll) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              <button
                onClick={() => onRunComplianceAudit?.('owasp')}
                disabled={sidebarState.isProcessing}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10 px-3 py-1.5 text-[11px] font-medium text-orange-400 transition-all hover:border-orange-500/50 hover:from-red-500/20 hover:to-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Shield className="h-3.5 w-3.5" />
                OWASP Top 10
              </button>

              <button
                onClick={() => onRunComplianceAudit?.('soc2')}
                disabled={sidebarState.isProcessing}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-blue-500/30 bg-gradient-to-r from-sky-500/10 to-blue-500/10 px-3 py-1.5 text-[11px] font-medium text-blue-400 transition-all hover:border-blue-500/50 hover:from-sky-500/20 hover:to-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                SOC2 / PII Guard
              </button>

              <button
                onClick={() => onRunComplianceAudit?.('complexity')}
                disabled={sidebarState.isProcessing}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 px-3 py-1.5 text-[11px] font-medium text-fuchsia-400 transition-all hover:border-fuchsia-500/50 hover:from-purple-500/20 hover:to-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5" />
                Complexity Profiler
              </button>
            </div>

            {/* Review Cards */}
            {sidebarState.reviews.length === 0 && !sidebarState.isProcessing && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                  <FileSearch className="h-6 w-6 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">
                  Select code and click "Run Security Audit" or "Refactor Code" for insights
                </p>
              </div>
            )}

            {sidebarState.reviews.map((review, index) => {
              const config = getSeverityConfig(review.severity);
              return (
                <div
                  key={review.id}
                  className={`rounded-lg border ${config.border} ${config.bg} p-3 transition-all duration-300`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.4s ease-out forwards',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 ${config.color}`}>
                      {config.icon}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">
                        {review.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {review.content}
                      </p>
                      {review.lineRange && (
                        <span className="mt-2 inline-flex rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                          Lines {review.lineRange.start}–{review.lineRange.end}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Explain Tab */}
        {sidebarState.activeTab === 'explain' && (
          <div className="flex flex-col gap-3 p-4">
            <button
              onClick={onExplain}
              disabled={sidebarState.isProcessing}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:from-cyan-500 hover:to-teal-500 hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sidebarState.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Explaining...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Explain Logic
                </>
              )}
            </button>

            {sidebarState.reviews
              .filter((r) => r.type === 'explanation')
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4"
                >
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                    {item.content}
                  </pre>
                </div>
              ))}

            {sidebarState.reviews.filter((r) => r.type === 'explanation')
              .length === 0 &&
              !sidebarState.isProcessing && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <Sparkles className="h-6 w-6 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Select code and click "Explain" for a plain-language
                    breakdown
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Chat Tab */}
        {sidebarState.activeTab === 'chat' && (
          <div className="flex h-full flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <MessageSquare className="h-6 w-6 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Ask the AI anything about your code
                  </p>
                  <p className="text-xs text-slate-600">
                    All processing happens on-device
                  </p>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 rounded-lg p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-4 bg-indigo-500/10 text-indigo-200'
                      : 'mr-4 bg-white/5 text-slate-300'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-3">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your code..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      setChatInput('');
                    }
                  }}
                />
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-indigo-500/20 hover:text-indigo-400">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
