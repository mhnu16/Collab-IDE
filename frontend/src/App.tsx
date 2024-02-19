import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import jquery from 'jquery'

function getRand() {
  return jquery.ajax({
    url: '/api/rand',
    success: function (data) {
      return data
    },
    error: function () {
      return 'error'
    }
  })
}

export default function App() {
  const [count, setCount] = useState(0)
  const [data, setData] = useState('')

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={() => getRand().then(function (result) {
          setData(result['rand'])
        })}>
          {data || 'fetch data'}
        </button>
        <button onClick={() => { setCount(0); setData('') }}>reset</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}