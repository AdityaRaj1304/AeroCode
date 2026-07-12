import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/layout/Layout';
import { llmService } from './services/llmService';
import type {
  AirGapStatus,
  EditorState,
  SidebarState,
  SidebarTab,
  CursorPosition,
  AIReviewResult,
} from './types';

// ── Default editor code ──────────────────────────────────────

const DEFAULT_CODE = `// ✨ Welcome to AeroCode — Air-Gapped AI Pair Programmer
//
// All AI processing happens entirely on your device.
// No data ever leaves your browser. 🔒
//
// 1. Click "Load Model" in the top-right to download the AI model
// 2. Once loaded, click "Analyze Code" in the AI panel →

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
        onInitModel={handleInitModel}
        onSelectionChange={handleSelectionChange}
        onToggleDiff={handleToggleDiff}
      />

      {/* WebGPU Error Modal */}
      {gpuError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-lg rounded-2xl border border-red-500/20 bg-[#12121a] p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <span className="text-lg">⚠️</span>
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
