import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiService from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      await apiService.signup(email, password);
      navigate("/sign-in");
    } catch (err) {
      setError("Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">

        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Create account
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

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            {loading ? "Création..." : "Créer un compte"}
          </button>

        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Déjà un compte ?{" "}
          <Link to="/sign-in" className="text-purple-600">
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  );
}