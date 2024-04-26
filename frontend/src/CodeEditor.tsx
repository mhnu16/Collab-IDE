import React from 'react';
import './styles/CodeEditor.scss';
import { useParams, useNavigate } from 'react-router-dom';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';

import { Project, ProjectResponse, sendRequest, SocketManager } from './utils/ServerApi';

import EditorSidePanel from './Components/EditorSidePanel';
import LoadingPage from './Components/LoadingPage';
import ErrorPage from './Components/ErrorPage';
import { SocketIOProvider } from 'y-socket.io';

export const EditorContext = React.createContext<{ editor: monaco.editor.IStandaloneCodeEditor | null, switchFile: (file: string) => void }>({ editor: null, switchFile: () => { } });
export const NetworkContext = React.createContext<SocketManager>(null!);
export const ProjectContext = React.createContext<Project>(null!);

export default function CodeEditor() {
  const editor = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [fileStructure, setFileStructure] = React.useState<string[]>([]);
  const [project, setProject] = React.useState<Project>(null!);
  const navigate = useNavigate();

  const [doc, setDoc] = React.useState<Y.Doc>(null!);
  const [provider, setProvider] = React.useState<SocketIOProvider>(null!);
  const [monacoBinding, setMonacoBinding] = React.useState<MonacoBinding>(null!);

  const { project_id, current_file } = useParams();

  const [errorCode, setErrorCode] = React.useState<number>(null!);

  const sm = React.useMemo(() => {
    return SocketManager.getInstance();
  }, []);

  // const monacoBinding = React.useMemo(() => {
  //   if (!doc || !provider || !editor.current) {
  //     return null;
  //   }

  //   let model = editor.current.getModel();
  //   if (model == null) {
  //     return null;
  //   }

  //   console.log('Creating MonacoBinding for:', current_file);

  //   return new MonacoBinding(doc.getText('monaco'), model, new Set([editor.current]), provider.awareness);
  // }, [doc, provider, editor.current]);

  // Sets up the socket event listeners
  React.useEffect(() => {
    sm.on('file_structure_update', (data) => {
      setFileStructure(data.files);
    });

    sm.on('created_new_file', (data) => {
      setFileStructure(data.files);
    });
  }, []);

  // Fetches the project data from the server upon loading the page
  React.useEffect(() => {
    sendRequest<ProjectResponse>(`/api/projects/${project_id}`, 'GET')
      .then((res) => {
        if (res.success) {
          setProject(res.data);
          sm.emit('get_file_structure'); // This gets handled in the EditorSidePanel component
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

  React.useEffect(() => {
    if (current_file == undefined || current_file == '') {
      return;
    }

    if (!fileStructure.includes(current_file)) {
      console.error('File not found in file structure:', current_file, fileStructure)
      setErrorCode(404);
    }
    setErrorCode(null!);
  }, [current_file])

  // React.useEffect(() => {
  //   if (current_file == undefined || current_file == '') {
  //     return;
  //   }

  //   if (errorCode != null) {
  //     return;
  //   }

  //   if (doc) {
  //     doc.destroy();
  //   }
  //   if (provider) {
  //     provider.destroy();
  //   }

  //   console.log('Creating new doc for:', current_file);
  //   const _doc = new Y.Doc();
  //   setDoc(_doc);

  //   console.log('Creating provider for:', current_file);
  //   const _provider = new SocketIOProvider('https://localhost', project_id + '/' + current_file, _doc, {
  //   });
  //   setProvider(_provider);

  // }, [current_file]);

  // React.useEffect(() => {
  //   if (!!doc && !provider) {
  //     if (current_file == undefined || current_file == '') {
  //       return;
  //     }
  //     console.log('Creating provider for:', current_file);
  //     const _provider = new SocketIOProvider('https://localhost', project_id + '/' + current_file, doc, {
  //     });
  //     setProvider(_provider);
  //   }
  // }, [doc, provider, current_file]);

  // React.useEffect(() => {
  //   if (current_file == undefined || current_file == '') {
  //     return;
  //   }

  //   if (errorCode != null) {
  //     return;
  //   }

  //   if (editor.current == null || editor.current.getModel() == null) {
  //     return;
  //   }

  //   setupYjs();

  // }, []);

  function handleEditorDidMount(new_editor: monaco.editor.IStandaloneCodeEditor, _monaco: typeof monaco) {
    editor.current = new_editor;
    editor.current.focus();

    console.log('Editor mounted');

    setupYjs();

    editor.current.onDidChangeModel((e: monaco.editor.IModelChangedEvent) => {
      if (e.newModelUrl == null) {
        return;
      }
      setupYjs();
    });
  }

  function setupYjs() {
    if (doc) {
      doc.destroy();
    }
    if (provider) {
      provider.destroy();
    }
    if (monacoBinding) {
      monacoBinding.destroy();
    }
    if (editor.current == null || editor.current.getModel() == null) {
      return;
    }

    let uri_path = editor.current.getModel()!.uri.path.slice(1);

    console.log('Creating new doc for:', uri_path);
    const _doc = new Y.Doc();
    setDoc(_doc);

    console.log('Creating provider for:', uri_path);
    const _provider = new SocketIOProvider('https://localhost', project_id + '/' + uri_path, _doc, {
    });
    setProvider(_provider);

    const _monacoBinding = new MonacoBinding(_doc.getText('monaco'), editor.current!.getModel()!, new Set([editor.current!]), _provider.awareness);
    setMonacoBinding(_monacoBinding);
    console.log('MonacoBinding created for:', uri_path);
  }


  function switchFile(file: string) {
    navigate(`/projects/${project_id}/${file}`);
  }

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
            <EditorSidePanel files={fileStructure}></EditorSidePanel>
            {current_file == null ? (
              <div className='editor__no-file-selected'>
                <h2>No File Selected</h2>
                <p>Please select a file from the side panel to start editing.</p>
              </div>
            ) : sm == null ? (
              (
                <div className='fill-container'>
                  <LoadingPage></LoadingPage>
                </div>
              )
            ) : (
              <div className='fill-container'>
                <div className='editor__file-header'>
                  <div className='row-container'>
                    <h2>{current_file}</h2>
                    <button onClick={() => switchFile('')}>X</button>
                  </div>
                </div>
                <Editor
                  path={current_file}
                  defaultLanguage='typescript'
                  loading={<LoadingPage></LoadingPage>}
                  onMount={handleEditorDidMount}
                  saveViewState={false}
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
}