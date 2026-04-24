import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Key,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Loader,
} from "lucide-react";

import apiService from "../services/api";

export default function ApiKey() {
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // =====================================
  // LOAD USER DATA (auth/me)
  // =====================================
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiService.me();

        console.log("User data:", data);
        console.log("API Key:", data.user.apiKey);

        if (data.user.apiKey) {
      setApiKey(data.user.apiKey);
}
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer votre clé API.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // =====================================
  // GENERATE / REGENERATE
  // =====================================
  const handleGenerateToken = async () => {
    try {
      setGenerating(true);
      setError("");

      const data = await apiService.generateApiKey();

      setApiKey(data.apiKey);
      setShowKey(true);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la génération du jeton.");
    } finally {
      setGenerating(false);
    }
  };

  // =====================================
  // COPY
  // =====================================
  const handleCopy = async () => {
    if (!apiKey) return;

    await navigator.clipboard.writeText(apiKey);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              API Key
            </h1>
            <p className="text-sm text-gray-500">
              Générez et gérez votre clé API personnelle.
            </p>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Loader size={24} className="animate-spin mx-auto text-purple-600 mb-3" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      )}

      {/* CONTENT */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* ICON */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
              <Key className="text-purple-600" />
            </div>

            <h2 className="text-xl font-bold mt-4 text-gray-800">
              {apiKey ? "Votre clé API" : "Créer une clé API"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Utilisez cette clé pour authentifier votre bot Discord ou vos requêtes externes.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* NO KEY */}
          {!apiKey ? (
            <button
              onClick={handleGenerateToken}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition"
            >
              {generating ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Key size={18} />
                  Générer une clé API
                </>
              )}
            </button>
          ) : (
            <>
              {/* DISPLAY KEY */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    CLÉ API
                  </span>

                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-purple-600 font-medium"
                  >
                    {showKey ? "Masquer" : "Afficher"}
                  </button>
                </div>

                <code className="block break-all text-sm font-mono bg-white border border-gray-200 rounded-lg p-3">
                  {showKey ? apiKey : "•".repeat(48)}
                </code>
              </div>

              {/* ACTIONS */}
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="border border-gray-200 hover:bg-gray-50 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition"
                >
                  {copied ? (
                    <>
                      <Check size={18} className="text-green-500" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copier
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateToken}
                  disabled={generating}
                  className="bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw
                    size={18}
                    className={generating ? "animate-spin" : ""}
                  />
                  Régénérer
                </button>
              </div>

              {/* WARNING */}
              <div className="mt-6 bg-yellow-50 text-yellow-800 rounded-xl p-4 text-sm">
                ⚠️ Gardez cette clé secrète. Si elle fuit, régénérez-la immédiatement.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}