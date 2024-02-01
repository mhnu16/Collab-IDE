import React from 'react';
import logo from './logo.svg';
import './App.css';
import RandButton from './components/RandButton';

export default function MyApp() {
  return ( 
    <div className='App'>  
      <h1>Hello Gamer</h1>
      <img src={logo} alt="React Logo" width={500}/>
      <RandButton />
    </div>
  );
}