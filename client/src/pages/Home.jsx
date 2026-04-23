import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  
  const signoutURL = 'http://localhost:3001/auth/signout';

  const nav = useNavigate();

  

  const navigateToTokenPage = () => { nav('/apikey'); };
  const navigateToUploadPage = () => { nav('/upload'); };
  const navigateToRecordPage = () => { nav('/record'); };
  const navigateToLogin = () => { nav('/login'); };

  
  const handleLogout = async () => {
    try {
        await fetch(signoutURL, {
            method: 'POST',
            credentials: 'include'
        });
        alert("Déconnexion réussie !");
    } catch (err) {
        console.error("Erreur lors de la déconnexion :", err);
    }
    
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white font-sans relative overflow-hidden">
      
      

      <div className="relative px-4 py-10 md:p-10">
        <div className="max-w-6xl mx-auto">
          
          
          <div className="flex items-center gap-3 justify-end">
    
  
                  <button onClick={() => nav('/login')} className={`flex items-center gap-2 px-4 py-2 bg-[#121214] rounded-xl transition-all duration-300 text-sm font-semibold hover:bg-gray-900`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      <span className="hidden sm:inline">Connexion</span>
                  </button>

            <button onClick={handleLogout} className={`flex items-center gap-2 px-4 py-2 bg-[#121214] border-yellow-500 rounded-xl transition-all duration-300 text-sm font-semibold hover:bg-gray-900`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                <span className="hidden sm:inline">Déconnexion</span>
            </button>

        </div>

          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-yellow-500/90">
                TRANSCRIPTION - RÉSUMÉ - EXPORT PDF
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2">Meeting AI</h1>
              <p className="mt-3 text-gray-400 max-w-2xl">
                Transformez vos réunions en comptes-rendus clairs : transcription, résumé et génération d'un PDF
                professionnel.
              </p>
            </div>
          </header>

          <main className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
              <section className="rounded-2xl border border-gray-800 bg-[#09090b] p-8 shadow-yellow-500/5">
                <h2 className="text-2xl font-bold">Facilitez vos comptes-rendus</h2>
                <p className="mt-2 text-gray-400 max-w-lg">Comment ça marche.</p>

                <ol className="mt-7 flex flex-col gap-5">
                  <li className="flex gap-4 items-start">
                    <div className="w-11 shrink-0">
                      <div className="h-11 w-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 11.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h.75m-1.5 0h-3.75" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12l1.5-1.5" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="text-sm font-semibold text-white">1. Authentification</div>
                      <div className="text-sm text-gray-400">Connectez-vous à votre compte</div>
                    </div>
                  </li>

                  <li className="flex gap-4 items-start">
                    <div className="w-11 shrink-0">
                      <div className="h-11 w-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25c1.656 0 3-1.343 3-3V6.75c0-1.657-1.344-3-3-3S9 5.093 9 6.75v4.5c0 1.657 1.344 3 3 3Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5v1.5a7.5 7.5 0 0 1-15 0v-1.5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="text-sm font-semibold text-white">2. Upload Facile</div>
                      <div className="text-sm text-gray-400">Déposez votre fichier audio ou vidéo de réunion.</div>
                    </div>
                  </li>

                  <li className="flex gap-4 items-start">
                    <div className="w-11 shrink-0">
                      <div className="h-11 w-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11h.01" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="text-sm font-semibold text-white">3. Recevez votre compte-rendu</div>
                      <div className="text-sm text-gray-400">
                        L'IA s'occupe de la transcription, du résumé, et génère un PDF professionnel.
                      </div>
                    </div>
                  </li>
                </ol>
              </section>

              <section className="relative overflow-hidden rounded-2xl border p-8 border-gray-800 ">
                <div className="absolute inset-0 pointer-events-none">
                  <div aria-hidden="true" className="absolute -top-40 -right-40 h-80 w-80 rounded-full " />
                </div>

                <div className="relative">
                  <h2 className="text-2xl font-bold">Analyser une réunion</h2>
                  <p className="mt-2 text-gray-400 max-w-md">
                    Importez votre audio/vidéo et obtenez un résumé prêt à télécharger en PDF.
                  </p>

                  <div className="flex mt-6 flex-col gap-4 md:flex-row md:items-stretch">
                    
                    <button
                      onClick={navigateToRecordPage}
                      className="flex-1 text-left rounded-xl border border-gray-800 bg-[#121214] hover:border-yellow-500/50 hover:bg-[#121214]/80 transition-all p-5 flex flex-col gap-3 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 0 0-7.5 0v4.5a3.75 3.75 0 0 0 7.5 0v-4.5Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 11.25a7.5 7.5 0 0 1-15 0" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-base font-semibold text-white">Enregistrement Micro</div>
                          <div className="text-sm text-gray-400 mt-1">Enregistrez directement depuis votre navigateur</div>
                        </div>
                      </div>
                      <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1 font-medium">
                        <span>Commencer</span>
                        <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </button>

                    <button
                      onClick={navigateToUploadPage}
                      className="flex-1 text-left rounded-xl border border-gray-800 bg-[#121214] hover:border-yellow-500/50 hover:bg-[#121214]/80 transition-all p-5 flex flex-col gap-3 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 13.5V6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v6.75" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 13.5 12 18l7.5-4.5" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-base font-semibold text-white">Importer un fichier</div>
                          <div className="text-sm text-gray-400 mt-1">MP3, WAV, M4A, WEBM (Max 50Mo)</div>
                        </div>
                      </div>
                      <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1 font-medium">
                        <span>Uploader</span>
                        <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </main>

          <footer className="mt-10 text-center pb-8">
            <button
              onClick={navigateToTokenPage}
              className="text-sm text-gray-500 hover:text-yellow-500 transition-colors"
            >
              Besoin de gérer votre accès ? Aller à la page Token
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default Home;