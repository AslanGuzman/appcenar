# AppCenar

Plataforma de pedidos de comida **AppCenar**: app web completa (Handlebars + sesiones) y API RESTful (JWT + Swagger), construidas con **Node.js**, **Express**, **MongoDB/Mongoose**, en arquitectura **MVC**, dentro de un mismo proyecto.

Este entregable contiene **todo el sistema funcional**: los cuatro roles (Cliente, Comercio, Delivery, Administrador) con sus pantallas web, más la API completa documentada en Swagger.

## 1. Estructura del proyecto

```
appcenar/
├─ public/
│  ├─ css/                    # Estilos del sitio web
│  └─ uploads/                # Imágenes subidas (perfil, logos, productos, etc.)
├─ src/
│  ├─ config/                  # Conexión a BD y Swagger
│  ├─ controllers/             # Lógica de negocio de la API (JSON)
│  ├─ middlewares/             # Auth (JWT), validaciones, uploads, errores
│  ├─ models/                  # Esquemas de Mongoose (compartidos por web y API)
│  ├─ routes/                  # Endpoints de la API + docs Swagger
│  ├─ seeders/                  # Datos iniciales (admin por defecto, ITBIS)
│  ├─ services/                 # Email (Nodemailer) y tokens (JWT/random)
│  ├─ utils/                    # Helpers de respuesta, errores, paginación, constantes
│  ├─ validators/               # Reglas de express-validator (API)
│  ├─ views/                    # Vistas Handlebars del sitio web
│  │  ├─ layouts/                # main.hbs (con menú) y auth.hbs (login/registro)
│  │  ├─ partials/                # navbar, mensajes flash
│  │  ├─ auth/, client/, commerce/, delivery/, admin/   # pantallas por rol
│  ├─ web/                      # Sitio web (sesiones, no JWT)
│  │  ├─ controllers/             # Lógica de negocio que renderiza vistas
│  │  ├─ middlewares/             # requireAuth, requireRole (sesión)
│  │  └─ routes/                  # Rutas del sitio por rol
│  ├─ app.js                    # Configuración de Express (web + API)
│  └─ server.js                 # Punto de entrada
├─ .env.example
├─ .gitignore
├─ docker-compose.yml
└─ package.json
```

## 2. Instalación

```bash
npm install
```

Copia el archivo de variables de entorno y ajusta los valores:

```bash
cp .env.example .env
cp .env.example .env.qa
```

Variables clave:
- `MONGO_URI`: cadena de conexión a MongoDB (usa una base distinta en `.env` y `.env.qa`).
- `JWT_SECRET`: clave para firmar los tokens.
- `EMAIL_USER` / `EMAIL_PASS`: credenciales para el envío de correos (si usas Gmail, genera una "contraseña de aplicación").
- `DEFAULT_ADMIN_*`: credenciales del administrador que se crea automáticamente al levantar el servidor.

## 3. Base de datos: MongoDB con Docker + MongoDB Compass

No necesitas instalar MongoDB directamente en Windows. La base de datos corre dentro de un contenedor Docker, y usas **MongoDB Compass** (interfaz gráfica) para administrarla y verificar que todo esté guardándose bien.

### 3.1 Instalar Docker Desktop

1. Descarga Docker Desktop para Windows: https://www.docker.com/products/docker-desktop/
2. Durante la instalación, deja activada la opción de usar el backend **WSL 2** (Docker te guiará si falta algo).
3. Reinicia si te lo pide y abre Docker Desktop. Debe quedar corriendo en segundo plano (ícono de la ballena en la barra de tareas).

### 3.2 Levantar MongoDB con Docker Compose

Desde la raíz del proyecto (`appcenar/`), donde está el archivo `docker-compose.yml`:

```powershell
docker compose up -d
```

Esto descarga la imagen oficial de `mongo:7` y levanta un contenedor llamado `appcenar-mongo`, escuchando en el puerto `27017` de tu máquina — el mismo que ya está configurado en tu `.env` (`MONGO_URI=mongodb://127.0.0.1:27017/appcenar_dev`), así que **no tienes que cambiar nada** en las variables de entorno.

Verificar que el contenedor está corriendo:

```powershell
docker ps
```

Deberías ver `appcenar-mongo` con estado `Up (healthy)` — el `healthcheck` del contenedor confirma que Mongo ya está listo para aceptar conexiones antes de que levantes la app.

Otros comandos útiles:

