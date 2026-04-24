import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileAudio,
  Sparkles,
} from "lucide-react";
import apiService from "../services/api";

export default function UploadPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [language, setLanguage] = useState("fr");
  const [speakerDetection, setSpeakerDetection] = useState(true);

  // =============================
  // AUTH GUARD
  // =============================
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await apiService.isAuthenticated();

      if (!isAuth) {
        navigate("/sign-in");
      }
    };

    checkAuth();
  }, [navigate]);

  // =============================
  // FILE VALIDATION
  // =============================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/x-m4a",
      "audio/ogg",
      "audio/webm",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("Format invalide. Utilisez MP3, WAV, M4A ou OGG.");
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 100MB).");
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess(false);
  };

  // =============================
  // UPLOAD + PROCESSING
  // =============================
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProcessing(false);
    setSuccess(false);
    setProgress(0);
    setError("");

    try {
      await apiService.uploadAudio(
        file,
        (p) => setProgress(p),
        language
      );

      setUploading(false);
      setProcessing(true);

      // simulation attente résultat backend
      setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
      }, 2500);

    } catch (err) {
      console.error(err);
      setUploading(false);
      setProcessing(false);
      setError("Erreur durant l’upload.");
    }
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Upload Audio
            </h1>
            <p className="text-sm text-gray-500">
              Transcription intelligente + résumé IA
            </p>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Sélectionner un fichier audio
          </h2>

          {/* DROPZONE */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-purple-500 transition">
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <label
              htmlFor="audio-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <FileAudio className="text-purple-600" size={28} />
              </div>

              <p className="font-medium text-gray-800">
                {file ? file.name : "Cliquez pour choisir votre fichier"}
              </p>

              <p className="text-sm text-gray-400 mt-1">
                MP3 • WAV • M4A • OGG • max 100MB
              </p>
            </label>
          </div>

          {/* FILE INFO */}
          {file && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
              {(file.size / 1024 / 1024).toFixed(2)} MB sélectionné
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* UPLOADING */}
          {uploading && (
            <div className="mt-5">
              <div className="flex justify-between text-sm mb-2">
                <span>Upload en cours...</span>
                <span>{progress}%</span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {processing && (
            <div className="mt-5 bg-blue-50 text-blue-700 rounded-xl p-4 flex items-center gap-3">
              <Loader2 size={18} className="animate-spin" />
              Analyse audio, transcription et résumé en cours...
            </div>
          )}

          {/* BUTTON */}
          {file && !uploading && !processing && !success && (
            <button
              onClick={handleUpload}
              className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition"
            >
              Lancer la transcription
            </button>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mt-5 bg-green-50 text-green-700 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} />
                Audio transcrit avec succès - aller au résultat.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={18} />
            <h2 className="font-semibold text-gray-900">
              Paramètres
            </h2>
          </div>

          {/* LANG */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Langue
            </label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* SPEAKER */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Détection intervenants
            </span>

            <button
              onClick={() =>
                setSpeakerDetection(!speakerDetection)
              }
              className={`w-12 h-6 rounded-full transition relative ${
                speakerDetection
                  ? "bg-purple-600"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                  speakerDetection
                    ? "left-7"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          {/* INFO */}
          <div className="mt-6 bg-purple-50 rounded-xl p-4 text-sm text-purple-700 flex gap-2">
            <Sparkles size={16} className="mt-0.5" />
            Résultat inclus :
            transcription complète + résumé automatique.
          </div>

          <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-700 flex gap-2">
            <Info size={16} className="mt-0.5" />
            Temps moyen de traitement : 1 à 2 minutes.
          </div>
        </div>
      </div>
    </div>
  );
}