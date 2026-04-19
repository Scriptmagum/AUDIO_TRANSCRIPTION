import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Record() {
  const nav = useNavigate()
  const navigateToHome = () => nav('/')

  const audioRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  const [status, setStatus] = useState('idle') // idle | recording | paused | stopped
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)

  const [isSending, setIsSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState('')

  const mimeType = useMemo(() => {
    if (typeof MediaRecorder === 'undefined') return ''
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || ''
  }, [])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!audioBlob) return
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audioBlob])

  const startRecording = async () => {
    if (status === 'recording') return

    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Micro non supporté sur ce navigateur.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const chunks = []
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(finalBlob)
        setStatus('stopped')
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
      }

      mediaRecorderRef.current = recorder
      setTranscript('')
      setAudioBlob(null)
      setIsSending(false)
      setLoading(false)
      recorder.start()
      setStatus('recording')
    } catch (err) {
      console.error(err)
      alert('Impossible d’accéder au micro.')
    }
  }

  const togglePause = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    if (status === 'recording') {
      recorder.pause()
      setStatus('paused')
    } else if (status === 'paused') {
      recorder.resume()
      setStatus('recording')
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    if (recorder.state !== 'inactive') recorder.stop()
  }

  const processRecording = async () => {
    if (!audioBlob) return
    if (isSending) return

    const token = localStorage.getItem('meeting_token')
    if (!token) {
      alert("Accès refusé. Veuillez générer un token sur la page Token.")
      nav('/apikey')
      return
    }

    const file = new File(
      [audioBlob],
      'enregistrement_reunion.webm',
      { type: audioBlob.type || 'audio/webm' }
    )

    setIsSending(true)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:3001/meeting/process', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        const resultRes = await fetch('http://localhost:3001/meeting/result', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const resultData = await resultRes.json()

        if (resultRes.ok) setTranscript(resultData.transcript)
        alert('Transcription et résumé générés avec succès !')
      } else {
        console.error('Erreur serveur :', data)
        alert('Erreur: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur de connexion :', error)
      alert('Impossible de joindre le serveur.')
    } finally {
      setLoading(false)
      setIsSending(false)
    }
  }

  const downloadPdf = async () => {
    const token = localStorage.getItem('meeting_token')
    if (!token) {
      alert('Token manquant')
      return
    }

    try {
      const response = await fetch('http://localhost:3001/meeting/result/pdf', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume_reunion.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur PDF:', err)
      alert('Impossible de récupérer le compte-rendu PDF.')
    }
  }

  const rerenderIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a3.75 3.75 0 0 0 3.75-3.75V6.75a3.75 3.75 0 0 0-7.5 0v3.75a3.75 3.75 0 0 0 3.75 3.75Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 11.25a7.5 7.5 0 0 1-15 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3" />
    </svg>
  )

  return (
    <div className="min-h-screen w-screen bg-black text-gray-200 font-sans flex flex-col items-center pt-10 px-4">
      <header className="w-full max-w-2xl flex items-center gap-4 mb-6">
        <button
          className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
          onClick={navigateToHome}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="font-medium text-sm">Retour</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Enregistrement Direct</h1>
          <p className="text-sm text-gray-500">Enregistrez et analysez votre réunion via le micro</p>
        </div>
      </header>

      <div className="w-full max-w-2xl bg-[#09090b] border border-gray-800 rounded-2xl p-8 flex flex-col items-center shadow-lg">
        <div className="w-full flex flex-col items-center">
          <div
            className="h-28 w-28 rounded-full bg-zinc-900/50 border border-gray-800 flex items-center justify-center text-gray-400"
            role="status"
            aria-live="polite"
          >
            <div className={status === 'recording' ? 'text-yellow-500 animate-pulse' : 'text-gray-400'}>
              {rerenderIcon}
            </div>
          </div>

          {/* Bouton central */}
          {status === 'idle' && (
            <button
              onClick={startRecording}
              className="mt-6 w-full max-w-xs py-4 bg-yellow-500 text-black rounded-xl font-semibold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
            >
              <span>Commencer l'enregistrement</span>
              <span aria-hidden="true" className="inline-flex">
                {rerenderIcon}
              </span>
            </button>
          )}

          {/* Contrôles actifs */}
          {(status === 'recording' || status === 'paused') && (
            <div className="mt-6 w-full flex flex-col gap-3">
              <button
                onClick={togglePause}
                className="w-full py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2"
                disabled={loading}
              >
                <span>{status === 'recording' ? 'Pause' : 'Reprendre'}</span>
              </button>

              <button
                onClick={stopRecording}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 via-yellow-500 to-red-500 text-black rounded-lg font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-red-400/30"
              >
                <span>Arrêter &amp; Analyser</span>
              </button>
            </div>
          )}


          {status === 'stopped' && audioBlob && (
            <div className="mt-7 w-full">
              <div className="text-sm text-gray-400 mb-4 text-center">
                Enregistrement prêt. Vous pouvez le réécouter puis l'envoyer pour analyse.
              </div>

              {audioUrl && (
                <audio ref={audioRef} src={audioUrl} controls className="w-full mb-4" />
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => audioRef.current?.play()}
                  className="w-full py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-all border border-zinc-700"
                >
                  Réécouter
                </button>

                <button
                  onClick={processRecording}
                  disabled={isSending}
                  className={`w-full py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 ${
                    isSending ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isSending ? 'Analyse en cours...' : 'Envoyer pour Analyse'}
                </button>
              </div>
            </div>
          )}


          {transcript && (
            <div className="w-full mt-8">
              <h3 className="text-lg font-bold text-yellow-500 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                Transcription brute
              </h3>
              <div className="w-full bg-[#09090b] border border-gray-800 rounded-xl p-6 shadow-inner">
                <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {transcript}
                </pre>
              </div>

              <button
                onClick={downloadPdf}
                className="mt-4 w-full py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2"
              >
                <span>Obtenir le compte-rendu PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Record

