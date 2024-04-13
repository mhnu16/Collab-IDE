import React from 'react';
import './styles/CodeEditor.scss';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import { Project, ProjectResponse, sendRequest, SocketManager, File } from './utils/ServerApi';
import { useParams, useNavigate } from 'react-router-dom';

import EditorSidePanel from './Components/EditorSidePanel';
import LoadingPage from './Components/LoadingPage';
import ErrorPage from './Components/ErrorPage';

export const EditorContext = React.createContext<{ editor: monaco.editor.IStandaloneCodeEditor | null, switchFile: (file: string) => void }>({ editor: null, switchFile: () => { } });
export const NetworkContext = React.createContext<SocketManager>(null!);
export const ProjectContext = React.createContext<Project>(null!);

export default function CodeEditor() {
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [fileStructure, setFileStructure] = React.useState<string[]>([]);
  const [file, setFile] = React.useState<File>(null!);
  const [project, setProject] = React.useState<Project>(null!);
  const navigate = useNavigate();

  const { project_id, current_file } = useParams();

  const [errorCode, setErrorCode] = React.useState<number>(null!);
  const [loading, setLoading] = React.useState(true);

  const sm = SocketManager.getInstance();

  React.useEffect(() => {
    sendRequest<ProjectResponse>(`/api/projects/${project_id}`, 'GET')
      .then((res) => {
        if (res.success) {
          setProject(res.data);
          setFileStructure(prevStructure => {
            const newStructure = Object.keys(res.data.structure);
            return JSON.stringify(newStructure) !== JSON.stringify(prevStructure) ? newStructure : prevStructure;
          });
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
  }, [fileStructure]);

  React.useEffect(() => {
    if (current_file === undefined) {
      return;
    }
    sm.sendEvent('getFile', { project_id, filename: current_file }, (response) => {
      if (!response.success) {
        alert('Failed to get file');
        return;
      }
      setFile(response.data.file);
    });
  }, [current_file])

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

  return (
    <EditorContext.Provider value={{ editor, switchFile }}>
      <NetworkContext.Provider value={sm}>
        <ProjectContext.Provider value={project}>
          <div className='editor'>
            <EditorSidePanel files={fileStructure} setFileStructure={setFileStructure}></EditorSidePanel>
            {current_file === undefined ? (
              <div className='editor__no-file-selected'>
                <h2>No File Selected</h2>
                <p>Please select a file from the side panel to start editing.</p>
              </div>
            ) : file === null ? (
              (
                <div className='fill-container'>
                  <LoadingPage></LoadingPage>
                </div>
              )
            ) : (
              <div className='fill-container'>
                <div className='editor__file-header'>
                  <h1>{file.filename}</h1>
                </div>
                <Editor
                  path={file.filename}
                  defaultLanguage={file.language}
                  defaultValue={file.content}
                  loading={<LoadingPage></LoadingPage>}

                  onMount={handleEditorDidMount}
                  theme='vs-dark'
                  options={{
                    minimap: {
                      enabled: false
                    }
                  }}
                />
              </div>
            )}
          </div>
        </ProjectContext.Provider>
      </NetworkContext.Provider>
    </EditorContext.Provider>
  );

  function switchFile(file: string) {
    navigate(`/projects/${project_id}/${file}`, { replace: true });
  }
}