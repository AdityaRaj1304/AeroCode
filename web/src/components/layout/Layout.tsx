import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FileExplorer from './FileExplorer';
import CodeEditor from '../editor/CodeEditor';
import type {
  FileSystemNode,
  AirGapStatus,
  EditorState,
  SidebarState,
  SidebarTab,
  CursorPosition,
  TelemetryPayload,
  ParanoidState,
  ComplianceLensType,
} from '../../types';

/** Props for the main Layout component. */
export interface LayoutProps {
  status: AirGapStatus;
  editorState: EditorState;
  sidebarState: SidebarState;
  onEditorChange: (value: string | undefined) => void;
  onCursorChange: (position: CursorPosition) => void;
  onToggleSidebar: () => void;
  onTabChange: (tab: SidebarTab) => void;
  onAnalyze: () => void;
  onRefactor: () => void;
  onExplain?: () => void;
  onRunComplianceAudit?: (lensType: ComplianceLensType) => void;
  onRunAutonomousLoop?: () => void;
  onTestCodeChange?: (code: string) => void;
  onInitModel?: () => void;
  onSelectionChange?: (selection: any) => void;
  onToggleDiff?: () => void;
  telemetry?: TelemetryPayload;
  paranoid?: ParanoidState;
  onToggleParanoid?: () => void;
  fileTree?: FileSystemNode | null;
  onOpenDirectory?: () => void;
  onOpenFile?: (fileHandle: any, fileName: string) => void;
  onSelectPreset?: (presetId: string) => void;
}

/**
 * Layout — main application shell.
 *
 * Structure:
 *   ┌────────────────────────────────────────┐
 *   │  Navbar                                │
 *   ├───────────────────────────┬────────────┤
 *   │                           │            │
 *   │  Code Editor              │  Sidebar   │
 *   │                           │            │
 *   └───────────────────────────┴────────────┘
 */
const Layout: React.FC<LayoutProps> = ({
  status,
  editorState,
  sidebarState,
  onEditorChange,
  onCursorChange,
  onToggleSidebar,
  onTabChange,
  onAnalyze,
  onRefactor,
  onExplain,
  onRunComplianceAudit,
  onRunAutonomousLoop,
  onTestCodeChange,
  onInitModel,
  onSelectionChange,
  onToggleDiff,
  telemetry,
  paranoid,
  onToggleParanoid,
  fileTree,
  onOpenDirectory,
  onOpenFile,
  onSelectPreset,
}) => {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Top Navigation */}
      <Navbar
        status={status}
        onToggleSidebar={onToggleSidebar}
        isSidebarOpen={sidebarState.isOpen}
        onInitModel={onInitModel}
        paranoid={paranoid}
        onSelectPreset={onSelectPreset}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar — File Explorer */}
        {onOpenDirectory && onOpenFile && (
          <FileExplorer
            fileTree={fileTree || null}
            onOpenDirectory={onOpenDirectory}
            onOpenFile={onOpenFile}
            activeHandleName={editorState.fileName}
          />
        )}

        {/* Editor — fills remaining space */}
        <div className="flex-1 overflow-hidden transition-all duration-300 relative z-10 border-l border-white/5">
          <CodeEditor
            editorState={editorState}
            onEditorChange={onEditorChange}
            onCursorChange={onCursorChange}
            onSelectionChange={onSelectionChange}
            onToggleDiff={onToggleDiff}
            telemetry={telemetry}
            paranoid={paranoid}
            onToggleParanoid={onToggleParanoid}
          />
        </div>

        {/* Sidebar — slides in from right */}
        <Sidebar
          sidebarState={sidebarState}
          onTabChange={onTabChange}
          onClose={onToggleSidebar}
          onAnalyze={onAnalyze}
          onRefactor={onRefactor}
          onExplain={onExplain}
          onRunComplianceAudit={onRunComplianceAudit}
          onRunAutonomousLoop={onRunAutonomousLoop}
          onTestCodeChange={onTestCodeChange}
        />
      </div>
    </div>
  );
};

export default Layout;
