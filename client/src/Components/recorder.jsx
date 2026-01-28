  import React, { useRef, useState } from 'react'
  import { FaCircleStop, FaMicrophone, FaPaperPlane } from 'react-icons/fa6';

  function Recorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedURL, setRecordedURL] = useState('');
    const [audioBlob, setAudioBlob] = useState(null);
    const [seconds, setSeconds] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [serverFilename, setServerFilename] = useState(null); 
    const [summary, setSummary] = useState("");
    const [isSummarizing, setIsSummarizing] = useState(false);


    const mediaStream = useRef(null);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);
    const timerRef = useRef(null); 

    const mimeType = "audio/webm;codecs=opus";

    const startRecording = async() => {
      setIsRecording(true);
      setAudioBlob(null);
      try {
        setSeconds(0);
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        mediaStream.current = stream;
        
        let options = {};
        if(MediaRecorder.isTypeSupported(mimeType)){
          options = { mimeType: mimeType };
        } else {
          console.warn(`${mimeType} n'est pas supporté, utilisation du type par défaut.`);
        }

        mediaRecorder.current = new MediaRecorder(stream, options);

        mediaRecorder.current.ondataavailable = (e) => {
          if(e.data.size > 0){
            chunks.current.push(e.data);
          }
        };

        mediaRecorder.current.onstop = () => {
          const blobType = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm';
          const recordedBlob = new Blob(chunks.current, { type: blobType });
          const url = URL.createObjectURL(recordedBlob);

          setRecordedURL(url);
          setAudioBlob(recordedBlob);
          
          chunks.current = [];
          clearInterval(timerRef.current);
        };

        mediaRecorder.current.start();

        timerRef.current = setInterval(() => {
          setSeconds(prev => prev + 1);
        }, 1000);

      } catch(err) {
        console.error("Erreur d'accès au micro:", err);
        setIsRecording(false);
      }
    };

    const stopRecording = () => {
      setIsRecording(false);
      
      clearInterval(timerRef.current);

      if(mediaRecorder.current && mediaRecorder.current.state !== "inactive"){
        mediaRecorder.current.stop();
      }
      if(mediaStream.current){
        mediaStream.current.getTracks().forEach(track => track.stop());
      }
    };

    const handleTranscribe = async () => {
      if(!audioBlob) return;
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', audioBlob, 'enregistrement.webm');

      try {
        const response = await fetch('http://127.0.0.1:3001/api/meeting/transcribe', {
          method: 'POST',
          body: formData,
        });

        if(response.ok){
          const data = await response.json();
          console.log("Transcription reçue:", data);
          setTranscription(data.transcription);
          setServerFilename(data.filename);
        } else {
          console.error("Erreur lors de la transcription:", response.statusText);
        }
      } catch(err) {
        console.error("Erreur réseau:", err);
      } finally {
        setIsUploading(false);
      }
    };

    const handleSummarize = async () => {
      if(!serverFilename) return;
      setIsSummarizing(true);

      try {
        const response = await fetch('http://127.0.0.1:3001/api/meeting/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filename: serverFilename }),
        });

        if(response.ok){
          const data = await response.json();
          console.log("Résumé reçu:", data);
          setSummary(data.summary);
        } else {
          console.error("Erreur lors du résumé:", response.statusText);
        }
      } catch(err) {
        console.error("Erreur réseau:", err);
      } finally {
        setIsSummarizing(false);
      }
    };

  const formatTime = (totalSeconds) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
    <div className='w-full min-h-screen flex flex-col items-center py-10 bg-gradient-to-r from-cyan-500 to-blue-500'>
        
        {/* TIMER */}
        <h2 className='text-[80px] text-white bg-black/30 backdrop-blur-md p-4 rounded-xl mx-4 mb-8 font-mono'>
            {formatTime(seconds)}
        </h2>

        {/* BOUTON ENREGISTREMENT */}
        {isRecording ? (
            <button onClick={stopRecording} className='flex items-center justify-center text-[50px] bg-red-500 rounded-full p-6 text-white shadow-2xl hover:scale-105 transition-all'>
                <FaCircleStop />
            </button>
        ) : (
            <button onClick={startRecording} className='flex items-center justify-center text-[50px] bg-blue-600 rounded-full p-6 text-white shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all'>
                <FaMicrophone />
            </button>
        )}
        
        {/* LECTEUR AUDIO + ACTIONS */}
        {recordedURL && (
            <div className="mt-8 flex flex-col gap-4 items-center w-full max-w-2xl px-4">
                <audio className="w-full shadow-lg rounded-full" controls src={recordedURL} />
                
                {/* Bouton Transcription */}
                {!transcription && (
                  <button 
                      onClick={handleTranscribe}
                      disabled={isUploading}
                      className='flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-full shadow-lg hover:bg-gray-100 disabled:bg-gray-300 disabled:text-gray-500 transition-all font-bold text-lg'
                  >
                    {isUploading ? 'Analyse en cours...' : (
                      <> <FaPaperPlane /> Lancer la Transcription </>
                    )}
                  </button>
                )}
            </div>
        )}

        {/* RÉSULTATS (TRANSCRIPTION + RÉSUMÉ) */}
        <div className="w-full max-w-4xl px-4 flex flex-col gap-6 mt-8">
            
            {/* 1. Affichage Transcription */}
            {transcription && (
              <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-800">📝 Transcription</h3>
                  
                  {/* Bouton Résumé (N'apparaît que si on a la transcription) */}
                  {!summary && (
                    <button 
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {isSummarizing ? "Génération IA..." : <><FaMagic /> Générer Résumé</>}
                    </button>
                  )}
                </div>
                
                <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded border border-gray-200 text-gray-700 whitespace-pre-wrap font-mono text-sm">
                  {transcription}
                </div>
              </div>
            )}

            {/* 2. Affichage Résumé */}
            {summary && (
              <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-xl p-6 shadow-2xl border border-purple-400/30 animate-fade-in-up">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaMagic className="text-yellow-400" /> Résumé Intelligent
                </h3>
                <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                  {summary}
                </div>
              </div>
            )}

        </div>
    </div>
  )
  }

  export default Recorder;