import { useState, useCallback } from 'react';
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

// Default code shown in the editor on first load
const DEFAULT_CODE = `// ✨ Welcome to AeroCode — Air-Gapped AI Pair Programmer
//
// All AI processing happens entirely on your device.
// No data ever leaves your browser. 🔒
//
// Try writing some code, then click "Analyze Code"
// in the AI panel on the right →

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

function App() {
  // ── Air-Gap Status ─────────────────────────────────────────
  const [status, setStatus] = useState<AirGapStatus>({
    isOnline: false,
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

  // ── Handlers ───────────────────────────────────────────────

  const handleEditorChange = useCallback((value: string | undefined) => {
    setEditorState((prev) => ({
      ...prev,
      value: value ?? '',
    }));
  }, []);

  const handleCursorChange = useCallback((position: CursorPosition) => {
    setEditorState((prev) => ({
      ...prev,
      cursorPosition: position,
    }));
  }, []);

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

  const handleAnalyze = useCallback(async () => {
    setSidebarState((prev) => ({
      ...prev,
      isProcessing: true,
      reviews: [],
    }));

    try {
      let results: AIReviewResult[];

      if (sidebarState.activeTab === 'explain') {
        const explanation = await llmService.explainCode(
          editorState.value,
          editorState.language
        );
        results = [
          {
            id: `explain-${Date.now()}`,
            type: 'explanation',
            title: 'Code Explanation',
            content: explanation,
            severity: 'info',
            timestamp: new Date(),
          },
        ];
      } else {
        results = await llmService.reviewCode(
          editorState.value,
          editorState.language
        );
      }

      setSidebarState((prev) => ({
        ...prev,
        reviews: results,
        isProcessing: false,
      }));
    } catch (error) {
      console.error('[AeroCode] Analysis failed:', error);
      setSidebarState((prev) => ({
        ...prev,
        isProcessing: false,
      }));
    }
  }, [sidebarState.activeTab, editorState.value, editorState.language]);

  // ── Initialize LLM (deferred) ─────────────────────────────
  // Model loading is intentionally NOT auto-started.
  // Users can trigger it from the UI when ready.
  // For now, mock reviews work without the model.
  void setStatus; // suppress unused — used when model loading is wired up

  return (
    <Layout
      status={status}
      editorState={editorState}
      sidebarState={sidebarState}
      onEditorChange={handleEditorChange}
      onCursorChange={handleCursorChange}
      onToggleSidebar={handleToggleSidebar}
      onTabChange={handleTabChange}
      onAnalyze={handleAnalyze}
    />
  );
}

export default App;
