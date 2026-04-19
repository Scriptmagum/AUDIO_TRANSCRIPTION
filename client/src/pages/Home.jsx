import { useNavigate } from 'react-router-dom'
import './Home.css'


function Home() {
  
  const nav = useNavigate();

  const navigateToTokenPage = () => {
        nav('/apikey');
    };

  const navigateToUploadPage = () => {
        nav('/upload');
    };

  const navigateToRecordPage = () => {
        nav('/record');
    };

  // La landing page n'a pas besoin d'initialiser un token côté client.

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white font-sans relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-yellow-500/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="relative animate-fade-in px-4 py-10 md:p-10">
        <div className="max-w-6xl mx-auto">
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
                <h2 className="text-2xl font-bold">Révolutionnez vos comptes-rendus</h2>
                <p className="mt-2 text-gray-400 max-w-lg">Comment ça marche, en 3 étapes.</p>

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
                      <div className="text-sm text-gray-400">Générez votre token d'accès sécurisé.</div>
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
                      <div className="text-sm font-semibold text-white">3. IA & Export</div>
                      <div className="text-sm text-gray-400">
                        L'IA s'occupe de la transcription, du résumé, et génère un PDF professionnel.
                      </div>
                    </div>
                  </li>
                </ol>
              </section>

              
              <section className="relative overflow-hidden rounded-2xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/10 via-[#09090b] to-[#09090b] p-8 shadow-yellow-500/20">
                <div className="absolute inset-0 pointer-events-none">
                  <div aria-hidden="true" className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-500/10 blur-3xl" />
                </div>

                <div className="relative">
                  <h2 className="text-2xl font-bold">Analyser une réunion</h2>
                  <p className="mt-2 text-gray-400 max-w-md">
                    Importez votre audio/vidéo et obtenez un résumé prêt à télécharger en PDF.
                  </p>

                  
                    <div className="flex mt-6 flex-col gap-4 md:flex-row md:items-stretch">
                      
                      <button
                        onClick={navigateToRecordPage}
                        className="flex-1 text-left rounded-xl border border-gray-800 bg-[#121214] hover:border-yellow-500/50 hover:bg-[#121214]/80 transition-all p-5 flex flex-col gap-3"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 0 0-7.5 0v4.5a3.75 3.75 0 0 0 7.5 0v-4.5Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 11.25a7.5 7.5 0 0 1-15 0" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <div className="text-base font-semibold text-white">Enregistrement Micro</div>
                            <div className="text-sm text-gray-400 mt-1">Enregistrez votre réunion directement depuis votre navigateur</div>
                          </div>
                        </div>
                        <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                          <span>Commencer</span>
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </button>

                      {/* Choix B: Upload */}
                      <button
                        onClick={navigateToUploadPage}
                        className="flex-1 text-left rounded-xl border border-gray-800 bg-[#121214] hover:border-yellow-500/50 hover:bg-[#121214]/80 transition-all p-5 flex flex-col gap-3"
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
                        <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                          <span>Uploader</span>
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </button>
                    </div>
                  
                </div>
              </section>
            </div>
          </main>

          <footer className="mt-10 text-center">
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