import { useState,useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import Recorder from '../Components/recorder'


function Home() {
  
  const [recordings, setRecordings] = useState([]);

  const nav = useNavigate();

  const navigateToTokenPage = () => {
        nav('/apikey');
    };

  useEffect(() => {
    const initAuth = async () => {
      if (!localStorage.getItem('meeting_token')) {
        try {
          const response = await fetch('http://localhost:3001/auth/token');
          const data = await response.json();
          localStorage.setItem('meeting_token', data.token);
          localStorage.setItem('user_uuid', data.uuid);
          console.log("Token d'authentification récupéré et stocké.");
        } catch (err) {
          console.error("Impossible de récupérer le token d'auth", err);
        }
      }
    };
    initAuth();
  }, []);

  
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
    <div className="min-h-screen flex flex-col items-center w-full bg-transparent text-white"> 
      
      
      

      
      <div className="flex-grow flex flex-col items-center justify-center relative">
        <h1 className="text-4xl font-bold mb-12  text-white">Enregistreur Vocal</h1>
        
        <Recorder onRecordingComplete={addRecordingToList} />
      </div>

      <div className="w-250 h-50 items-center justify-center rounded-lg bg-purple-500 mt-150">

        <p className='text-3xl font-bold mt-6'>Prêt à essayer ?</p>

        <p className="mt-5">Générer votre token gratuitement en 1 clic.</p>

        <button onClick={navigateToTokenPage} className="btn btn-primary mt-5">
          Générer mon token
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
 
          </button>
      
      </div>


    </div>


    
    
  )
}

export default Home;