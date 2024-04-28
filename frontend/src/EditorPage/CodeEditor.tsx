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

export const EditorContext = React.createContext<{ editor: monaco.editor.IStandaloneCodeEditor | null, switchFile: (file: string) => void }>({ editor: null, switchFile: () => { } });
export const NetworkContext = React.createContext<SocketManager>(null!);
export const ProjectContext = React.createContext<Project>(null!);

export default function EditorPage() {
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
          sm.emit('get_file_structure');
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

  // Checks if the current file is in the file structure
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
          <Grid container component="main" sx={{ height: '100vh' }}>
            <CssBaseline />
            <Grid item xs={3}>
              <EditorSidePanel files={fileStructure}></EditorSidePanel>
            </Grid>
            <Grid item xs={9}>
              <Paper elevation={2} sx={{ height: '100%', width: '100%' }}>
                {(() => {
                  if (current_file == null) {
                    return (
                      <NoFileSelectedScreen />
                    );
                  }
                  else if (sm == null) {
                    return (
                      <LoadingPage></LoadingPage>
                    );
                  }
                  return (
                    <Box height='100%'>
                      <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' height='100%'>
                        <FileHeader filename={current_file} onClick={() => switchFile('')}></FileHeader>
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
                      </Box>
                    </Box>
                  );
                })()}
              </Paper>
            </Grid>
          </Grid>
        </ProjectContext.Provider>
      </NetworkContext.Provider>
    </EditorContext.Provider>
  );
}

function NoFileSelectedScreen() {
  return (
    <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' height='100%'>
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