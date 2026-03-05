import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Upload() {

    const [transcript, setTranscript] = useState("");
    const nav = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigateToHome = () => nav('/');

    
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

        
        const token = localStorage.getItem('meeting_token');
        if (!token) {
            alert("Accès refusé. Veuillez générer un token sur la page Token.");
            nav('/token'); 
            return;
        }

        
        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/meeting/process', {
                method: 'POST',
                headers: {
                    
                    'Authorization': `Bearer ${token}` 
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Succès ! Voici la réponse :", data);
                
                // On appelle la route result pour récupérer le texte brut
                const resultRes = await fetch('http://localhost:3001/meeting/result', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const resultData = await resultRes.json();
                
                if (resultRes.ok) {
                    setTranscript(resultData.transcript); // On stocke le texte brut
                }
                alert("Transcription et résumé générés avec succès !");
            } else {
                console.error("Erreur serveur :", data);
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            console.error("Erreur de connexion :", error);
            alert("Impossible de joindre le serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-black text-gray-200 font-sans flex flex-col items-center pt-10 px-4">
            {/* Header */}
            <header className="w-full max-w-2xl flex items-center gap-4 mb-6">
                <button className="text-gray-400 hover:text-yellow-500 transition-colors" onClick={navigateToHome}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">Upload Audio</h1>
                    <p className="text-sm text-gray-500">Transcribe and summarize your meetings</p>
                </div>
            </header>

            <div className="w-full max-w-2xl bg-[#09090b] border border-gray-800 rounded-2xl p-8 flex flex-col items-center shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Process a New Meeting</h2>

                
                <div className="w-full flex flex-col gap-4">
                    <fieldset className="w-full p-4 border border-dashed border-gray-600 rounded-xl bg-[#121214] flex flex-col items-center justify-center">
                        <legend className="text-sm text-yellow-500 font-semibold px-2">Pick an audio file</legend>
                        
                        <input 
                            type="file" 
                            accept="audio/*,video/webm"
                            onChange={handleFileChange}
                            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20 cursor-pointer" 
                        />
                        <p className="text-xs text-gray-500 mt-2">Max size: 50MB (MP3, WAV, M4A, WEBM)</p>
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
                            <span>Processing (this may take a minute)...</span>
                        ) : (
                            <span>Transcribe & Summarize</span>
                        )}
                    </button>
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
                    
                    
                    <button 
                        className="mt-4 w-full py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2"
                    >
                        <span>Obtenir le compte-rendu PDF</span>
                    </button>
                </div>
            )}
        </div>
    )
}

export default Upload;