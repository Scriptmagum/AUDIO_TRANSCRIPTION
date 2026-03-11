import express from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const router = express.Router();


/**
 * @swagger
 * /auth/token:
 *   get:
 *     summary: Génère un token unique pour l'utilisateur
 *     tags:
 *       - Auth
 *     security: []
 *     responses:
 *       200:
 *         description: Token généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 uuid:
 *                   type: string
 */

const tokenLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 heures (1 jour)
    max: 5, // 5 requêtes max
    message: {
        error: "Trop de requêtes. Limite de 5 tokens par jour."
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Utiliser l'IP ou l'utilisateur
        console.log(req.ip);
        return req.ip || req.connection.remoteAddress;
    }
});
router.get("/token",tokenLimiter, (req, res) => {
  const uuid = uuidv4();

  const token = jwt.sign(
    { uuid },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const userDir = path.join("storage", uuid);
  fs.mkdirSync(userDir, { recursive: true });

  res.json({
    token,
    uuid
  });
});

export default router;