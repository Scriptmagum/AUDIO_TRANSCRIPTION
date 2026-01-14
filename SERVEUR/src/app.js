import express from "express";
import cors from "cors";
import meetingRoutes from "./routes/meeting.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/meeting", meetingRoutes);

export default app;
