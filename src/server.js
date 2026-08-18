import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { seedDefaultAdmin } from "./seeders/defaultAdmin.seeder.js";
import { seedDefaultConfigurations } from "./seeders/defaultConfiguration.seeder.js";
import { seedDemoData } from "./seeders/demoData.seeder.js";

const PORT = process.env.PORT || 8080;

async function bootstrap() {
  try {
    await connectDatabase();
    await seedDefaultAdmin();
    await seedDefaultConfigurations();

    // Datos de demostración (comercios, productos, clientes, deliveries, pedidos).
    // No hace nada si la base de datos ya tiene datos.
    if (process.env.SEED_DEMO_DATA !== "false") {
      await seedDemoData();
    }

    app.listen(PORT, () => {
      console.log(`[server] AppCenar corriendo en http://localhost:${PORT}`);
      console.log(`[server] Sitio web en http://localhost:${PORT}`);
      console.log(`[server] Documentación Swagger en http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("[server] Error al iniciar la aplicación:", err.message);
    process.exit(1);
  }
}

bootstrap();
