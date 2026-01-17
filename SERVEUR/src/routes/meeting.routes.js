import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { processMeeting } from "../controllers/meeting.controller.js";
const router = express.Router();


//Route pour l'upload audio
router.post(
  "/audio",
  upload.single("file"),
  processMeeting
);



export default router;
