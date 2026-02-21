import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { processMeeting,getMeetingResult ,sendPdf} from "../controllers/meeting.controller.js";
const router = express.Router();

/**
 * @swagger
 * /meeting/process/{lang}:
 *   post:
 *     summary: Upload un audio et retourne la transcription avec résumé dans la langue spécifiée
 *     tags:
 *       - Meeting
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lang
 *         required: true
 *         schema:
 *           type: string
 *           enum: [fr, en, de, es]
 *         description: Code de langue (fr=french, en=english, de=german, es=spanish)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Transcription terminée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 uuid:
 *                   type: string
 *                 files:
 *                   type: object
 *       400:
 *         description: Erreur de traitement
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/process/:lang",
  upload.single("file"),
  processMeeting
);


/**
 * @swagger
 * /meeting/result:
 *   get:
 *     summary: Récupère la transcription et l'URL du PDF généré pour l'utilisateur
 *     tags:
 *       - Meeting
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Transcription et lien vers le PDF
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uuid:
 *                   type: string
 *                   description: Identifiant unique de l'utilisateur
 *                 transcript:
 *                   type: string
 *                   description: Texte transcrit de la réunion
 *                 pdf_url:
 *                   type: string
 *                   description: URL pour récupérer le PDF
 *       404:
 *         description: Résultats non disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Résultats non disponibles"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erreur serveur"
 */
router.get("/result", getMeetingResult);

/**
 * @swagger
 * /meeting/result/pdf:
 *   get:
 *     summary: Télécharge le PDF généré du résumé de la réunion
 *     tags:
 *       - Meeting
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF du résumé
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF introuvable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "PDF introuvable"
 */
router.get("/result/pdf", sendPdf);


export default router;
