import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sparkles,
  History,
  Mic,
} from "lucide-react";
import apiService from "../services/api";

export default function Result() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  const loadResult = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiService.getResult();
      setData(result);
    } catch (err) {
      setError("Impossible de récupérer le résultat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, []);

  const handleDownload = async () => {
    try {
      setPdfLoading(true);
      await apiService.downloadPdf();
    } catch {
      setError("Téléchargement impossible.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Results
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Transcription, résumé intelligent et exports.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadResult}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={handleDownload}
              disabled={pdfLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              <Download size={16} />
              {pdfLoading ? "Export..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* FUTURE FEATURES */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <FileText size={18} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Transcription</h3>
          <p className="text-sm text-gray-500 mt-1">
            Disponible maintenant.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Sparkles size={18} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Summarization</h3>
          <p className="text-sm text-gray-500 mt-1">
            Feature à venir : résumé IA avancé.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <History size={18} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-800">History</h3>
          <p className="text-sm text-gray-500 mt-1">
            Feature à venir : historique complet.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <Mic size={18} className="text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Live Notes</h3>
          <p className="text-sm text-gray-500 mt-1">
            Feature à venir : réunion live.
          </p>
        </div>
      </div>

      {/* STATUS */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <RefreshCw
            size={26}
            className="animate-spin mx-auto text-purple-600 mb-3"
          />
          <p className="text-gray-600">Chargement...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {!loading && !error && data && (
        <>
          {/* SUMMARY */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-green-600" />
              <h2 className="font-semibold text-gray-800">
                AI Summary
              </h2>
            </div>

            <p className="text-gray-700 leading-7 whitespace-pre-line">
              {data.summary || "Résumé bientôt disponible."}
            </p>
          </div>

          {/* TRANSCRIPTION */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-purple-600" />
              <h2 className="font-semibold text-gray-800">
                Full Transcription
              </h2>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-7 whitespace-pre-line max-h-[600px] overflow-auto">
              {data.transcript || "Transcription vide."}
            </div>
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FileText size={28} className="mx-auto text-gray-400 mb-3" />
          <h3 className="font-semibold text-gray-700 mb-2">
            Aucun résultat
          </h3>
          <p className="text-sm text-gray-500">
            Lance un upload audio depuis le Dashboard.
          </p>
        </div>
      )}
    </div>
  );
}