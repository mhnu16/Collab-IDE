import React from 'react';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import EditorSidePanel from './Components/EditorSidePanel';
import './styles/CodeEditor.scss';
import { sendRequest } from './ServerApi';

export const EditorContext = React.createContext<{ editor: monaco.editor.IStandaloneCodeEditor | null, setCurrentFile: React.Dispatch<React.SetStateAction<string>> }>({ editor: null, setCurrentFile: () => { } });

export default function CodeEditor() {
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [currentFile, setCurrentFile] = React.useState<string>('file1.py');

  const files = {
    'file1.py': {
      name: 'file1.py',
      language: 'python',
      value: 'print("Hello, Ita!")'
    },
    'file2.py': {
      name: 'file2.py',
      language: 'python',
      value: 'print("Goodbye, Pita!")'
    },
    'file3.py': {
      name: 'file3.py',
      language: 'python',
      value: 'print("Hello, Mr!")'
    },
    '': {
      name: '',
      language: '',
      value: 'Type something here...'
    }
  }

  const file = files[currentFile];


  function handleEditorDidMount(new_editor: monaco.editor.IStandaloneCodeEditor, _monaco: typeof monaco) {
    setEditor(new_editor);
    new_editor.focus();

    console.log('Editor mounted');
  }

  return (
    <EditorContext.Provider value={{ editor, setCurrentFile }}>
      <div className='editor'>
        <EditorSidePanel></EditorSidePanel>
        <Editor
          className='editor__code-editor'

          path={file.name}
          defaultLanguage={file.language}
          defaultValue={file.value}

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
