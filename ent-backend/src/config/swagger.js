const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ENT Testing API",
      version: "1.0.0",
      description: "API for ENT (Unified National Testing) application",
      contact: {
        name: "API Support",
        email: "support@enttesting.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid", // or whatever cookie name you use for authentication
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/*.js",
    "./src/models/*.js",
    "./src/config/swagger-tags.js",
  ], // Path to the API docs
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
