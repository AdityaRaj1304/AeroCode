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
  onInitModel?: () => void;
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
  onInitModel,
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
          />
        </div>

        {/* Sidebar — slides in from right */}
        <Sidebar
          sidebarState={sidebarState}
          onTabChange={onTabChange}
          onClose={onToggleSidebar}
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default Layout;
