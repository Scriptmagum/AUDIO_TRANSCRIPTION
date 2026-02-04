import { useState } from 'react'
import './App.css'
import Recorder from './Components/recorder'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8 text-white">Enregistreur Vocal</h1>
      <Recorder />
    </div>
  )
}

export default App
