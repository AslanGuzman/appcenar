import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AppCenar",
      version: "1.0.0",
      description:
        "API RESTful para la gestión integral de la plataforma de pedidos AppCenar: usuarios, roles, comercios, productos, pedidos, direcciones y configuraciones.",
    },
    servers: [
      {
        url: `${process.env.APP_URL || "http://localhost:8080"}`,
        description: "Servidor actual",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
