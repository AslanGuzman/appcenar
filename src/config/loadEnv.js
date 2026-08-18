import dotenv from "dotenv";
import path from "path";

/**
 * Carga el archivo .env correspondiente al NODE_ENV actual:
 *   development -> .env
 *   qa          -> .env.qa
 *   production  -> .env.production
 *
 * Importante: dotenv NUNCA sobreescribe una variable que ya exista en
 * process.env. En Railway las variables se inyectan directamente al proceso
 * (no se leen de un archivo), así que esas siempre tienen prioridad sobre lo
 * que haya en estos archivos locales. Esto hace que sea seguro tener estos
 * archivos en el repo con valores de ejemplo/plantilla: en producción real
 * (Railway) los valores reales configurados en el dashboard siempre ganan.
 */
const ENV_FILES = {
  development: ".env",
  qa: ".env.qa",
  production: ".env.production",
};

const nodeEnv = process.env.NODE_ENV || "development";
const fileName = ENV_FILES[nodeEnv] || ".env";

dotenv.config({ path: path.resolve(process.cwd(), fileName) });

// Fallback: si el archivo específico no existe (ej. primera vez en un entorno
// nuevo), intenta cargar el .env genérico sin sobreescribir lo ya definido.
if (fileName !== ".env") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

console.log(`[env] NODE_ENV=${nodeEnv} -> intentando cargar ${fileName}`);
