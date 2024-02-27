import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './styles/Home.scss'
import RandButton from './RandButton'
import { useAuth } from './Auth'


export default function Home() {
  const [count, setCount] = useState(0)
  const [data, setData] = useState('')
  const auth = useAuth()


  return (
    <>
      <h1>Home Screen</h1>
      <div className='panel'>
        <h2>Account Details</h2>
        <p>Username: {auth.user?.username}</p>
        <p>Email: {auth.user?.email}</p>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <RandButton data={data} setData={setData} />
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