import { useState,useEffect } from 'react'
import { useNavigate } from 'react-router-dom' 



function Token() {
  

  const nav = useNavigate();

  const navigateToHome = () => {
        nav('/');
    };
  
  const [token,SetToken] = useState(localStorage.getItem('meeting_token') || '');
  const [uuid,SetUuid] = useState(localStorage.getItem('user_uuid') || '');

  


  const getToken = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/token');

      const data = await response.json();

      localStorage.setItem('meeting_token', data.token);
      localStorage.setItem('user_uuid', data.uuid);

      SetToken(data.token);
      SetUuid(data.uuid);

      console.log("Succès ! Token généré :", data.token);
      console.log("Succès ! UUID généré :", data.uuid);
      
    } catch (error) {
      console.error("Erreur lors de la communication avec le serveur :", error);
    }
  };


    
  
  return (

    <div className="min-h-screen w-screen bg-black text-gray-200 font-sans flex flex-col items-center pt-10 px-4">
      
      
      <header className="w-full max-w-2xl flex items-center gap-4 mb-6">
        <button className="text-gray-400 hover:text-yellow-500 transition-colors" onClick={navigateToHome}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">API Token</h1>
          <p className="text-sm text-gray-500">Generate and manage your API token</p>
        </div>
      </header>

      
      <div className="w-full max-w-2xl bg-[#09090b] border border-gray-800 rounded-2xl p-8 flex flex-col items-center shadow-lg shadow-yellow-500/5">
        
        
        <div className="h-16 w-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-yellow-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
        </div>

        
        <h2 className="text-2xl font-bold text-white mb-2">Your API Token</h2>
        <p className="text-gray-400 mb-8 text-center text-sm">Use this token to authenticate your API requests</p>

        
        <div className="w-full bg-[#121214] p-4 rounded-xl border border-gray-800 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-500 tracking-wider">YOUR TOKEN</span>
            <button className="text-xs font-medium text-yellow-500 hover:text-yellow-400 transition-colors">Show</button>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-3 overflow-hidden">
             <span className="text-gray-300 tracking-[0.3em] text-lg leading-none"></span>
             <p>{token}</p>
          </div>
        </div>

        
        <div className="w-full bg-[#121214] p-4 rounded-xl border border-gray-800 mb-8">
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 tracking-wider">USER UUID</span>
          </div>
          <div className="text-sm text-gray-400 font-mono">
            <p>{uuid}</p>
          </div>
        </div>

        
        <div className="w-full flex gap-4 mb-8">
          <button className="flex-1 flex items-center justify-center gap-2 bg-[#121214] border border-gray-700 hover:border-yellow-500 hover:text-yellow-500 text-white py-3 rounded-lg transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
            <span className="font-medium text-sm">Copy Token</span>
          </button>

          <button onClick={getToken} className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20" >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="font-semibold text-sm">Regenerate</span>
          </button>
        </div>

        
        <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-yellow-500 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-yellow-500 mb-1">Important</h3>
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              This token is stored locally and will be used for all API requests. Keep it secure and never share it publicly.
            </p>
          </div>
        </div>

        
        <button onClick={() => nav('/upload')} className="text-sm font-medium text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1">
          Proceed to upload your first audio file <span>&rarr;</span>
        </button>

      </div>
    </div>
  )


    
    
  
}

export default Token;