```powershell
docker compose stop      # detener el contenedor sin borrar los datos
docker compose up -d      # volver a levantarlo
docker compose down       # detener y eliminar el contenedor (los datos persisten en el volumen)
docker compose logs -f    # ver logs de mongo en vivo
```

Los datos se guardan en un volumen de Docker llamado `mongo-data`, así que **persisten aunque apagues el contenedor o la computadora** — solo se pierden si haces `docker compose down -v` o borras el volumen manualmente.

### 3.3 Instalar y usar MongoDB Compass

Compass es solo la interfaz gráfica; se instala aparte del contenedor.

1. Descárgalo aquí: https://www.mongodb.com/try/download/compass
2. Instálalo y ábrelo.
3. En la pantalla de conexión, usa esta cadena:
   ```
   mongodb://localhost:27017
   ```
4. Dale clic en **Connect**.
5. Corre el proyecto (`npm run dev`) al menos una vez — Mongoose crea las bases (`appcenar_dev`, y `appcenar_qa` si usas ese entorno) y las colecciones automáticamente la primera vez que se guarda un documento (por ejemplo, al crearse el admin por defecto al arrancar el servidor).
6. En Compass, en el panel izquierdo verás la base `appcenar_dev` con las colecciones: `users`, `commerces`, `commercetypes`, `categories`, `products`, `orders`, `addresses`, `favorites`, `configurations`. Puedes entrar a cada una para ver, editar o borrar documentos manualmente mientras pruebas.

### 3.4 Compartir esta configuración con tu compañero

Como el `docker-compose.yml` va en el repositorio (no es un secreto), tu compañero solo necesita:

```powershell
git clone https://github.com/TU_USUARIO/appcenar.git
cd appcenar
docker compose up -d
npm install
cp .env.example .env
npm run dev
```

Y tendrá exactamente la misma base de datos funcionando en su máquina, sin instalar Mongo manualmente.

## 4. Ejecutar el proyecto

```bash
npm run dev        # entorno development, con nodemon
npm run start:qa    # entorno qa
```

La API queda disponible en `http://localhost:8080/api` y la documentación interactiva en:

```
http://localhost:8080/api-docs
```

## 5. Datos de demostración (seeds)

Al levantar el servidor por primera vez (`npm run dev`), además del administrador y la configuración de ITBIS, se crean automáticamente **datos de prueba completos** para que no tengas que registrar todo a mano: 4 tipos de comercio, 4 comercios (cada uno con categorías y productos), 2 clientes (con direcciones), 2 deliveries y 3 pedidos de ejemplo (uno en cada estado: pendiente, en proceso y completado).

Esto solo ocurre **una vez**: si ya hay tipos de comercio en la base de datos, el seeder no hace nada (es seguro reiniciar el servidor sin duplicar datos).

**Contraseña para todas las cuentas de prueba:** `Demo123!`

| Rol | Usuario / Correo | Notas |
|---|---|---|
| Admin | `admin` / valor de `DEFAULT_ADMIN_EMAIL` en tu `.env` | Contraseña: la de `DEFAULT_ADMIN_PASSWORD` |
| Cliente | `ana_demo` / ana@demo.com | Tiene 2 direcciones y pedidos de ejemplo |
| Cliente | `luis_demo` / luis@demo.com | Tiene 1 dirección |
| Comercio | `parrillada_demo` / parrillada@demo.com | Restaurante, 2 categorías, 3 productos |
| Comercio | `farmacia_demo` / farmacia@demo.com | Farmacia, 2 categorías, 3 productos |
| Comercio | `super_demo` / super@demo.com | Supermercado, 2 categorías, 3 productos |
| Comercio | `cafearoma_demo` / cafearoma@demo.com | Cafetería, 2 categorías, 3 productos |
| Delivery | `carlos_demo` / carlos@demo.com | Tiene un pedido en proceso asignado |
| Delivery | `maria_demo` / maria@demo.com | Disponible |

### Volver a sembrar datos manualmente

Si borras la base de datos (o los datos demo) y quieres recrearlos sin levantar el servidor completo:

```bash
npm run seed
```

### Desactivar la siembra automática

Cuando ya no necesites los datos de prueba (por ejemplo, antes de la entrega final a tu profesor), pon en tu `.env`:

```
SEED_DEMO_DATA=false
```

y borra manualmente los datos demo desde Compass si quieres una base limpia (el admin y el ITBIS se mantienen siempre, sin importar este valor).

