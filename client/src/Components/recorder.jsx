import React, { useRef, useState } from 'react'
import { FaCircleStop, FaMicrophone, FaPaperPlane } from 'react-icons/fa6';

function Recorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  const uploadAudio = async () => {
    if(!audioBlob) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', audioBlob, 'enregistrement.webm');

    try {
      const response = await fetch('http://127.0.0.1:3001/api/meeting/audio', {
        method: 'POST',
        body: formData,
      });

      if(response.ok){
        const data = await response.json();
        console.log("Transcription reçue:", data);
        alert(`Transcription: ${data.transcription}`);
      } else {
        console.error("Erreur lors de l'envoi du fichier:", response.statusText);
      }
    } catch(err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsUploading(false);
    }
  }

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className='w-96 h-96 flex flex-col items-center justify-center rounded-lg shadow-lg border-2 border-purple-500'>
        <h2 className='text-[50px] text-white'>
            {formatTime(seconds)}
        </h2>

        {isRecording ? (
            <button onClick={stopRecording} className='flex items-center justify-center text-[60px] bg-red-500 rounded-full p-4 text-white w-[100px] h-[100px] hover:bg-red-600 transition-colors'>
                <FaCircleStop />
            </button>
        ) : (
            <button onClick={startRecording} className='flex items-center justify-center text-[60px] bg-blue-600 rounded-full p-4 text-white w-[100px] h-[100px] hover:bg-blue-700 transition-colors'>
                <FaMicrophone />
            </button>
        )}
        
        {recordedURL && (
            <div className="mt-8 bg-white p-4 rounded-lg shadow-lg">
                <audio controls src={recordedURL} />
                <button 
                    onClick={uploadAudio}
                    disabled={isUploading}
                    className='flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-bold'
                >
                  {isUploading ? 'Envoie en cours...' : (
                    <>
                      <FaPaperPlane /> Transcrire
                    </>
                  )}
                </button>
            </div>
        )}
    </div>
  )
}

export default Recorder;