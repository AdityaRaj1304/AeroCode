import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import type { CodeEditorProps } from '../../types';

/**
 * CodeEditor — wraps @monaco-editor/react with AeroCode dark styling.
 *
 * - Full-height responsive layout
 * - Bottom status bar showing language, cursor position, and encoding
 * - Custom dark theme registration
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  editorState,
  onEditorChange,
  onCursorChange,
}) => {
  /** Register the AeroCode dark theme and configure editor on mount. */
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      // Define custom theme
      monaco.editor.defineTheme('aerocode-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'c084fc' },
          { token: 'string', foreground: '34d399' },
          { token: 'number', foreground: 'f59e0b' },
          { token: 'type', foreground: '60a5fa' },
          { token: 'function', foreground: '818cf8' },
          { token: 'variable', foreground: 'e2e8f0' },
        ],
        colors: {
          'editor.background': '#0a0a0f',
          'editor.foreground': '#e2e8f0',
          'editor.lineHighlightBackground': '#1a1a2e',
          'editor.selectionBackground': '#6366f140',
          'editorCursor.foreground': '#8b5cf6',
          'editorLineNumber.foreground': '#374151',
          'editorLineNumber.activeForeground': '#6366f1',
          'editor.selectionHighlightBackground': '#6366f120',
          'editorIndentGuide.background': '#1e1e2e',
          'editorIndentGuide.activeBackground': '#2d2d44',
          'editorWidget.background': '#12121a',
          'editorWidget.border': '#1e1e2e',
          'editorSuggestWidget.background': '#12121a',
          'editorSuggestWidget.border': '#1e1e2e',
          'editorSuggestWidget.selectedBackground': '#1a1a2e',
          'scrollbarSlider.background': '#ffffff10',
          'scrollbarSlider.hoverBackground': '#ffffff20',
          'scrollbarSlider.activeBackground': '#ffffff30',
        },
      });

      monaco.editor.setTheme('aerocode-dark');

      // Track cursor changes
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });

      // Focus the editor
      editor.focus();
    },
    [onCursorChange]
  );

  return (
    <div className="flex h-full flex-col bg-[#0a0a0f]">
      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={editorState.language}
          value={editorState.value}
          theme="aerocode-dark"
          onChange={onEditorChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            padding: { top: 16, bottom: 16 },
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
            suggest: {
              showMethods: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
            },
          }}
          loading={
            <div className="flex h-full items-center justify-center bg-[#0a0a0f]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
                <span className="text-sm text-slate-500">
                  Loading editor...
                </span>
              </div>
            </div>
          }
        />
      </div>

      {/* Status bar */}
      <div className="flex h-6 items-center justify-between border-t border-white/5 bg-[#0d0d14] px-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <span className="font-medium text-indigo-400">
            {editorState.language.toUpperCase()}
          </span>
          <span>
            Ln {editorState.cursorPosition.line}, Col{' '}
            {editorState.cursorPosition.column}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{editorState.fileName || 'untitled'}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
