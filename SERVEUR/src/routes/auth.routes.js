import express from "express";
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
router.get("/token", (req, res) => {
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
