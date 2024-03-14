import React from 'react';
import './styles/CodeEditor.scss';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import { Project, ProjectResponse, sendRequest } from './utils/ServerApi';
import { useParams, useNavigate } from 'react-router-dom';

import EditorSidePanel from './Components/EditorSidePanel';

export const EditorContext = React.createContext<{ editor: monaco.editor.IStandaloneCodeEditor | null, setCurrentFile: React.Dispatch<React.SetStateAction<string>> }>({ editor: null, setCurrentFile: () => { } });

export default function CodeEditor() {
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [currentFile, setCurrentFile] = React.useState<string>(null!);
  const [files, setFiles] = React.useState<string[]>([]);
  const [project, setProject] = React.useState<Project>(null!);
  const navigate = useNavigate();

  const project_id = useParams();


  React.useEffect(() => {
    sendRequest<ProjectResponse>(`/api/project/${project_id}`, 'GET')
      .then((res) => {
        if (res.success) {
          setProject(res.data);
          setFiles(Object.keys(res.data.structure));
        }
      }).catch((err) => {
        console.log(err);
        if (err.status === 403) {
          // Displays the 403 page if the user is not authorized to view the project
          navigate('/403');
        }
      });
  })

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
