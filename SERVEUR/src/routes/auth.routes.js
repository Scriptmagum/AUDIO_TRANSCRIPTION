const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const authController = require("../controllers/auth.controller");
const { identifier } = require("../middlewares/identification");

const router = express.Router();




/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *               password:
 *                 type: string
 *                 description: Mot de passe de l'utilisateur
 *     responses:
 *       200:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   description: Informations de l'utilisateur créé
 *       400:
 *         description: Erreur de validation ou utilisateur existant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/signup', authController.signup);

<<<<<<< HEAD
const tokenLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 heures (1 jour)
    max: 5, // 5 requêtes max
    message: {
        error: "Trop de requêtes. Limite de 5 tokens par jour."
    },
    standardHeaders: true,
    legacyHeaders: false,
    /*keyGenerator: (req) => {
        // Utiliser l'IP ou l'utilisateur
        console.log(req.ip);
        return req.ip || req.connection.remoteAddress;
    /*}*/
});
router.get("/token",tokenLimiter, (req, res) => {
  const uuid = uuidv4();
=======
/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Connexion d'un utilisateur existant
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *               password:
 *                 type: string
 *                 description: Mot de passe de l'utilisateur
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/signin', authController.signin);
>>>>>>> origin/backend-transcript

/**
 * @swagger
 * /auth/signout:
 *   post:
 *     summary: Déconnexion de l'utilisateur
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/signout', identifier, authController.signout);



module.exports = router;