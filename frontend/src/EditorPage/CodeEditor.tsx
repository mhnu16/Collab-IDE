import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { SocketIOProvider } from 'y-socket.io';

import { Project, ProjectResponse, sendRequest, SocketManager } from '../utils/ServerApi';

import LoadingPage from '../GenericPages/LoadingPage';
import ErrorPage from '../GenericPages/ErrorPage';
import EditorSidePanel from './components/EditorSidePanel';

import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ProjectDetailsDialog from './components/ProjectDetailsDialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Terminal from './components/Terminal';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

export const EditorContext = React.createContext<monaco.editor.IStandaloneCodeEditor | null>(null!);
export const NetworkContext = React.createContext<SocketManager>(null!);
export const FuncContext = React.createContext<{ switchFile: (file: string) => void, openProjectDetails: () => void }>(null!);

export default function EditorPage() {
  const editor = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [fileStructure, setFileStructure] = React.useState<string[] | null>(null);
  const [project, setProject] = React.useState<Project | null>(null);
  const navigate = useNavigate();

  const doc = React.useRef<Y.Doc>(null!);
  const provider = React.useRef<SocketIOProvider>(null!);
  const monacoBinding = React.useRef<MonacoBinding>(null!);

  const { project_id, current_file } = useParams();

  const [errorCode, setErrorCode] = React.useState<number>(null!);

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [openTerminal, setOpenTerminal] = React.useState(false);

  const sm = React.useMemo(() => {
    console.log('Creating new SocketManager for:', project_id);
    return SocketManager.getInstance(project_id!);
  }, []);

  // Event listeners for the socket manager
  React.useEffect(() => {
    sm.on('connect', () => {
      console.log('Connected to server');
    });

    sm.on('file_structure_update', (data) => {
      setFileStructure(data.files);
      setLoading(false);
    });

    sm.on('exported_project', (data) => {
      console.log('Exported project:', data);
    });
  }, [sm]);

  // Fetches the project data when the page is loaded
  React.useEffect(() => {
    console.log('Fetching project data');
    getProject().then(() => {
      sm.emit('get_file_structure');
    })
  }, []);

  // Checks if the current file is in the file structure
  React.useEffect(() => {
    if (current_file == undefined || current_file == '') {
      return;
    }

    if (!fileStructure?.includes(current_file)) {
      console.error(`File ${current_file} not found in file structure`, fileStructure)
      setErrorCode(404);
    }
    setErrorCode(null!);
  }, [current_file])

  function handleEditorDidMount(new_editor: monaco.editor.IStandaloneCodeEditor, _monaco: typeof monaco) {
    editor.current = new_editor;
    console.log('Editor mounted');

    setupYjs();

    editor.current.onDidDispose(() => {
      console.log('Editor disposed, destroying Yjs');
      monacoBinding.current.destroy();
      // doc.current.destroy();
      provider.current.destroy();
    });

    editor.current.onDidChangeModel((e: monaco.editor.IModelChangedEvent) => {
      if (e.newModelUrl == null) {
        return;
      }

      console.log('Model changed:', e.newModelUrl.path);
      console.log('Disconnecting Provider socket');
      provider.current.disconnect();

      setupYjs();
    });
  }

  function setupYjs() {
    if (editor.current == null || editor.current.getModel() == null) {
      return;
    }

    let uri_path = editor.current.getModel()!.uri.path.slice(1);

    console.log('Creating new doc for:', uri_path);
    doc.current = new Y.Doc();

    console.log('Creating provider for:', uri_path);
    provider.current = new SocketIOProvider(self.location.origin, project_id + '/' + uri_path, doc.current, {}, {
      query: {
        project_id: project_id
      }
    });

    console.log('Creating MonacoBinding for:', uri_path);
    monacoBinding.current = new MonacoBinding(doc.current.getText('monaco'), editor.current.getModel()!, new Set([editor.current]), provider.current.awareness);
  }


  async function getProject() {
    return sendRequest<ProjectResponse>(`/api/projects/${project_id}`, 'GET')
      .then((res) => {
        if (res.success) {
          return res.data;
        } else {
          throw res.data.error;
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
        throw err;
      });
  }

  function openProjectDetails() {
    getProject().then((project) => {
      setProject(project);
    });
  }

  async function onAddUser(userEmail: string): Promise<string | null> {
    setError(null);
    return sendRequest(`/api/projects/${project_id}/addUser`, 'POST', { email: userEmail })
      .then((res) => {
        if (res.success) {
          console.log('User added successfully');
          return null;
        } else {
          console.error('Failed to add user:', res.data.error);
          setError(res.data.error);
          return res.data.error;
        }
      })
      .catch((err) => {
        let responseJSON = err.responseJSON;
        if (responseJSON.data && responseJSON.data.error) {
          console.error(responseJSON.data.error);
          setError(responseJSON.data.error);
          return null;
        }
        console.error('An error occurred:', err);
        return null;
      });
  }

  async function onRemoveUser(userEmail: string): Promise<string | null> {
    setError(null);
    return sendRequest(`/api/projects/${project_id}/removeUser`, 'POST', { email: userEmail })
      .then((res) => {
        if (res.success) {
          console.log('User removed successfully');
          setProject({ ...project!, allowed_users: project!.allowed_users.filter((user) => user.email !== userEmail) });
          return null;
        } else {
          console.error('Failed to remove user:', res.data.error);
          setError(res.data.error);
          return res.data.error;
        }
      })
      .catch((err) => {
        let responseJSON = err.responseJSON;
        if (responseJSON.data && responseJSON.data.error) {
          console.error(responseJSON.data.error);
          setError(responseJSON.data.error);
          return null;
        }
        console.error('An error occurred:', err);
        return null;
      });
  }

  function onExportProject() {
    sm.emit('export_project');
  }

  function switchFile(file: string) {
    navigate(`/projects/${project_id}/${file}`);
  }

  if (errorCode != null) {
    return <ErrorPage code={errorCode}></ErrorPage>;
  }

  if (loading) {
    return <LoadingPage></LoadingPage>;
  }

  return (
    <EditorContext.Provider value={editor.current}>
      <NetworkContext.Provider value={sm}>
        <FuncContext.Provider value={{ switchFile: switchFile, openProjectDetails: openProjectDetails }}>
          <Grid container component="main" sx={{ height: '100vh' }}>
            <CssBaseline />
            <Grid item xs={3}>
              <EditorSidePanel files={fileStructure!} openTerminal={() => setOpenTerminal(true)} />
            </Grid>
            <Grid item xs={9}>
              <Paper elevation={2} sx={{ height: '100%', width: '100%', position: 'relative' }}>
                <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' height='100%'>
                  {(() => {
                    if (current_file == null) {
                      return (
                        <NoFileSelectedScreen />
                      );
                    }
                    return (
                      <>
                        <FileHeader filename={current_file} onClick={() => switchFile('')}></FileHeader>
                        <Box height='100%' width='100%'>
                          <Editor
                            path={current_file}
                            defaultLanguage={getLanguageFromFilename(current_file)}
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
                        </Box>
                      </>
                    );
                  })()}
                </Box>
                {openTerminal && <Terminal closeTerminal={() => setOpenTerminal(false)} />}
              </Paper>
            </Grid>
          </Grid>
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={error !== null}
            autoHideDuration={6000}
            onClose={() => setError(null)}
          >
            <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
          </Snackbar>
          <ProjectDetailsDialog
            open={project != null}
            onClose={() => setProject(null)}
            project={project}
            onAddUser={onAddUser}
            onRemoveUser={onRemoveUser}
            onExportProject={onExportProject}
          />
        </FuncContext.Provider>
      </NetworkContext.Provider>
    </EditorContext.Provider>
  );
}

function NoFileSelectedScreen() {
  return (
    <Box>
      <Typography variant='h2'>No File Selected</Typography>
      <Typography variant='body1'>Please select a file from the side panel to start editing.</Typography>
    </Box>
  );
}

function FileHeader(props: { filename: string, onClick: () => void }) {
  return (
    <Box display='flex' p={2}>
      <Typography variant='h4' mx={1}>{props.filename}</Typography>
      <Button variant='outlined' onClick={props.onClick}>
        <CloseIcon />
      </Button>
    </Box>
  );
}

function getLanguageFromFilename(filename: string): string {
  /**
   * Gets the language identifier from the filename for the Monaco editor
   * 
   * @param filename The name of the file
   * @returns The language identifier for the Monaco editor
   */
  let extension = filename.split('.').pop();
  if (extension == null) {
    return 'plaintext';
  }
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'c':
      return 'c';
    case 'cpp':
      return 'cpp';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'yaml':
      return 'yaml';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}