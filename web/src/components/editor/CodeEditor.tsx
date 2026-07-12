import React, { useCallback, useRef } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { Columns } from 'lucide-react';
import type { CodeEditorProps } from '../../types';

/**
 * CodeEditor — wraps @monaco-editor/react with AeroCode dark styling.
 *
 * - Full-height responsive layout
 * - Conditionally renders Standard Editor or Diff Editor
 * - Bottom status bar showing language, cursor position, and view toggles
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  editorState,
  onEditorChange,
  onCursorChange,
  onSelectionChange,
  onToggleDiff,
  telemetry,
  paranoid,
  onToggleParanoid,
}) => {
  const standardEditorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);

  /** Register the AeroCode dark theme. */
  const registerTheme = (monaco: any) => {
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
        'diffEditor.insertedTextBackground': '#10b98120',
        'diffEditor.removedTextBackground': '#ef444420',
      },
    });
    monaco.editor.setTheme('aerocode-dark');
  };

  /** Attach selection and cursor listeners to standard editor. */
  const attachListeners = (editor: monacoEditor.IStandaloneCodeEditor) => {
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange) {
        const selection = e.selection;
        const model = editor.getModel();
        if (
          model &&
          !selection.isEmpty() &&
          (selection.startLineNumber !== selection.endLineNumber ||
            selection.startColumn !== selection.endColumn)
        ) {
          const text = model.getValueInRange(selection);
          onSelectionChange({
            startLine: selection.startLineNumber,
            endLine: selection.endLineNumber,
            startColumn: selection.startColumn,
            endColumn: selection.endColumn,
            text,
          });
        } else {
          onSelectionChange(undefined);
        }
      }
    });
  };

  /** Handle standard editor mount. */
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      registerTheme(monaco);
      standardEditorRef.current = editor;
      attachListeners(editor);
      editor.focus();
    },
    [onCursorChange, onSelectionChange]
  );

  /** Handle diff editor mount. */
  const handleDiffMount = useCallback(
    (editor: any, monaco: any) => {
      registerTheme(monaco);
      
      const originalEditor = editor.getOriginalEditor();
      const modifiedEditor = editor.getModifiedEditor();
      
      attachListeners(originalEditor);
      
      // We only want changes from the modified side (or the original side depending on use-case,
      // but usually the user types in modified in a diff view if it's editable).
      modifiedEditor.onDidChangeModelContent(() => {
        if (onEditorChange) {
          onEditorChange(modifiedEditor.getValue());
        }
      });
    },
    [onCursorChange, onSelectionChange, onEditorChange]
  );

  const commonOptions = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontLigatures: true,
    lineNumbers: 'on' as const,
    minimap: { enabled: true, scale: 1, showSlider: 'mouseover' as const },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    renderLineHighlight: 'all' as const,
    bracketPairColorization: { enabled: true },
    padding: { top: 16, bottom: 16 },
    wordWrap: 'on' as const,
    tabSize: 2,
    automaticLayout: true,
  };

  const loadingIndicator = (
    <div className="flex h-full items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
        <span className="text-sm text-slate-500">Loading editor...</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-[#0a0a0f]">
      {/* Editor area */}
      <div className="flex-1 overflow-hidden relative">
        {editorState.showDiff ? (
          <DiffEditor
            height="100%"
            language={editorState.language}
            original={editorState.value}
            modified={editorState.modifiedValue ?? editorState.value}
            theme="aerocode-dark"
            onMount={handleDiffMount}
            options={{
              ...commonOptions,
              renderSideBySide: true,
              enableSplitViewResizing: true,
            }}
            loading={loadingIndicator}
          />
        ) : (
          <Editor
            height="100%"
            language={editorState.language}
            value={editorState.value}
            theme="aerocode-dark"
            onChange={onEditorChange}
            onMount={handleEditorMount}
            options={commonOptions}
            loading={loadingIndicator}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex h-8 items-center justify-between border-t border-white/5 bg-[#0d0d14] px-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <span className="font-medium text-indigo-400">
            {editorState.language.toUpperCase()}
          </span>
          <span>
            Ln {editorState.cursorPosition.line}, Col{' '}
            {editorState.cursorPosition.column}
          </span>
          {editorState.selection && (
            <span className="text-indigo-300">
              ({editorState.selection.endLine - editorState.selection.startLine + 1} lines selected)
            </span>
          )}
          <div className="h-4 w-px bg-white/10" />
          
          {/* Telemetry Stats */}
          {telemetry && telemetry.tokensPerSecond > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">
                Speed: ~{telemetry.tokensPerSecond} t/s
              </span>
              <span className="text-slate-400">
                VRAM: {telemetry.estimatedVramMB} MB
              </span>
              <span className="text-indigo-300">Engine: WebGPU Local</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Paranoid Mode Toggle */}
          {paranoid && (
            <button
              onClick={onToggleParanoid}
              className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${
                paranoid.isActive
                  ? 'hover:bg-white/5 text-slate-300'
                  : 'hover:bg-white/5 text-slate-500 opacity-70'
              }`}
              title="Toggle Paranoid Mode (Blocks external requests)"
            >
              <span className={`h-[6px] w-[6px] rounded-full ${paranoid.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
              <span className="font-mono text-[11px] font-medium">
                AIR-GAPPED: {(paranoid.bytesLeaked / 1024).toFixed(2)} KB OUTBOUND
              </span>
            </button>
          )}

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={onToggleDiff}
            className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 transition-colors ${
              editorState.showDiff
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'hover:bg-white/5 hover:text-white'
            }`}
            title="Toggle Side-by-Side Diff"
          >
            <Columns className="h-3 w-3" />
            Diff View
          </button>
          <div className="h-4 w-px bg-white/10" />
          <span>UTF-8</span>
          <span>{editorState.fileName || 'untitled'}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
