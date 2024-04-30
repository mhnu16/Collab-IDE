import React from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../utils/Auth'
import { ProjectResponse, ProjectsResponse, Project, sendRequest, ApiResponse } from '../utils/ServerApi'
import LoadingPage from '../GenericPages/LoadingPage'
import CreateProjectButton from './components/CreateProjectButton'
import ProjectCard from './components/ProjectCard'

import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import CreateProjectDialog from './components/CreateProjectDialog'
import Alert from '@mui/material/Alert'

export default function HomePage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [openDialog, setOpenDialog] = React.useState(false)

  React.useEffect(() => {
    sendRequest<ProjectsResponse>("/api/projects", "GET")
      .then((res) => {
        if (res.success) {
          setProjects(res.data.projects)
        }
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [projects.length])

  function deleteProject(project_id: string) {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    sendRequest<ApiResponse>(`/api/projects/${project_id}`, "DELETE")
      .then((res) => {
        if (res.success) {
          setProjects(projects.filter(p => p.project_id !== project_id));
          navigate(`/`);
        }
        else {
          console.error(res.data.error);
          setError(res.data.error);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }

  function createProject(values: { name: string, description: string, language: string }) {
    if (values.name === "" || values.description === "" || values.language === "") {
      setError("Please fill out all fields");
      return;
    }

    sendRequest<ProjectResponse>("/api/projects", "POST", values)
      .then((res) => {
        if (res.success) {
          console.log(res.data);
          setProjects([...projects, res.data]);
        }
        else {
          console.error(res.data.error);
          setError(res.data.error);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }

  function handleLogout() {
    auth.logout().then(() => {
      navigate('/login')
    })
  }

  if (loading) {
    return <LoadingPage />
  }

  return (
    <Box component="main" sx={{ height: '100vh', display: 'flex', direction: 'column', alignContent: 'center' }}>
      <CssBaseline />
      <Grid item xs={2}>
        <Box flexDirection='column' display='flex' justifyContent='space-between' alignItems='center' p={2}>
          <Typography variant='h2' align='center' m={4}>Projects</Typography>
          <Button onClick={handleLogout} sx={{ borderRadius: 3 }} variant='outlined'>
            <Typography variant='h6'>Logout</Typography>
          </Button>
        </Box>
      </Grid>
      <Grid item xs={9} sx={{ width: '75%', p: 6 }} >
        <Paper elevation={1} sx={{ height: '100%', overflow: 'auto' }}>
          <Grid container justifyContent="flex-start" spacing={2} p={2} sx={{ overflow: 'auto' }}>
            <Grid item xs={3}>
              <CreateProjectButton onClick={() => setOpenDialog(true)} />
            </Grid>
            {projects.map((project) => (
              <Grid key={project.name} item xs={3}>
                <ProjectCard project={project} deleteProject={deleteProject} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
      <CreateProjectDialog open={openDialog} onClose={() => setOpenDialog(false)} onSubmit={createProject} />
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </Box>

  )

}