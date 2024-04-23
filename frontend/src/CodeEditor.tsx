import React from 'react';
import './styles/CodeEditor.scss';
import { useParams, useNavigate } from 'react-router-dom';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import CryptoJS from 'crypto-js';

import { Project, ProjectResponse, sendRequest, SocketManager, File } from './utils/ServerApi';

import EditorSidePanel from './Components/EditorSidePanel';
import LoadingPage from './Components/LoadingPage';
import ErrorPage from './Components/ErrorPage';

export const EditorContext = React.createContext<{ editor: monaco.editor.IStandaloneCodeEditor | null, switchFile: (file: string) => void }>({ editor: null, switchFile: () => { } });
export const NetworkContext = React.createContext<SocketManager>(null!);
export const ProjectContext = React.createContext<Project>(null!);

export default function CodeEditor() {
  const editor = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [fileStructure, setFileStructure] = React.useState<string[]>([]);
  const [file, setFile] = React.useState<File>(null!);
  const [project, setProject] = React.useState<Project>(null!);
  const isServerEdit = React.useRef(false);
  const navigate = useNavigate();

  const { project_id, current_file } = useParams();

  const [errorCode, setErrorCode] = React.useState<number>(null!);

  const sm = React.useMemo(() => new SocketManager(), [project_id]);

  // Fetches the project data from the server upon loading the page
  React.useEffect(() => {
    sendRequest<ProjectResponse>(`/api/projects/${project_id}`, 'GET')
      .then((res) => {
        if (res.success) {
          setProject(res.data);
          setFileStructure(prevStructure => {
            const newStructure = Object.keys(res.data.structure);
            return JSON.stringify(newStructure) !== JSON.stringify(prevStructure) ? newStructure : prevStructure;
          });
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
  }, []);

  // Fetches the file data from the server upon changing the current file
  React.useEffect(() => {
    if (current_file === undefined) {
      return;
    }
    sm.sendEvent('get_file', { filename: current_file }, (response) => {
      if (!response.success) {
        console.error(response.data.error);
        alert('Failed to get file');
        return;
      }
      setEditorContent(response.data.file);
    });
  }, [current_file])

  // Periodically checks if the file content is still in sync with the server
  React.useEffect(() => {
    if (current_file == undefined || file == null) {
      return;
    }

    // Set up the interval to periodically check if the file content is still in sync with the server
    const intervalId = setInterval(() => {
      sm.sendEvent('file_hash_request', { filename: current_file }, (response) => {
        if (response.success) {
          const clientFileHash = CryptoJS.SHA256(file.content).toString();
          if (clientFileHash !== response.data.hash) {
            console.log('State desynchronized');
            // File content is out of sync, request updated content
            sm.sendEvent('get_file', { filename: current_file }, (response) => {
              if (!response.success) {
                console.error(response.data.error);
                return;
              }
              setEditorContent(response.data.file);
            });
          }
        } else {
          console.error(response.data.error);
        }
      });
    }, 5000);

    // Clear the interval when the component unmounts or the current file changes
    return () => clearInterval(intervalId);
  }, [current_file, file?.content]);

  function handleEditorDidMount(new_editor: monaco.editor.IStandaloneCodeEditor, _monaco: typeof monaco) {
    editor.current = new_editor;
    editor.current.focus();

    console.log('Editor mounted');
  }

  function handleEditorChange(value: string | undefined, event: monaco.editor.IModelContentChangedEvent) {
    if (value == undefined) {
      return;
    }
    if (editor.current == null) {
      return;
    }

    let path = editor.current.getModel()?.uri.path;
    if (path == undefined) {
      return;
    }

    if (isServerEdit.current) {
      isServerEdit.current = false;
      return;
    }

    console.log('Editor change', event.changes)

    sm.sendEvent('file_content_update', { filename: path, changes: event.changes }, (response) => {
      if (!response.success) {
        console.error(response.data.error);
        // Undo the changes if the server rejects them
        editor.current?.trigger('', 'undo', {});
      }
    });
  }

  function setEditorContent(file: File) {
    let position = editor.current?.getPosition();

    isServerEdit.current = true;
    setFile(file);
    editor.current?.setValue(file.content);

    if (position != null) {
      editor.current?.setPosition(position);
    }
  }

  // Listens for file content updates from the server
  React.useEffect(() => {
    console.log('Listening for file content updates');
    sm.onEvent('file_content_updated', (response) => {
      if (!response.success) {
        console.error(response.data.error);
        return;
      }

      let path = response.data.filename;
      let changes = response.data.changes;

      if (editor.current == null) {
        return;
      }

      let model = editor.current.getModel();
      if (model == null) {
        return;
      }

      if (model.uri.path !== path) {
        return;
      }

      isServerEdit.current = true;
      editor.current.getModel()?.applyEdits(changes);
      console.log('Applied changes', changes)
    });
  }, []);

  if (errorCode != null) {
    return <ErrorPage code={errorCode}></ErrorPage>;
  }

  if (project == null) {
    return <LoadingPage></LoadingPage>;
  }


  return (
    <EditorContext.Provider value={{ editor: editor.current, switchFile }}>
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
                  <div className='row-container'>
                    <h2>{file.filename}</h2>
                    <button onClick={() => switchFile('')}>X</button>
                  </div>
                </div>
                <Editor
                  path={file.filename}
                  defaultLanguage={file.language}
                  defaultValue={file.content}
                  loading={<LoadingPage></LoadingPage>}
                  value={file.content}
                  language={file.language}
                  saveViewState={false}
                  
                  onMount={handleEditorDidMount}
                  onChange={handleEditorChange}
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