import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Upload() {

    
    const meetingBaseURL = 'http://localhost:3001/meeting';
    const meetingResultURL = 'http://localhost:3001/meeting/result';
    const meetingResultPDFURL = 'http://localhost:3001/meeting/result/pdf';
    const signoutURL = 'http://localhost:3001/auth/signout';
    
    const [transcript, setTranscript] = useState("");
    const nav = useNavigate();
    const [file, setFile] = useState(null);
    const [mode,setMode] = useState("Professionnel");
    const [language, setLanguage] = useState("fr"); 
    const [loading, setLoading] = useState(false);

    const navigateToHome = () => nav('/');

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
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const processFile = async () => {
        if (!file) {
            alert("Veuillez d'abord sélectionner un fichier !");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", mode);
        formData.append("language", language); 

        setLoading(true);

        try {
            
            const processUrl = `${meetingBaseURL}/process/${language}`;
            const response = await fetch(processUrl, {
                method: 'POST',
                credentials: 'include', 
                body: formData
            });

            if (response.status === 403 || response.status === 401) {
                alert("Token invalide");
                return;
            }

            const data = await response.json();

            if (response.ok) {
                const resultRes = await fetch(meetingResultURL, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (resultRes.ok) {
                    const resultData = await resultRes.json();
                    setTranscript(resultData.transcript); 
                }
                alert("Transcription et résumé générés avec succès !");
            } else {
                console.error("Erreur serveur :", data);
                alert("Erreur: " + (data.error || data.message || "Erreur de traitement"));
            }
        } catch (error) {
            console.error("Erreur de connexion :", error);
            alert("Impossible de joindre le serveur. Vérifiez que votre backend est bien lancé !");
        } finally {
            setLoading(false);
        }
    };

    const downloadPdf = async () => {
        try {
            const response = await fetch(meetingResultPDFURL, {
                method: 'GET', 
                credentials: 'include' 
            });

            if (response.status === 403 || response.status === 401) {
                alert("Session expirée, veuillez vous reconnecter.");
                nav('/login');
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "resume_reunion.pdf"; 
            document.body.appendChild(a);
            a.click(); 
            a.remove(); 
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erreur PDF:", err);
            alert("Impossible de récupérer le compte-rendu PDF.");
        }
    };

    return (
        <div className="min-h-screen w-screen bg-[#09090b] text-gray-200 font-sans flex flex-col items-center pt-10 px-4">
            
            <header className="w-full max-w-2xl flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button className="text-gray-400 hover:text-yellow-500 transition-colors" onClick={navigateToHome}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Importer un fichier</h1>
                        <p className="text-sm text-gray-500 hidden sm:block">Transcrivez et résumez vos réunions</p>
                    </div>
                </div>

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
            </header>

            <div className="w-full max-w-2xl bg-[#09090b] border border-gray-800 rounded-2xl p-8 flex flex-col items-center shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Transcrire un nouveau fichier</h2>

                <div className="w-full flex flex-col gap-4">
                    <fieldset className="w-full p-4 border border-dashed border-gray-600 rounded-xl bg-[#121214] flex flex-col items-center justify-center">
                        <input 
                            type="file" 
                            accept="audio/*,video/webm"
                            onChange={handleFileChange}
                            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20 cursor-pointer" 
                        />
                        <p className="text-xs text-gray-500 mt-2">Taille maximale: 50MB (MP3, WAV, M4A, WEBM)</p>
                    </fieldset>

                    <button 
                        onClick={processFile}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                            loading 
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                            : "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20"
                        }`}
                    >
                        {loading ? (
                            <span>Traitement en cours...</span>
                        ) : (
                            <span>Transcrire et Résumer</span>
                        )}
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mx-auto mt-2"> 
                        <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full max-w-xs mx-auto bg-[#121214] border border-gray-600 text-gray-300 text-sm rounded-lg focus:outline-none focus:border-yellow-500 block p-3 text-center appearance-none">
                            <option disabled={true}>Mode de transcription</option>
                            <option value="Professionnel">Professionnel</option>
                            <option value="Détente">Détente</option>
                        </select>

                        {/* CORRECTION ICI : Les values sont 'fr', 'en', etc. */}
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full max-w-xs mx-auto bg-[#121214] border border-gray-600 text-gray-300 text-sm rounded-lg focus:outline-none focus:border-yellow-500 block p-3 text-center appearance-none">
                            <option disabled={true} value="">Langue de transcription</option>
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                            <option value="es">Español</option>
                        </select>
                    </div>

                </div>
            </div>

            {transcript && (
                <div className="w-full max-w-2xl mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-yellow-500 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                        </svg>
                        Transcription brute
                    </h3>
                    <div className="w-full bg-[#09090b] border border-gray-800 rounded-xl p-6 shadow-inner">
                        <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                            {transcript}
                        </pre>
                    </div>
                    
                    <button onClick={downloadPdf} className="mt-4 w-full py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2" >
                        <span>Obtenir le compte-rendu PDF</span>
                    </button>
                </div>
            )}
        </div>
    )
}

export default Upload;