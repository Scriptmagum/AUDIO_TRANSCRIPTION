import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import meetingRoutes from "./routes/meeting.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/meeting", meetingRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" , message: "Bienvenue sur le backend de Meeting AI" });
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
