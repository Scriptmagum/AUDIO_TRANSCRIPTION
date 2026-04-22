import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const singupURL = 'http://localhost:3001/auth/signup';

  const navigateToHome = () => {
    nav('/');
  };

  const navigateToLogin = () => {
    nav('/login'); 
  };

  const handleRegister = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    try {
      const response = await fetch(singupURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) { 
        alert("Compte créé avec succès !"); 
        
      } else {
        alert("Erreur : " + (data.message || data.error || "Inscription échouée"));
      }
    } catch (error) {
      console.error("Erreur de connexion :", error);
      alert("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white font-sans flex flex-col items-center justify-center relative overflow-hidden px-4">
      


     
      <div className="absolute top-8 left-4 md:left-8 z-20">
        <button 
          onClick={navigateToHome}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="text-sm font-semibold hidden sm:inline">Retour</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Inscription</h1>
          <p className="text-sm text-gray-400 mt-2">Créez votre compte utilisateur</p>
        </div>

        <div className="bg-[#121214] border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 tracking-wider">ADRESSE E-MAIL</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nom@exemple.com"
                className="w-full bg-[#09090b] border border-gray-700 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-yellow-500 transition-all placeholder-gray-600"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 tracking-wider">MOT DE PASSE</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#09090b] border border-gray-700 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-yellow-500 transition-all placeholder-gray-600"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 mt-2 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/20'
              }`}
            >
              <span>{loading ? "Création en cours..." : "S'inscrire"}</span>
              {!loading && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              <button onClick={navigateToLogin} className="text-yellow-500 font-bold hover:text-yellow-400 transition-colors">
                Se connecter
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;