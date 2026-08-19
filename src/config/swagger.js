import swaggerJSDoc from "swagger-jsdoc";

const stringParam = (name, location, description, extra = {}) => ({
  name,
  in: location,
  description,
  schema: { type: "string", ...extra },
});

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
      parameters: {
        Id: {
          name: "id",
          in: "path",
          required: true,
          description: "Identificador del recurso",
          schema: { type: "string" },
        },
        Page: {
          name: "page",
          in: "query",
          description: "Número de página (por defecto 1)",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        PageSize: {
          name: "pageSize",
          in: "query",
          description: "Elementos por página (máximo 100)",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
        },
        Search: stringParam("search", "query", "Texto a buscar"),
        SortBy: stringParam("sortBy", "query", "Campo por el cual ordenar"),
        SortDirection: {
          name: "sortDirection",
          in: "query",
          description: "Dirección del ordenamiento",
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
        },
        IsActive: {
          name: "isActive",
          in: "query",
          description: "Filtrar por estado del usuario",
          schema: { type: "boolean" },
        },
        OrderStatus: {
          name: "status",
          in: "query",
          description: "Filtrar por estado del pedido",
          schema: { type: "string", enum: ["Pending", "InProgress", "Completed"] },
        },
      },
      responses: {
        BadRequest: { description: "Datos inválidos o regla de negocio incumplida" },
        Unauthorized: { description: "Token ausente, inválido o expirado" },
        Forbidden: { description: "El rol autenticado no tiene permisos" },
        NotFound: { description: "Recurso no encontrado" },
        Conflict: { description: "Conflicto con el estado actual del recurso" },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object", nullable: true },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: {
              type: "array",
              nullable: true,
              items: {
                type: "object",
                properties: { field: { type: "string" }, message: { type: "string" } },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            pageSize: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Registro, inicio de sesión y recuperación de contraseña" },
      { name: "Account", description: "Perfil del usuario autenticado" },
      { name: "Commerce Catalog", description: "Catálogo visible para el cliente" },
      { name: "Orders", description: "Pedidos de cliente, comercio y delivery" },
      { name: "Addresses", description: "Direcciones del cliente autenticado" },
      { name: "Favorites", description: "Comercios favoritos del cliente" },
      { name: "Categories", description: "Categorías del comercio autenticado" },
      { name: "Products", description: "Productos del comercio autenticado" },
      { name: "Admin Dashboard", description: "Indicadores del administrador" },
      { name: "Admin Users", description: "Administración de usuarios del sistema" },
      { name: "Configurations", description: "Configuraciones del sistema (ITBIS)" },
      { name: "Commerce Types", description: "Mantenimiento de tipos de comercio" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
