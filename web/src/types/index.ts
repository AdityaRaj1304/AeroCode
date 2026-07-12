// ============================================================
// AeroCode Web — Shared TypeScript Interfaces
// ============================================================

/** Represents the air-gapped connection and model status. */
export interface AirGapStatus {
  isOnline: boolean;
  modelLoaded: boolean;
  modelName: string;
  loadProgress: number; // 0–100
  lastSync: Date | null;
}

/** State of the Monaco code editor. */
export interface EditorState {
  language: string;
  value: string;
  theme: 'aerocode-dark' | 'vs-dark';
  fileName: string;
  cursorPosition: CursorPosition;
}

/** Cursor location within the editor. */
export interface CursorPosition {
  line: number;
  column: number;
}

/** A single AI-generated review, explanation, or suggestion. */
export interface AIReviewResult {
  id: string;
  type: 'review' | 'explanation' | 'suggestion';
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  lineRange?: LineRange;
}

/** Line range within the editor that a review references. */
export interface LineRange {
  start: number;
  end: number;
}

/** State of the right-hand sidebar panel. */
export interface SidebarState {
  isOpen: boolean;
  activeTab: SidebarTab;
  reviews: AIReviewResult[];
  isProcessing: boolean;
}

/** Available sidebar tab identifiers. */
export type SidebarTab = 'review' | 'explain' | 'chat';

/** Props for the top Navbar component. */
export interface NavbarProps {
  status: AirGapStatus;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

/** Props for the code editor wrapper. */
export interface CodeEditorProps {
  editorState: EditorState;
  onEditorChange: (value: string | undefined) => void;
  onCursorChange: (position: CursorPosition) => void;
}

/** Props for the collapsible sidebar. */
export interface SidebarProps {
  sidebarState: SidebarState;
  onTabChange: (tab: SidebarTab) => void;
  onClose: () => void;
  onAnalyze: () => void;
}

/** Props for the StatusBadge UI component. */
export interface StatusBadgeProps {
  status: AirGapStatus;
}

/** Props for a generic collapsible panel. */
export interface CollapsiblePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Chat message for the AI chat tab. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
