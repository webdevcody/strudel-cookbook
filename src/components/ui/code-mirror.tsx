import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

interface CodeMirrorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

export function CodeMirrorEditor({
  value,
  onChange,
  readOnly = false,
  height = '400px',
  theme = 'dark',
  className = '',
}: CodeMirrorProps) {
  const extensions: Extension[] = [
    javascript({ jsx: true, typescript: true }),
    EditorView.theme({
      '&': {
        fontSize: '14px',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: height,
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      },
    }),
  ];

  if (readOnly) {
    extensions.push(EditorView.editable.of(false));
  }

  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={theme === 'dark' ? oneDark : undefined}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
        }}
      />
    </div>
  );
}