// =============================
// IMPORTS EXPRESS
// =============================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import meetingRoutes from "./routes/meeting.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { swaggerUiMiddleware } from "./swagger.js";

dotenv.config();

const app = express();
swaggerUiMiddleware(app);
app.use(cors());
app.use(express.json());

app.use("/meeting",authMiddleware , meetingRoutes);
app.use("/auth", authRoutes);
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Bienvenue sur le backend de Meeting AI",
  });
});

// Middleware global de gestion des erreurs: renvoie JSON au lieu d'une page HTML
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 400;
  res.status(status).json({ error: err && err.message ? err.message : "Erreur serveur" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT,'127.0.0.1', () => {
  console.log(`
========================================
   Meeting AI Backend démarré
========================================
   Port: ${PORT}
   Node.js: ${process.version}
   API Key: ${process.env.OPENAI_API_KEY ? 'Configurée' : 'Manquante'}
========================================
  `);
});