## 6. Endpoints implementados

### Auth (público)
| Método | Endpoint                     | Descripción                    |
|--------|-------------------------------|----------------------------------|
| POST   | /api/auth/login                | Inicio de sesión                 |
| POST   | /api/auth/register-client      | Registro de cliente              |
| POST   | /api/auth/register-delivery    | Registro de repartidor           |
| POST   | /api/auth/register-commerce    | Registro de comercio             |
| POST   | /api/auth/confirm-email        | Activación de cuenta             |
| POST   | /api/auth/forgot-password      | Solicitud de recuperación        |
| POST   | /api/auth/reset-password       | Restablecimiento de contraseña   |

### Account (todos los roles autenticados)
| Método | Endpoint            | Descripción                     |
|--------|-----------------------|-----------------------------------|
| GET    | /api/account/me         | Perfil del usuario autenticado    |
| PATCH  | /api/account/me         | Actualizar perfil (+ imagen/logo) |

### Commerce Catalog (Client)
| Método | Endpoint                              | Descripción                        |
|--------|-----------------------------------------|---------------------------------------|
| GET    | /api/commerce-types                      | Tipos de comercio activos             |
| GET    | /api/commerce?commerceTypeId=...         | Comercios activos por tipo            |
| GET    | /api/commerce/:commerceId/catalog        | Catálogo agrupado por categorías      |

### Orders (Client / Commerce / Delivery)
| Método | Endpoint                                | Rol      | Descripción                           |
|--------|-------------------------------------------|----------|------------------------------------------|
| POST   | /api/orders                                | Client   | Crear pedido                             |
| GET    | /api/orders/my-orders                      | Client   | Listar mis pedidos                       |
| GET    | /api/orders/my-orders/:id                  | Client   | Detalle de mi pedido                     |
| GET    | /api/orders/commerce                       | Commerce | Listar pedidos del comercio              |
| GET    | /api/orders/commerce/:id                   | Commerce | Detalle de pedido del comercio           |
| PATCH  | /api/orders/:id/assign-delivery            | Commerce | Asignar delivery automáticamente         |
| GET    | /api/orders/delivery                       | Delivery | Pedidos asignados                        |
| GET    | /api/orders/delivery/:id                   | Delivery | Detalle de pedido asignado               |
| PATCH  | /api/orders/:id/complete                   | Delivery | Completar pedido                         |

### Addresses y Favorites (Client)
CRUD completo en `/api/addresses` y `/api/favorites` (`GET`, `POST`, `DELETE`, más `PUT` para direcciones).

### Categories y Products (Commerce)
CRUD completo en `/api/categories` y `/api/products` (este último con imagen vía Multer).

### Admin
| Método | Endpoint                             | Descripción                                  |
|--------|-----------------------------------------|-------------------------------------------------|
| GET    | /api/admin/dashboard                     | Métricas del sistema                             |
| GET    | /api/admin/users/clients                 | Listado de clientes                              |
| GET    | /api/admin/users/deliveries              | Listado de deliveries                            |
| GET    | /api/admin/users/commerces               | Listado de comercios                             |
| GET    | /api/admin/users/admins                  | Listado de administradores                       |
| POST   | /api/admin/users/admins                  | Crear administrador                              |
| PUT    | /api/admin/users/admins/:id              | Actualizar administrador                         |
| PATCH  | /api/admin/users/:id/status              | Activar/inactivar usuario                        |
| GET/POST/PUT/DELETE | /api/admin/commerce-types  | Mantenimiento de tipos de comercio (hard delete en cascada) |

### Configurations (Admin)
CRUD de `/api/configurations` — incluye la clave `ITBIS`, creada automáticamente al levantar el servidor y usada en el cálculo de cada pedido.

Todo probable directamente desde Swagger (`/api-docs`) o con Postman/Thunder Client.

## 7. Sitio web (Handlebars + sesiones)

Accede desde el navegador en `http://localhost:8080`. Usa sesiones (no JWT) y comparte los mismos modelos que la API.

### Autenticación
`/auth/login` · `/auth/register` (cliente o delivery) · `/auth/register-commerce` · `/auth/forgot-password` · `/auth/reset-password` · activación por enlace de correo (`/auth/activate/:token`).

