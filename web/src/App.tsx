import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/layout/Layout';
import { AlertTriangle } from 'lucide-react';
import { llmService } from './services/llmService';
import { networkMonitor } from './services/networkMonitor';
import type {
  AirGapStatus,
  EditorState,
  SidebarState,
  SidebarTab,
  CursorPosition,
  TelemetryPayload,
  ParanoidState,
  ComplianceLensType,
  LoopProgressPayload,
} from './types';

// ── Default editor code ──────────────────────────────────────

const DEFAULT_CODE = `// AeroCode — Air-Gapped AI Pair Programmer
//
// All processing executes entirely within the local device environment.
// No data is transmitted to external servers.
//
// 1. Click "Load Model" to initialize the local WebGPU engine.
// 2. Select code and click "Run Security Audit" for local analysis.

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
}

async function fetchUsers(apiUrl: string): Promise<User[]> {
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(\`Failed to fetch users: \${response.statusText}\`);
  }

  const data = await response.json();
  return data.users.map((user: Record<string, unknown>) => ({
    ...user,
    createdAt: new Date(user.createdAt as string),
  }));
}

function filterActiveAdmins(users: User[]): User[] {
  return users.filter((user) => user.role === 'admin');
}

// Example usage
const API_URL = 'https://api.example.com/v1';

fetchUsers(API_URL)
  .then(filterActiveAdmins)
  .then((admins) => {
    console.log(\`Found \${admins.length} admin users\`);
    admins.forEach((admin) => console.log(\`  → \${admin.name}\`));
  })
  .catch(console.error);
`;

// ── App Component ────────────────────────────────────────────

