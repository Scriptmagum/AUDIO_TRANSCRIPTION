import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
/*
import {
  processMeeting
} from "../controllers/meeting.controller.js";
*/
const router = express.Router();



// l'unique route dont le front a besoin
/*
router.post(
  "/process",
  upload.single("audio"),
  processMeeting
);
*/

/* Pour des besoins de test ou d'usage avancé, on expose aussi les routes
   de transcription seule et de résumé seul */
   /*
router.post(
  "/transcribe",
  upload.single("audio"),
  transcribeOnly
);

router.post("/summarize", summarizeOnly);
*/
export default router;
