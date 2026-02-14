import { useState } from 'react'
import './App.css'
import Recorder from './Components/recorder'

function App() {
  const [count, setCount] = useState(0)

  return (
  <div className="min-h-screen flex flex-col bg-transparent"> 
  <div className="flex-grow flex flex-col items-center justify-center">
    <h1 className="text-4xl mb-8 text-white">Enregistreur Vocal</h1>
    <Recorder />
  </div>
</div>
  )
}

export default App
