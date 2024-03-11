import React from 'react'
import Popup from 'reactjs-popup'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'

import logo from '/logo.svg'
import './styles/Home.scss'
import { useAuth } from './Auth'
import { ApiResponse, ProjectResponse, sendRequest } from './ServerApi'


export default function Home() {
  const auth = useAuth()

  return (
    <div className='container'>
      <img alt="logo" src={logo} className="App-logo" />
      <h1>Home Screen</h1>
      <div className='panel'>
        <Popup trigger={<button>Open Modal</button>} modal>
          <ProjectForm />
        </Popup>
      </div>
      <div className="card">
        <button id='logout' onClick={() => auth.logout()}>Logout</button>
      </div>
    </div>
  )
}

function ProjectForm() {
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      language: "",
    },
    onSubmit: (values) => {
      createProject();
    },
  });

  function createProject() {
    sendRequest<ProjectResponse>("/api/project", "POST", formik.values)
      .then((res) => {
        if (res.success) {
          navigate(`/project/${res.data.project.project_id}`);
        }
        else {
          setError(res.data.error);
        }
      })
      .catch((err) => {
        setError(err.responseJSON.error);
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
            <select
              id="language"
              name="language"
              onChange={formik.handleChange}
              value={formik.values.language}
            >
              <option value="python">Python</option>
              <option value="javascript">Javascript</option>
            </select>
          </div>
          <button type="submit">Create</button>
          <label hidden={!error} className="error-label">{error}</label>
        </form>
      </div>
    </div>
  )
}

