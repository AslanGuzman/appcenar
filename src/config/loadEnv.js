import dotenv from "dotenv";
import path from "path";

const ENV_FILES = {
  development: ".env",
  qa: ".env.qa",
  production: ".env.production",
};

const nodeEnv = process.env.NODE_ENV || "development";
const fileName = ENV_FILES[nodeEnv] || ".env";

dotenv.config({ path: path.resolve(process.cwd(), fileName) });

if (fileName !== ".env") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

console.log(`[env] NODE_ENV=${nodeEnv} -> intentando cargar ${fileName}`);
