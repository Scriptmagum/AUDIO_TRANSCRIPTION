import { useState } from 'react'
import './App.css'
import Recorder from './Components/recorder'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Enregistreur Vocal</h1>
      <Recorder />
    </>
  )
}

export default App
