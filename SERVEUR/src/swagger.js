// swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Meeting AI API",
      version: "1.0.0",
      description: "API publique pour la transcription et génération de résumé PDF"
    },
    servers: [
      { url: "http://localhost:3001" }
    ],
    // Suppression de securitySchemes et security car l'authentification se fait via cookies
    // et on ne veut plus afficher le bouton Authorize dans Swagger UI
    // components: {},
    // security: []
  },
  // Résoudre le chemin depuis le répertoire de travail pour s'assurer
  // que swagger-jsdoc trouve bien les fichiers quand on lance le serveur
  apis: [path.join(process.cwd(), "src", "routes", "*.js")]
};

const specs = swaggerJsdoc(options);

const swaggerUiMiddleware = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};

module.exports = { specs, swaggerUiMiddleware };
