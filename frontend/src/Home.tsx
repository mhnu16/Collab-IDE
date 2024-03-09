import React from 'react'
import logo from '/logo.svg'
import './styles/Home.scss'
import { useAuth } from './Auth'


export default function Home() {
  const auth = useAuth()


  return (
    <div className='container'>
      <img alt="logo" src={logo} className="App-logo" />
      <h1>Home Screen</h1>
      <div className='panel'>
        <h2>Account Details</h2>
        <p>Username: {auth.user.username}</p>
        <p>Email: {auth.user.email}</p>
      </div>
      <div className="card">
        <button onClick={() => window.location.href = '/editor'}>Go to Editor</button>
        <button id='logout' onClick={() => auth.logout()}>Logout</button>
      </div>
    </div>
  )
}