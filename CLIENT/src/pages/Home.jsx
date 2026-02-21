import { Link } from "react-router-dom";
import { Mic, ArrowRight, CheckCircle } from "lucide-react";
import apiService from "../services/api";
import { useEffect, useState } from "react";

export default function Home() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(apiService.isAuthenticated());
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation simple mais élégante */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎙️</span>
              <span className="font-semibold text-xl text-gray-800">MeetingAI</span>
            </div>
            <div className="flex items-center gap-4">
              {hasToken ? (
                <Link
                  to="/upload"
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                
                  <Link
                    to="/apikey"
                    className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm"
                  >
                    Commencer
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section avec un peu de style */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full text-sm text-purple-700 mb-6">
            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
            Bienvenue sur MeetingAI, un service de transcription et résumé intelligent de réunions.
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Transformez vos réunions en{' '}
            <span className="text-purple-600">texte</span>
          </h1>
          
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Upload votre fichier audio, obtenez la transcription et un résumé intelligent. 
            Simple, rapide, gratuit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              to="/apikey"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-sm w-full sm:w-auto"
            >
              Commencer maintenant
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="text-gray-500 hover:text-gray-700 px-8 py-3 font-medium border border-gray-200 rounded-lg hover:border-gray-300 transition w-full sm:w-auto"
            >
              Comment ça marche
            </a>
          </div>

          {/* Stats simples avec un peu de style */}
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
              <span>2min traitement</span>
            </div>
          </div>
        </div>

        {/* Carte de preview avec un peu de style */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mic size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">team-meeting.mp3</div>
                <div className="text-xs text-gray-400">12.4 MB • 24 min</div>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Traitement...</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 w-12">00:12</span>
                <span className="font-medium text-gray-700 w-16">John:</span>
                <span className="text-gray-500">Welcome everyone to today's meeting...</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 w-12">00:18</span>
                <span className="font-medium text-gray-700 w-16">Sarah:</span>
                <span className="text-gray-500">Let's review the Q2 metrics...</span>
              </div>
              <div className="flex items-start gap-2 opacity-60">
                <span className="text-xs text-gray-400 w-12">00:24</span>
                <span className="font-medium text-gray-700 w-16">Mike:</span>
                <span className="text-gray-500">User engagement is up 23%...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment ça marche - section simple mais stylée */}
      <div id="how-it-works" className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
            Comment ça marche ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: "1",
                title: "Générez votre token",
                description: "Un token unique pour vous identifier",
                color: "purple"
              },
              {
                number: "2",
                title: "Upload votre audio",
                description: "MP3, WAV ou M4A jusqu'à 100MB",
                color: "blue"
              },
              {
                number: "3",
                title: "Récupérez le résultat",
                description: "Transcription + PDF téléchargeable",
                color: "green"
              }
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 bg-${step.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <span className={`text-xl font-bold text-${step.color}-600`}>{step.number}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA simple mais qui attire l'attention */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-purple-600 rounded-2xl p-8 text-center shadow-md">
          <h2 className="text-2xl font-bold text-white mb-2">
            Prêt à essayer ?
          </h2>
          <p className="text-purple-100 mb-6">
            Générer votre token gratuitement en 1 clic.
          </p>
          <Link
            to="/apikey"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
          >
            Générer mon token
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Footer minimal mais joli */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">
            Fait avec <span className="text-red-400">❤️</span> pour des réunions plus productives
          </p>
        </div>
      </footer>
    </div>
  );
}