function App() {
  // ── Air-Gap Status ─────────────────────────────────────────
  const [status, setStatus] = useState<AirGapStatus>({
    isOnline: false,     // repurposed: true while initializing
    modelLoaded: false,
    modelName: llmService.modelName,
    loadProgress: 0,
    lastSync: null,
  });

  // ── Editor State ───────────────────────────────────────────
  const [editorState, setEditorState] = useState<EditorState>({
    language: 'typescript',
    value: DEFAULT_CODE,
    theme: 'aerocode-dark',
    fileName: 'example.ts',
    cursorPosition: { line: 1, column: 1 },
  });

  // ── Sidebar State ──────────────────────────────────────────
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isOpen: true,
    activeTab: 'review',
    reviews: [],
    isProcessing: false,
  });

  // ── WebGPU Error State ─────────────────────────────────────
  const [gpuError, setGpuError] = useState<string | null>(null);

  // ── Telemetry & Paranoid Mode ──────────────────────────────
  const [telemetryState, setTelemetryState] = useState<TelemetryPayload | undefined>();
  const [paranoidState, setParanoidState] = useState<ParanoidState>({
    isActive: false,
    externalApiCalls: 0,
    bytesLeaked: 0,
  });

  // ── Ref to avoid stale closures ────────────────────────────
  const initCalledRef = useRef(false);

  // ── Wire up LLM service callbacks ─────────────────────────
  useEffect(() => {
    // Progress callback — streams model download % to the UI
    llmService.onProgress = (progress: number, message: string) => {
      setStatus((prev) => ({
        ...prev,
        loadProgress: progress,
        modelName: message.length > 60 ? message.slice(0, 57) + '...' : message,
      }));
    };

    // WebGPU not supported callback
    llmService.onWebGPUError = (error: string, suggestion: string) => {
      console.warn('[AeroCode] WebGPU unsupported:', error);
      setGpuError(`${error}\n\n${suggestion}`);
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        loadProgress: 0,
      }));
    };

    llmService.onTelemetry = (payload: TelemetryPayload) => {
      setTelemetryState(payload);
    };

    networkMonitor.onActivity = (calls: number, bytes: number) => {
      setParanoidState((prev) => ({
        ...prev,
        externalApiCalls: calls,
        bytesLeaked: bytes,
      }));
    };

    llmService.onLoopProgress = (payload: LoopProgressPayload) => {
      setSidebarState((prev) => ({
        ...prev,
        loopProgress: payload,
        isProcessing: payload.status !== 'success' && payload.status !== 'failed',
      }));

      // If success, we want to pop open the Diff Editor with the new code
      if (payload.status === 'success' && payload.code) {
        setEditorState((prev) => ({
          ...prev,
          showDiff: true,
          modifiedValue: payload.code,
        }));
      }
    };

    return () => {
      llmService.dispose();
    };
  }, []);

  // ── Model Initialization ───────────────────────────────────

  const handleInitModel = useCallback(async () => {
    if (initCalledRef.current || llmService.isReady) return;
    initCalledRef.current = true;

    setStatus((prev) => ({
      ...prev,
      isOnline: true,
      loadProgress: 0,
      modelName: 'Starting download...',
    }));
    setGpuError(null);

    try {
      await llmService.initialize();
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        modelLoaded: true,
        modelName: llmService.modelName,
        loadProgress: 100,
        lastSync: new Date(),
      }));
    } catch (err) {
      console.error('[AeroCode] Model init failed:', err);
      initCalledRef.current = false;
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        loadProgress: 0,
        modelName: llmService.modelName,
      }));
    }
  }, []);

  // ── Editor Handlers ────────────────────────────────────────

  const handleEditorChange = useCallback((value: string | undefined) => {
    setEditorState((prev) => ({
      ...prev,
      value: value ?? '',
    }));
  }, []);

  const handleCursorChange = useCallback((position: CursorPosition) => {
    setEditorState((prev) => ({ ...prev, cursorPosition: position }));
  }, []);

  const handleSelectionChange = useCallback((selection: any) => {
    setEditorState((prev) => ({ ...prev, selection }));
  }, []);

  const handleToggleDiff = useCallback(() => {
    setEditorState((prev) => ({ ...prev, showDiff: !prev.showDiff }));
  }, []);

  // ── Sidebar Handlers ───────────────────────────────────────

  const handleToggleSidebar = useCallback(() => {
    setSidebarState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  const handleTabChange = useCallback((tab: SidebarTab) => {
      setSidebarState((prev) => ({
        ...prev,
        activeTab: tab,
      }));
    }, []);
  
    const handleTestCodeChange = useCallback((testCode: string) => {
      setSidebarState((prev) => ({
        ...prev,
        testCode,
      }));
    }, []);

  // ── Analyze / Explain (Worker-backed) ──────────────────────

  const handleAnalyzeCode = useCallback(async () => {
    if (!editorState.value.trim()) return;
    if (editorState.selection && !editorState.selection.text.trim()) return;

    setSidebarState((prev) => ({ ...prev, isProcessing: true }));

    const reviews = await llmService.reviewCode(
      editorState.value,
      editorState.language,
      editorState.selection?.text
    );

    setSidebarState((prev) => ({
      ...prev,
      reviews,
      isProcessing: false,
      isOpen: true,
      activeTab: 'review',
    }));
  }, [editorState]);

  const handleExplainCode = useCallback(async () => {
    if (!editorState.value.trim()) return;
    if (editorState.selection && !editorState.selection.text.trim()) return;

    setSidebarState((prev) => ({
      ...prev,
      isProcessing: true,
      isOpen: true,
      activeTab: 'explain',
      explanationStream: '',
    }));

    try {
      await llmService.explainCode(
        editorState.value,
        editorState.language,
        editorState.selection?.text,
        (token) => {
          setSidebarState((prev) => ({
            ...prev,
            explanationStream: (prev.explanationStream || '') + token,
          }));
        }
      );
    } catch (error) {
      console.error('Explanation failed:', error);
      setSidebarState((prev) => ({
        ...prev,
        explanationStream: 'Error generating explanation.',
      }));
    } finally {
      setSidebarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [editorState]);

  const handleRefactorCode = useCallback(async () => {
    if (!editorState.value.trim()) return;

    setSidebarState((prev) => ({
      ...prev,
      isProcessing: true,
      isOpen: true,
      activeTab: 'review',
    }));

    setEditorState((prev) => ({
      ...prev,
      showDiff: true,
      modifiedValue: '',
    }));

    try {
      await llmService.refactorCode(
        editorState.value,
        editorState.language,
        editorState.selection?.text,
        (token) => {
          setEditorState((prev) => ({
            ...prev,
            modifiedValue: (prev.modifiedValue || '') + token,
          }));
        }
      );
    } catch (error) {
      console.error('Refactoring failed:', error);
    } finally {
      setSidebarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [editorState]);

  const handleRunComplianceAudit = useCallback(async (lensType: ComplianceLensType) => {
    if (!editorState.value.trim()) return;
    if (editorState.selection && !editorState.selection.text.trim()) return;

    setSidebarState((prev) => ({ ...prev, isProcessing: true }));

    const reviews = await llmService.runComplianceAudit(
      editorState.value,
      editorState.language,
      lensType,
      editorState.selection?.text
    );

    setSidebarState((prev) => ({
      ...prev,
      reviews,
      isProcessing: false,
      isOpen: true,
      activeTab: 'review',
    }));
  }, [editorState]);

  const handleRunAutonomousLoop = useCallback(async () => {
    if (!editorState.value.trim() || !sidebarState.testCode?.trim()) return;

    setSidebarState((prev) => ({ 
      ...prev, 
      isProcessing: true, 
      isOpen: true,
      activeTab: 'review',
      loopProgress: { status: 'testing', attempt: 1, maxAttempts: 3, message: 'Starting...' }
    }));

    await llmService.runAutonomousLoop(
      editorState.value,
      editorState.language,
      sidebarState.testCode
    );
  }, [editorState, sidebarState.testCode]);

  const handleToggleParanoid = useCallback(() => {
    setParanoidState((prev) => {
      const nextActive = !prev.isActive;
      networkMonitor.isActive = nextActive;
      return {
        isActive: nextActive,
        externalApiCalls: networkMonitor.stats.calls,
        bytesLeaked: networkMonitor.stats.bytes,
      };
    });
  }, []);

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <Layout
        status={status}
        editorState={editorState}
        sidebarState={sidebarState}
        onEditorChange={handleEditorChange}
        onCursorChange={handleCursorChange}
        onToggleSidebar={handleToggleSidebar}
        onTabChange={handleTabChange}
        onAnalyze={handleAnalyzeCode}
        onRefactor={handleRefactorCode}
        onExplain={handleExplainCode}
        onRunComplianceAudit={handleRunComplianceAudit}
        onRunAutonomousLoop={handleRunAutonomousLoop}
        onTestCodeChange={handleTestCodeChange}
        onInitModel={handleInitModel}
        onSelectionChange={handleSelectionChange}
        onToggleDiff={handleToggleDiff}
        telemetry={telemetryState}
        paranoid={paranoidState}
        onToggleParanoid={handleToggleParanoid}
      />

      {/* WebGPU Error Modal */}
      {gpuError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-lg rounded-2xl border border-red-500/20 bg-[#12121a] p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                WebGPU Not Available
              </h3>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
              {gpuError}
            </p>
            <button
              onClick={() => setGpuError(null)}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
