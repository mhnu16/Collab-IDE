import React from 'react';
import logo from './logo.svg';
import './App.scss';
import jQuery from 'jquery';

export default function MyApp() {
  let [label, setLabel] = React.useState('')
  let [count, setCount] = React.useState(0)

  function onRandButtonClick() {
    jQuery.ajax({
      url: 'http://localhost:5000/api/rand',
      type: 'GET',
      success: function (data: any) {
        let result = "Random number: " + data.rand
        setLabel(result)
        setCount(count + 1)
      },
      error: function () {
        setLabel('Error')
      }
    })
  }

  return (
    <div className='App'>
      <h1>Hello Gamer</h1>
      <img className='Logo' src={logo} alt="React Logo" width={500} />
      <div className='Random'>
        <label>{label}</label>
        <button onClick={onRandButtonClick}>Click to get a random number!</button>
        <label>You clicked {count} times</label>
      </div>
    </div>
  );
}