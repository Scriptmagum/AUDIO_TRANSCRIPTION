import { Link } from "react-router-dom";
import {
  Mic,
  ArrowRight,
  CheckCircle,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus
} from "lucide-react";

import apiService from "../services/api";
import { useEffect, useState } from "react";

export default function Home() {
  const [isAuth, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const ok = await apiService.isAuthenticated();
      setIsAuthenticated(ok);
      console.log("auth:", ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, []);

  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            {/* LOGO */}
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎙️</span>
              <span className="font-semibold text-xl text-gray-800">
                MeetingAI
              </span>
            </div>

            {/* AUTH ACTIONS */}
            <div className="flex items-center gap-3">

              {loading ? (
                <span className="text-sm text-gray-400">...</span>
              ) : isAuth ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>

                  <Link
                    to="/sign-out"
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    <LogIn size={16} />
                    Sign in
                  </Link>

                  <Link
                    to="/register"
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                  >
                    <UserPlus size={16} />
                    Register
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">

          <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full text-sm text-purple-700 mb-6">
            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
            Transcription & résumé automatique de réunions
          </div>

          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Transformez vos réunions en{" "}
            <span className="text-purple-600">résumés intelligents</span>
          </h1>

          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Uploadez un fichier audio et obtenez transcription + résumé IA en quelques secondes.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">

            {isAuth ? (
              <Link
                to="/dashboard"
                className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-sm w-full sm:w-auto"
              >
                Aller au dashboard
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-sm w-full sm:w-auto"
                >
                  Commencer gratuitement
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/sign-in"
                  className="text-gray-500 hover:text-gray-700 px-8 py-3 font-medium border border-gray-200 rounded-lg hover:border-gray-300 transition w-full sm:w-auto"
                >
                  Se connecter
                </Link>
              </>
            )}

          </div>

          {/* STATS */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <CheckCircle size={16} className="text-green-500" />
              <span>99% précision</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <CheckCircle size={16} className="text-green-500" />
              <span>multi-langues</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <CheckCircle size={16} className="text-green-500" />
              <span>rapide</span>
            </div>
          </div>

        </div>

        {/* PREVIEW */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mic size={20} className="text-purple-600" />
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700">
                  meeting.mp3
                </div>
                <div className="text-xs text-gray-400">
                  24 min • traitement IA
                </div>
              </div>

              <div className="ml-auto">
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Processing
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 w-12">00:12</span>
                <span className="font-medium text-gray-700 w-16">AI:</span>
                <span className="text-gray-500">Welcome everyone...</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 w-12">00:18</span>
                <span className="font-medium text-gray-700 w-16">AI:</span>
                <span className="text-gray-500">Let's review the report...</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* COMMENT ÇA MARCHE */}
      <div id="how-it-works" className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6 py-16">

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
            Comment ça marche ?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Créez un compte
              </h3>
              <p className="text-sm text-gray-500">
                Accédez à votre dashboard et votre API key.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Upload audio
              </h3>
              <p className="text-sm text-gray-500">
                MP3, WAV ou M4A jusqu’à 100MB.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Résultat
              </h3>
              <p className="text-sm text-gray-500">
                Transcription + résumé + PDF.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-purple-600 rounded-2xl p-8 text-center shadow-md">

          <h2 className="text-2xl font-bold text-white mb-2">
            Prêt à transformer vos réunions ?
          </h2>

          <p className="text-purple-100 mb-6">
            Créez votre compte et commencez gratuitement.
          </p>

          <Link
            to={isAuth ? "/dashboard" : "/register"}
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            {isAuth ? "Dashboard" : "Commencer"}
            <ArrowRight size={18} />
          </Link>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">
            Fait avec ❤️ pour améliorer les réunions
          </p>
        </div>
      </footer>

    </div>
  );
}