import React from 'react';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import './styles/CodeEditor.scss';

export default function CodeEditor() {
  const editorRef = React.useRef();

  function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
    editor.focus();
  }


  return (
    <div className='editor'>
      <Editor
        defaultLanguage="python"
        defaultValue="// Type your code here..."
        onMount={handleEditorDidMount}
        theme='vs-dark'
        options={{
          minimap: {
            enabled: false
          }
        }}
      />
    </div>
  );
}