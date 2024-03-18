import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/CodeEditor.scss';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import { Project, ProjectResponse, sendRequest } from './utils/ServerApi';
import { useParams, useNavigate } from 'react-router-dom';

import EditorSidePanel from './Components/EditorSidePanel';
import LoadingPage from './Components/LoadingPage';
import ErrorPage from './Components/ErrorPage';

export const EditorContext = React.createContext<{ editor: monaco.editor.IStandaloneCodeEditor | null, switchFile: (file: string) => void }>({ editor: null, switchFile: () => { } });

export default function CodeEditor() {
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [files, setFiles] = React.useState<string[]>([]);
  const [project, setProject] = React.useState<Project>(null!);
  const navigate = useNavigate();

  const { project_id, current_file } = useParams();

  const [errorCode, setErrorCode] = React.useState<number>(null!);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    sendRequest<ProjectResponse>(`/api/projects/${project_id}`, 'GET')
      .then((res) => {
        if (res.success) {
          setProject(res.data);
          setFiles(Object.keys(res.data.structure));
          setLoading(false);
        }
      }).catch((err) => {
        if (err.status === 403) {
          // Displays the 403 page if the user is not authorized to view the project
          setErrorCode(403);

        } else if (err.status === 404) {
          // Displays the 404 page if the project does not exist
          setErrorCode(404);
        }
        else {
          // Displays the 500 page if an unknown error occurs
          setErrorCode(500);
          console.error(err);
        }
      });
  }, [])

  function switchFile(file: string) {
    navigate(`/projects/${project_id}/${file}`);
  }

  function handleEditorDidMount(new_editor: monaco.editor.IStandaloneCodeEditor, _monaco: typeof monaco) {
    setEditor(new_editor);
    new_editor.focus();

    console.log('Editor mounted');
  }

  if (errorCode !== null) {
    return <ErrorPage code={errorCode}></ErrorPage>;
  }

  if (loading) {
    return <LoadingPage></LoadingPage>;
  }

  let file: { name: string | undefined, value: string | undefined, language: string | undefined }

  if (current_file === undefined) {
    file = {
      name: undefined,
      value: undefined,
      language: undefined
    }
  } else {
    file = files[current_file]
    console.log(file)
  }

  return (
    <EditorContext.Provider value={{ editor, switchFile }}>
      <div className='editor'>
        <EditorSidePanel files={files} setFiles={setFiles}></EditorSidePanel>
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
