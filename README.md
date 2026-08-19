# AppCenar

Plataforma de pedidos a domicilio con cuatro roles —cliente, comercio, repartidor y administrador— construida sobre una única base de código que expone dos interfaces: un **sitio web** renderizado con Handlebars y sesiones, y una **API REST** con JWT documentada en Swagger. Ambas capas comparten los mismos modelos de Mongoose, de modo que una operación realizada desde cualquiera de las dos se refleja en la otra.

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js ≥ 18 (ESM) |
| Framework | Express 4 |
| Base de datos | MongoDB 7 · Mongoose 8 |
| Vistas | Express Handlebars |
| Autenticación | JWT (API) · express-session + connect-mongo (web) |
| Documentación | Swagger (swagger-jsdoc + swagger-ui-express) |
| Validación | express-validator |
| Archivos | Multer |
| Correo | Nodemailer (SMTP) · API HTTP de Brevo como alternativa |

## Requisitos

- Node.js 18 o superior
- MongoDB 7 (se incluye un `docker-compose.yml` listo para usar)

## Inicio rápido

```bash
git clone <url-del-repositorio>
cd appcenar
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

`docker compose up -d` levanta solo MongoDB, que es lo que necesita el flujo de desarrollo. Para ejecutar además la aplicación dentro de Docker:

```bash
docker compose --profile full up -d
```

| Recurso | URL |
|---|---|
| Sitio web | http://localhost:8080 |
| API | http://localhost:8080/api |
| Documentación Swagger | http://localhost:8080/api-docs |
| Health check | http://localhost:8080/health |

Al arrancar se crean automáticamente el administrador por defecto y la configuración de ITBIS.

## Configuración

El archivo cargado depende de `NODE_ENV`: `development` → `.env`, `qa` → `.env.qa`, `production` → `.env.production`. Cada entorno debe apuntar a una base de datos distinta; usa `.env.example` y `.env.qa.example` como plantillas. Las variables ya presentes en el entorno tienen prioridad, por lo que en un PaaS se inyectan desde el panel del servicio y estos archivos nunca contienen secretos reales.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto `8080`) |
| `APP_URL` | URL pública; se usa para construir los enlaces de los correos |
| `MONGO_URI` | Cadena de conexión a MongoDB |
| `JWT_SECRET` · `JWT_EXPIRES_IN` | Firma y vigencia de los tokens de la API |
| `SESSION_SECRET` | Firma de las cookies de sesión del sitio web |
| `EMAIL_TRANSPORT` | `nodemailer` (por defecto) o `brevo-api` |
| `EMAIL_FROM` · `EMAIL_FROM_NAME` | Remitente de los correos |
| `EMAIL_SERVICE` | Proveedor conocido para Nodemailer (`gmail`, `outlook`, …) |
| `EMAIL_HOST` · `EMAIL_PORT` | SMTP genérico, alternativa a `EMAIL_SERVICE` |
| `EMAIL_USER` · `EMAIL_PASS` | Credenciales SMTP |
| `BREVO_API_KEY` | Clave de la API de Brevo (solo si `EMAIL_TRANSPORT=brevo-api`) |
| `DEFAULT_ADMIN_*` | Credenciales del administrador creado al arrancar |
| `DEFAULT_ITBIS` | Porcentaje de impuesto aplicado a los pedidos |
| `SEED_DEMO_DATA` | Siembra de datos de demostración (`true` / `false`) |

### Correo

Los correos de activación de cuenta y de restablecimiento de contraseña se envían con **Nodemailer**. El transporte se elige con `EMAIL_TRANSPORT`:

- **`nodemailer`** (por defecto): envío por SMTP. Usa `EMAIL_SERVICE=gmail` con una contraseña de aplicación, o `EMAIL_HOST` y `EMAIL_PORT` para un servidor genérico.
- **`brevo-api`**: envío por HTTPS contra la API de Brevo. Pensado para plataformas que bloquean los puertos SMTP en sus planes básicos; requiere `BREVO_API_KEY` y un remitente verificado en *Senders*.

Ambos transportes comparten la misma interfaz, así que cambiar de uno a otro solo requiere ajustar variables de entorno.

Al arrancar, el servidor valida la configuración y lo reporta en consola. Si falta o es inválida, la aplicación sigue funcionando con normalidad y solo se omite el envío de correos.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor en modo desarrollo con recarga automática |
| `npm start` | Servidor en modo producción |
| `npm run start:qa` · `start:production` | Arranque forzando el entorno correspondiente |
| `npm run seed` | Siembra los datos de demostración sin levantar el servidor |
| `npm run seed:qa` · `seed:production` | Siembra en el entorno correspondiente |

## Datos de demostración

Con `SEED_DEMO_DATA=true` se crean cuatro tipos de comercio, cuatro comercios con sus catálogos, dos clientes, dos repartidores y tres pedidos de ejemplo. El seeder es idempotente: no duplica nada si los datos ya existen.

Todas las cuentas de demostración usan la contraseña `Demo123!`.

| Rol | Usuarios |
|---|---|
| Cliente | `ana_demo` · `luis_demo` |
| Comercio | `parrillada_demo` · `farmacia_demo` · `super_demo` · `cafearoma_demo` |
| Repartidor | `carlos_demo` · `maria_demo` |

Para una base limpia, define `SEED_DEMO_DATA=false`. El administrador y la configuración de ITBIS se crean siempre.

## Estructura

```
src/
├─ config/        Conexión a MongoDB, carga de entorno y Swagger
├─ models/        Esquemas de Mongoose compartidos por ambas capas
├─ controllers/   Lógica de la API (JSON)
├─ routes/        Endpoints de la API con anotaciones Swagger
├─ validators/    Reglas de express-validator (API y formularios web)
├─ middlewares/   Autenticación JWT, validación, uploads y errores
├─ services/      Reglas de negocio compartidas por la API y el sitio web
├─ seeders/       Administrador por defecto, configuración y datos demo
├─ utils/         Respuestas, errores, paginación y constantes
├─ views/         Plantillas Handlebars por rol
├─ web/           Sitio web: controladores, rutas y middlewares de sesión
├─ app.js         Configuración de Express
└─ server.js      Punto de entrada
```

## Arquitectura

El proyecto sigue MVC con una capa de servicios intermedia. Los controladores —tanto los de la API en `src/controllers/` como los del sitio web en `src/web/controllers/`— se limitan a leer la petición, delegar en un servicio y traducir el resultado al formato de su interfaz: JSON en la API, `render` y mensajes flash en la web.

Toda la regla de negocio vive una sola vez en `src/services/`: registro y activación de cuentas, cálculo de subtotal/ITBIS/total, asignación y liberación de repartidores, métricas del panel y el borrado en cascada de tipos de comercio. Los servicios lanzan `AppError` con su código HTTP; la API lo propaga al manejador central de errores y la web lo convierte en un mensaje flash. Es la única diferencia de comportamiento entre ambas capas, y por eso el sitio web y la API nunca se contradicen.

## Reglas de negocio

- Las cuentas nacen inactivas y requieren confirmación por correo para iniciar sesión.
- `userName` y `email` son únicos en todo el sistema.
- Todos los productos de un pedido deben pertenecer al mismo comercio.
- El total se calcula como `subtotal + (subtotal × ITBIS / 100)` con el ITBIS vigente en `Configurations`.
- Un repartidor solo puede tener un pedido en curso a la vez; al completarlo vuelve a estar disponible.
- La dirección de entrega deja de mostrarse al repartidor una vez completado el pedido.
- El administrador autenticado no puede editarse ni cambiar su propio estado, y el administrador por defecto es inmutable.
- Eliminar un tipo de comercio arrastra en cascada sus comercios, usuarios, catálogos, pedidos y favoritos.
- Los listados admiten `page`, `pageSize`, `search`, `sortBy` y `sortDirection`.

## Despliegue

La aplicación no requiere configuración adicional más allá de las variables de entorno. Se ejecuta con `npm start` sobre `NODE_ENV=production` y confía en el proxy inverso de la plataforma para la terminación TLS.

Antes de desplegar, define en el panel del proveedor `MONGO_URI`, `APP_URL`, `JWT_SECRET`, `SESSION_SECRET` y las tres variables de correo. Ninguna de ellas debe versionarse en el repositorio.
