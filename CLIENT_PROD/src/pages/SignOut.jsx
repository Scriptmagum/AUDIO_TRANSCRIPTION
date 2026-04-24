import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

export default function SignOut() {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        await apiService.signout();
      } catch (err) {
        console.error(err);
      } finally {
        navigate("/");
      }
    };

    logout();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Déconnexion...
    </div>
  );
}