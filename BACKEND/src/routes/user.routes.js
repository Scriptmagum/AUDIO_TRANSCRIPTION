const express = require('express');
const router = express.Router();
const { createApiKey } = require('../controllers/user.controller');
//const { identifier } = require("../middlewares/identification");

/**
 * @swagger
 * /user/apikey:
 *   post:
 *     summary: Crée une nouvelle clé API pour l'utilisateur
 *     tags:
 *       - User
 *     responses:
 *       201:
 *         description: Clé API créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 apiKey:
 *                   type: string
 *                   description: La nouvelle clé API générée
 *                 message:
 *                   type: string
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/apikey', createApiKey);

module.exports = router;