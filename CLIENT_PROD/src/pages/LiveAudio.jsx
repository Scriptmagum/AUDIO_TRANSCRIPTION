import { useRef, useState } from "react";
import {
  Mic,
  Square,
  Upload,
  CheckCircle2,
  Loader,
  Bot,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

export default function LiveAudio() {
  const navigate = useNavigate();

  const mediaRecorder = useRef(null);
  const chunksRef = useRef([]);

  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // ===========================
  // START RECORDING
  // ===========================
  const startRecording = async () => {
    try {
      setError("");
      setSuccess(false);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const file = new File([blob], "live-recording.webm", {
          type: "audio/webm",
        });

        await uploadAudio(file);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);

      let sec = 0;
      const timer = setInterval(() => {
        sec += 1;
        setSeconds(sec);
      }, 1000);

      setIntervalId(timer);
    } catch (err) {
      setError("Impossible d'accéder au microphone.");
    }
  };

  // ===========================
  // STOP RECORDING
  // ===========================
  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }

    clearInterval(intervalId);
    setSeconds(0);
    setRecording(false);
  };

  // ===========================
  // UPLOAD TO BACKEND
  // ===========================
  const uploadAudio = async (file) => {
    try {
      setUploading(true);
      await apiService.uploadAudio(file);

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard?tab=result");
      }, 1200);
    } catch (err) {
      setError("Erreur pendant l'envoi audio.");
    } finally {
      setUploading(false);
    }
  };

  const formatTime = () => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <div className="space-y-6">
      {/* LIVE AUDIO CARD */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Mic className="text-red-600" size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Live Audio Recording
            </h2>
            <p className="text-sm text-gray-500">
              Enregistre directement une réunion puis récupère transcription + résumé IA.
            </p>
          </div>
        </div>

        {/* REC STATUS */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Statut
            </span>

            <span
              className={`text-sm font-medium ${
                recording
                  ? "text-red-600"
                  : uploading
                  ? "text-purple-600"
                  : "text-gray-700"
              }`}
            >
              {recording
                ? "Enregistrement..."
                : uploading
                ? "Upload..."
                : "Prêt"}
            </span>
          </div>

          <div className="mt-3 text-3xl font-bold text-gray-800">
            {formatTime()}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-wrap gap-3">
          {!recording ? (
            <button
              onClick={startRecording}
              disabled={uploading}
              className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center gap-2 transition"
            >
              <Mic size={18} />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-5 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-medium flex items-center gap-2 transition"
            >
              <Square size={18} />
              Stop & Send
            </button>
          )}

          {uploading && (
            <button className="px-5 py-3 border border-gray-200 rounded-xl flex items-center gap-2">
              <Loader size={18} className="animate-spin" />
              Processing...
            </button>
          )}
        </div>

        {/* FEEDBACK */}
        {success && (
          <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700">
            <CheckCircle2 size={18} />
            Audio transcrit avec succes → aller au résultat.
          </div>
        )}

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* BOTS INTEGRATION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Bot className="text-purple-600" size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Bots Integrations
            </h2>
            <p className="text-sm text-gray-500">
              Connectez MeetingAI à vos plateformes préférées.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* DISCORD */}
          <a
            href="https://discord.com/oauth2/authorize?client_id=1497052650808545441&permissions=8&integration_type=0&scope=bot"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-gray-100 p-5 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 mb-3">
              <Bot className="text-indigo-600" />
              <span className="font-semibold text-gray-800">
                Discord Bot
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Ajoute notre bot à ton serveur pour résumer les réunions vocales.
            </p>

            <div className="text-sm text-purple-600 font-medium">
              Ajouter le bot →
            </div>
          </a>

          {/* TELEGRAM */}
          <div className="rounded-xl border border-dashed border-gray-200 p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="text-blue-500" />
              <span className="font-semibold text-gray-800">
                Telegram Bot
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Feature à venir.
            </p>
          </div>

          {/* TEAMS */}
          <div className="rounded-xl border border-dashed border-gray-200 p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="text-cyan-600" />
              <span className="font-semibold text-gray-800">
                Microsoft Teams
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Feature à venir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}