### Cliente
| Ruta | Pantalla |
|---|---|
| `/client/home` | Tipos de comercio |
| `/client/commerces?typeId=...` | Comercios por tipo + búsqueda + favoritos |
| `/client/catalog/:commerceId` | Catálogo por categoría + carrito de pedido |
| `/client/checkout` | Selección de dirección, subtotal/ITBIS/total, confirmar pedido |
| `/client/profile` | Editar perfil |
| `/client/orders`, `/client/orders/:id` | Mis pedidos y detalle |
| `/client/addresses` (+ new/edit/delete) | Mantenimiento de direcciones |
| `/client/favorites` | Comercios favoritos |

### Comercio
| Ruta | Pantalla |
|---|---|
| `/commerce/home` | Pedidos recibidos |
| `/commerce/orders/:id` | Detalle + asignar delivery |
| `/commerce/profile` | Editar perfil del comercio |
| `/commerce/categories` (+ new/edit/delete) | Mantenimiento de categorías |
| `/commerce/products` (+ new/edit/delete) | Mantenimiento de productos |

### Delivery
| Ruta | Pantalla |
|---|---|
| `/delivery/home` | Pedidos asignados |
| `/delivery/orders/:id` | Detalle + completar pedido (oculta dirección al completar) |
| `/delivery/profile` | Editar perfil |

### Administrador
| Ruta | Pantalla |
|---|---|
| `/admin/dashboard` | Indicadores generales |
| `/admin/clients`, `/admin/deliveries`, `/admin/commerces` | Listados + activar/inactivar |
| `/admin/configuration` | Editar ITBIS |
| `/admin/administrators` (+ new/edit/toggle) | Mantenimiento de administradores |
| `/admin/commerce-types` (+ new/edit/delete) | Mantenimiento de tipos de comercio (cascada) |

Para entrar como administrador, usa las credenciales de `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` de tu `.env` (se crea automáticamente al levantar el servidor).

## 8. Reglas de negocio clave ya implementadas

- Un usuario inactivo no puede iniciar sesión hasta confirmar su cuenta.
- `userName` y `email` son únicos en todo el sistema.
- Los favoritos solo aplican a comercios y no se duplican.
- Todos los productos de un pedido deben pertenecer al mismo comercio (400 si se mezclan).
- El total del pedido se calcula como `subtotal + (subtotal * ITBIS / 100)`, usando el ITBIS vigente en `Configurations`.
- Un delivery solo puede tener un pedido `InProgress` a la vez; al completarlo vuelve a estar disponible.
- La dirección de entrega deja de mostrarse al delivery una vez el pedido está `Completed`.
- El admin autenticado no puede editarse ni cambiar su propio estado; el admin por defecto no puede ser modificado por nadie.
- Eliminar un tipo de comercio borra en cascada (hard delete) sus comercios, usuarios, categorías, productos, pedidos y favoritos asociados.
- Todos los listados soportan `page`, `pageSize`, `search`, `sortBy` y `sortDirection`.

## 9. Estructura completa de módulos

```
models/          User, Commerce, CommerceType, Category, Product,
                 Address, Favorite, Order, Configuration
                 (compartidos entre la API y el sitio web)

API (JSON, JWT)
controllers/     auth, account, commerceCatalog, commerceType,
                 category, product, address, favorite, order,
                 adminDashboard, adminUser, configuration
routes/          una ruta por módulo + routes/index.js que las monta todas
validators/      una regla de validación por módulo (express-validator)

Sitio web (HTML, sesiones)
web/controllers/ authWeb, clientWeb, commerceWeb, deliveryWeb, adminWeb
web/routes/      una ruta por rol + web/routes/index.js que las monta todas
web/middlewares/ requireAuth, requireRole, exposeLocals (mensajes flash)
views/           layouts (main/auth), partials (navbar, flash) y
                 pantallas agrupadas por rol (auth/, client/, commerce/,
                 delivery/, admin/)
```

Ambas capas comparten los mismos modelos de Mongoose, así que una acción hecha desde la API se refleja igual en el sitio web y viceversa.

## 10. Requerimientos técnicos ya cubiertos en esta base

- Arquitectura MVC con Express.
- Persistencia con Mongoose/MongoDB.
- Documentación con Swagger.
- Validaciones con `express-validator`.
- Variables de entorno con `dotenv` + `cross-env` (development/qa).
- Envío de correos con Nodemailer.
- Carga de archivos con Multer.
- Seguridad JWT con roles (Admin, Client, Delivery, Commerce).
- Administrador por defecto no modificable (seed automático).
