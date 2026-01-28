import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { transcribeAudio, summarizeMeeting } from "../controllers/meeting.controller.js";
const router = express.Router();



router.post("/transcribe", upload.single("audio"), transcribeAudio);
router.post("/summarize", summarizeMeeting);

export default router;
