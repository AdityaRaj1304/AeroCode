import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import CodeEditor from '../editor/CodeEditor';
import type {
  AirGapStatus,
  EditorState,
  SidebarState,
  SidebarTab,
  CursorPosition,
  TelemetryPayload,
  ParanoidState,
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
  onInitModel?: () => void;
  onSelectionChange?: (selection: any) => void;
  onToggleDiff?: () => void;
  telemetry?: TelemetryPayload;
  paranoid?: ParanoidState;
  onToggleParanoid?: () => void;
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
  onInitModel,
  onSelectionChange,
  onToggleDiff,
  telemetry,
  paranoid,
  onToggleParanoid,
}) => {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Top Navigation */}
      <Navbar
        status={status}
        onToggleSidebar={onToggleSidebar}
        isSidebarOpen={sidebarState.isOpen}
        onInitModel={onInitModel}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor — fills remaining space */}
        <div className="flex-1 overflow-hidden transition-all duration-300">
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
        />
      </div>
    </div>
  );
};

export default Layout;
