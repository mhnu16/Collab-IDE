import './styles/App.scss'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './utils/Auth'
import Home from './Home'
import Login from './Login'
import Register from './Register'
import CodeEditor from './CodeEditor'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/projects/:project_id" element={
            <ProtectedRoute>
              <CodeEditor />
            </ProtectedRoute>
          }>
            <Route path=":current_file" element={
              <ProtectedRoute>
                <CodeEditor />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

