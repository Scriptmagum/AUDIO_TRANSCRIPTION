import { useState } from 'react'
import './App.css'
import Recorder from './Components/recorder'

function App() {
  const [count, setCount] = useState(0)

  return (
  <div className="min-h-screen flex flex-col bg-transparent">
    <div className="w-full flex justify-between p-4">
      <button className="btn btn-neutral bg-gradient-to-br from-pink-300 to-orange-300 text-black px-4 py-2 rounded">Transcrire</button>
      <button className="btn btn-neutral bg-gradient-to-br from-pink-300 to-orange-300 text-black px-4 py-2 rounded">Résumer</button>
    </div>
    

  
  <div className="flex-grow flex flex-col items-center justify-center">
    <h1 className="text-4xl mb-8 text-white">Enregistreur Vocal</h1>
    <Recorder />
  </div>
</div>
  )
}

export default App
