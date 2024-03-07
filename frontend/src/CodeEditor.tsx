import React from 'react';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import EditorSidePanel from './EditorSidePanel';
import './styles/CodeEditor.scss';

export const EditorContext = React.createContext<monaco.editor.IStandaloneCodeEditor | null>(null);

export default function CodeEditor() {
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleEditorDidMount(new_editor: monaco.editor.IStandaloneCodeEditor) {
    setEditor(new_editor);
    new_editor.focus();

    if (new_editor) {
      // This is a simple example of how to add a new file to the editor
      // You can use this as a starting point to add more advanced features
      // like saving files, renaming files, deleting files, etc.
      monaco.editor.createModel('print("Hello, Ita!")', '', monaco.Uri.parse('file:///file1.py'));
      monaco.editor.createModel('print("Goodbye, Pita!")', '', monaco.Uri.parse('file:///file2.py'));
      monaco.editor.createModel('print("Hello, Mr!")', '', monaco.Uri.parse('file:///file3.py'));
      /*
  
      // This is a simple example of how to open a file in the editor
      // You can use this as a starting point to add more advanced features
      // like opening files in a new tab, opening files in a new window, etc.
      editor.setModel(monaco.editor.getModel(monaco.Uri.parse('file:///file1.py')));
  
      // This is a simple example of how to listen for changes in the editor
      // You can use this as a starting point to add more advanced features
      // like tracking changes, undo/redo, etc.
      */
      new_editor.onDidChangeModelContent(() => {
        console.log('The content of the model has changed');
      });
    }
  }

  return (
    <EditorContext.Provider value={editor}>
      <div className='editor'>
        <EditorSidePanel />
        <Editor
          className='editor__code-editor'
          defaultLanguage="python"
          onMount={handleEditorDidMount}
          theme='vs-dark'
          options={{
            minimap: {
              enabled: false
            }
          }}
        />
      </div>
    </EditorContext.Provider>
  );
}
