import { useState } from 'react'
import './App.css'
import Recorder from './Components/recorder'

function App() {
  
  const [recordings, setRecordings] = useState([]);

  
  const addRecordingToList = (url, blob) => {
    const newEntry = {
      id: Date.now(),
      url: url,
      blob: blob,
      date: new Date().toLocaleTimeString()
    };
    setRecordings((prev) => [newEntry, ...prev]);
  };

  return (
    <div className="min-h-screen w-full flex bg-transparent text-white"> 
      
      
      <div className="w-1/6 p-4 overflow-y-auto bg-slate-800/50">
        <h2 className="text-xl font-bold mb-4 border-b border-purple-500 pb-2">Historique</h2>
        <div className="flex flex-col gap-3">
          {recordings.length === 0 && <p className="text-gray-400 text-sm">Aucun enregistrement</p>}
          {recordings.map((rec) => (
            <div key={rec.id} className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <p className="text-xs text-pink-300 font-mono">{rec.date}</p>
              <audio src={rec.url} controls className="w-full mt-2 h-8" />
            </div>
          ))}
        </div>
      </div>

      
      <div className="flex-grow flex flex-col items-center justify-center relative">
        <h1 className="text-4xl font-bold mb-12  text-white">Enregistreur Vocal</h1>
        
        <Recorder onRecordingComplete={addRecordingToList} />
      </div>
    </div>
  )
}

export default App