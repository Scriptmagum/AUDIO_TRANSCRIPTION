// swagger.js
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
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
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ BearerAuth: [] }]
  },
  // Résoudre le chemin depuis le répertoire de travail pour s'assurer
  // que swagger-jsdoc trouve bien les fichiers quand on lance le serveur
  apis: [path.join(process.cwd(), "src", "routes", "*.js")]
};

export const specs = swaggerJsdoc(options);

export const swaggerUiMiddleware = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};
