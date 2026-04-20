// =============================
// IMPORTS EXPRESS
// =============================
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const meetingRoutes = require("./routes/meeting.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require('./routes/user.routes');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { identifier } = require("./middlewares/identification");
const { swaggerUiMiddleware } = require("./swagger.js");

dotenv.config();

const app = express();

// =============================
// CONFIGURATION CORS
// =============================
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Port par défaut de Vite
  credentials: true, // Permet l'envoi des cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// =============================
// SWAGGER
// =============================
swaggerUiMiddleware(app);

// =============================
// CONNEXION À LA BASE DE DONNÉES
// =============================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connecté à MongoDB"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

// =============================
// ROUTES
// =============================      
app.use("/meeting", identifier, meetingRoutes);
app.use("/auth", authRoutes);
app.use("/user", identifier, userRoutes);

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Bienvenue sur le backend de Meeting AI",
  });
});

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 400;
  res.status(status).json({ error: err && err.message ? err.message : "Erreur serveur" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
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