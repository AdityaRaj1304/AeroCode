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
  modifiedValue?: string; // For Diff Editor
  showDiff?: boolean;     // Toggle Diff Editor
  theme: 'aerocode-dark' | 'vs-dark';
  fileName: string;
  cursorPosition: CursorPosition;
  selection?: TextSelection; // Currently highlighted text
}

/** Cursor location within the editor. */
export interface CursorPosition {
  line: number;
  column: number;
}

/** Selected text range. */
export interface TextSelection {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  text: string;
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
  explanationStream?: string;
  testCode?: string;
  loopProgress?: LoopProgressPayload;
}

/** Available sidebar tab identifiers. */
export type SidebarTab = 'review' | 'explain' | 'chat';

/** Props for the top Navbar component. */
export interface NavbarProps {
  status: AirGapStatus;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onInitModel?: () => void;
  paranoid?: ParanoidState;
}

/** Props for the code editor wrapper. */
export interface CodeEditorProps {
  editorState: EditorState;
  onEditorChange: (value: string | undefined) => void;
  onCursorChange: (position: CursorPosition) => void;
  onSelectionChange?: (selection: TextSelection | undefined) => void;
  onToggleDiff?: () => void;
  telemetry?: TelemetryPayload;
  paranoid?: ParanoidState;
  onToggleParanoid?: () => void;
}

/** Props for the collapsible sidebar. */
export interface SidebarProps {
  sidebarState: SidebarState;
  onTabChange: (tab: SidebarTab) => void;
  onClose: () => void;
  onAnalyze: () => void;
  onRefactor: () => void;
  onExplain?: () => void;
  onRunComplianceAudit?: (lensType: ComplianceLensType) => void;
  onRunAutonomousLoop?: () => void;
  onTestCodeChange?: (code: string) => void;
  onInitModel?: () => void;
}

/** Props for the StatusBadge UI component. */
export interface StatusBadgeProps {
  status: AirGapStatus;
  paranoid?: ParanoidState;
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

// ============================================================
// Worker Message Protocol
// ============================================================
// Bidirectional typed messaging between the React UI thread
// and the LLM Web Worker.
// ============================================================

/** Actions the UI can request from the worker. */
export type WorkerRequestAction =
  | 'INIT_MODEL'
  | 'GENERATE_REVIEW'
  | 'EXPLAIN_CODE'
  | 'REFACTOR_CODE'
  | 'RUN_COMPLIANCE_AUDIT'
  | 'RUN_AUTONOMOUS_LOOP';

export type ComplianceLensType = 'owasp' | 'soc2' | 'complexity';

/** Events the worker can send back to the UI. */
export type WorkerResponseEvent =
  | 'INIT_PROGRESS'
  | 'INIT_COMPLETE'
  | 'INIT_ERROR'
  | 'TOKEN_STREAM'
  | 'GENERATION_COMPLETE'
  | 'GENERATION_ERROR'
  | 'WEBGPU_UNSUPPORTED'
  | 'TELEMETRY_UPDATE'
  | 'LOOP_PROGRESS';

/** Message sent from the UI thread → Worker. */
export interface WorkerRequest {
  id: string;
  action: WorkerRequestAction;
  payload: InitModelPayload | GenerateReviewPayload | ExplainCodePayload | RefactorCodePayload | RunComplianceAuditPayload | RunAutonomousLoopPayload;
}

/** Payload for INIT_MODEL action. */
export interface InitModelPayload {
  modelId: string;
}

export interface GenerateReviewPayload {
  code: string;
  language: string;
  selection?: string;
}

export interface ExplainCodePayload {
  code: string;
  language: string;
  selection?: string;
}

export interface RefactorCodePayload {
  code: string;
  language: string;
  selection?: string;
}

export interface RunComplianceAuditPayload {
  code: string;
  language: string;
  selection?: string;
  lensType: ComplianceLensType;
}

export interface RunAutonomousLoopPayload {
  code: string;
  language: string;
  testCode: string;
}

/** Message sent from Worker → UI thread. */
export interface WorkerResponse {
  id: string;
  event: WorkerResponseEvent;
  payload: WorkerResponsePayload;
}

/** Union of all possible worker response payloads. */
export type WorkerResponsePayload =
  | InitProgressPayload
  | InitCompletePayload
  | InitErrorPayload
  | TokenStreamPayload
  | GenerationCompletePayload
  | GenerationErrorPayload
  | WebGPUUnsupportedPayload
  | TelemetryPayload
  | LoopProgressPayload;

/** Streaming progress during model download/initialization. */
export interface InitProgressPayload {
  progress: number; // 0–100
  message: string;
  timeElapsed?: number; // ms
}

/** Emitted once when model is fully loaded and ready. */
export interface InitCompletePayload {
  modelId: string;
  message: string;
}

/** Emitted if model initialization fails. */
export interface InitErrorPayload {
  error: string;
  recoverable: boolean;
}

/** A single streamed token during generation. */
export interface TokenStreamPayload {
  token: string;
  fullText: string;
  tokenIndex: number;
}

/** Payload for TELEMETRY_UPDATE event. */
export interface TelemetryPayload {
  tokensPerSecond: number;
  estimatedVramMB: number;
}

/** Emitted when generation finishes. */
export interface GenerationCompletePayload {
  fullText: string;
  totalTokens: number;
  durationMs: number;
}

/** Emitted if generation fails. */
export interface GenerationErrorPayload {
  error: string;
  partialText?: string;
}

/** Emitted if the client GPU does not support WebGPU. */
export interface WebGPUUnsupportedPayload {
  error: string;
  userAgent: string;
  suggestion: string;
}

/** State for the Paranoid Mode monitor. */
export interface ParanoidState {
  isActive: boolean;
  externalApiCalls: number;
  bytesLeaked: number;
}

/** Payload for LOOP_PROGRESS event during Autonomous Debugger */
export interface LoopProgressPayload {
  status: 'testing' | 'analyzing' | 'applying_patch' | 'success' | 'failed';
  attempt: number;
  maxAttempts: number;
  message?: string;
  code?: string; // Contains the final patched code on 'success' or intermediate code on 'applying_patch'
  stackTrace?: string; // Captured error
}
