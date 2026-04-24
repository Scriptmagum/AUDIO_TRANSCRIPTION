const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const meetingRoutes = require("./routes/meeting.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes");
const { identifier } = require("./middlewares/identification");
const { swaggerUiMiddleware } = require("./swagger.js");

dotenv.config();

const app = express();

/* =============================
   MIDDLEWARES GLOBAUX
============================= */
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

swaggerUiMiddleware(app);

/* =============================
   HEALTH CHECK
============================= */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Meeting AI Backend"
  });
});

/* =============================
   PUBLIC ROUTES
============================= */
app.use("/auth", authRoutes);

/* =============================
   PROTECTED ROUTES
============================= */
app.use("/meeting", identifier, meetingRoutes);
app.use("/user", identifier, userRoutes);

/* =============================
   AUTH ME (IMPORTANT MANQUANT)
============================= */
app.get("/auth/me", identifier, (req, res) => {
  res.json({
    user: req.user
  });
});

/* =============================
   ERROR HANDLER
============================= */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

/* =============================
   DATABASE + START
============================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
========================================
  Meeting AI Backend running
========================================
  Port: ${PORT}
  Node: ${process.version}
========================================
  `);
});
