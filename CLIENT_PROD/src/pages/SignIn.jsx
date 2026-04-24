import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import apiService from "../services/api";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
    await apiService.signin(email, password);
    console.log("Login successful");
    navigate("/dashboard");
  } catch (err) {
    console.log("Erreur complète:", err); // 👈 Log pour debug
    console.log("Message d'erreur:", err.message);
    setError("Email ou mot de passe incorrect"); // 👈 Affiche le vrai message
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">

        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Sign in
        </h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Pas de compte ?{" "}
          <Link to="/register" className="text-purple-600">
            S'inscrire
          </Link>
        </p>

      </div>
    </div>
  );
}