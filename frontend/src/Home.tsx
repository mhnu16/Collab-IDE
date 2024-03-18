import React from 'react'
import Popup from 'reactjs-popup'
import { Field, FormikProvider, useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'

import logo from '/logo.svg'
import './styles/Home.scss'
import { useAuth } from './utils/Auth'
import { ProjectResponse, ProjectsResponse, Project, sendRequest, ApiResponse } from './utils/ServerApi'
import LoadingPage from './Components/LoadingPage'


export default function Home() {
  const auth = useAuth()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)

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


  function CreateProjectPopup() {
    const [open, setOpen] = React.useState(false);

    return (
      <div>
        <button onClick={() => setOpen(o => !o)}>Create Project</button>
        <Popup open={open} closeOnDocumentClick onClose={() => setOpen(false)}>
          <ProjectForm setOpen={setOpen} />
        </Popup>
      </div>
    )

  }

  function ProjectForm({ setOpen }: { setOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [error, setError] = React.useState("");

    const formik = useFormik({
      initialValues: {
        name: "",
        description: "",
        language: "python",
      },
      onSubmit: (values) => {
        createProject(values);
      },
    });

    function createProject(values: { name: string, description: string, language: string }) {
      sendRequest<ProjectResponse>("/api/projects", "POST", values)
        .then((res) => {
          if (res.success) {
            console.log(res.data);
            setProjects([...projects, res.data]);
            setOpen(false);
          }
          else {
            console.error(res.data.error);
            setError(res.data.error);
          }
        })
        .catch((err) => {
          setError(err);
        });
    }

    return (
      <div className='popup'>
        <div className='panel'>
          <h1>Create a new project</h1>
          <form className="container" onSubmit={formik.handleSubmit}>
            <div className="container">
              <label htmlFor="name">Project Name</label>
              <input
                id="name"
                name="name"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.name}
              />
            </div>
            <div className="container">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                name="description"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.description}
              />
            </div>
            <div className="container">
              <label htmlFor="language">Language</label>
              <FormikProvider value={formik}>
                <Field as="select" id="language" name="language">
                  <option value="python">Python</option>
                  <option value="javascript">Javascript</option>
                </Field>
              </FormikProvider>
            </div>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setOpen(false)}>Cancel</button>
            <label hidden={!error} className="error-label">{error}</label>
          </form>
        </div>
      </div>
    )
  }

  function ProjectList({ projects }: { projects: Project[] }) {
    return (
      <div className='panel'>
        {projects.length === 0 && <p>No projects found</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {projects.map((project) => (
            <ProjectCard key={project.project_id} project={project} />
          ))}
        </div>
      </div>
    )
  }

  function ProjectCard({ project }: { project: Project }) {
    const navigate = useNavigate();

    function deleteProject(project_id: string) {
      sendRequest<ApiResponse>(`/api/projects/${project_id}`, "DELETE")
        .then((res) => {
          if (res.success) {
            setProjects(projects.filter(p => p.project_id !== project_id));
            navigate(`/`);
          }
          else {
            console.error(res.data.error);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }

    return (
      <div className='card'>
        <h2>{project.name}</h2>
        <p>{project.description}</p>
        <button onClick={() => navigate(`/projects/${project.project_id}`)}>Open</button>
        <button onClick={() => deleteProject(project.project_id)}>Delete</button>
      </div>
    )
  }


  if (loading) {
    return <LoadingPage />
  }

  return (
    <div className='container'>
      <img alt="logo" src={logo} className="App-logo" />
      <h1>Home Screen</h1>
      <div className='panel'>
        <CreateProjectPopup />
        <ProjectList projects={projects} />
      </div>
      <div className="card">
        <button id='logout' onClick={() => auth.logout()}>Logout</button>
      </div>
    </div>
  )

}