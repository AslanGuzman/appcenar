import "../config/loadEnv.js";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { seedDefaultAdmin } from "../seeders/defaultAdmin.seeder.js";
import { seedDefaultConfigurations } from "../seeders/defaultConfiguration.seeder.js";
import { seedDemoData } from "../seeders/demoData.seeder.js";

async function run() {
  try {
    await connectDatabase();
    await seedDefaultAdmin();
    await seedDefaultConfigurations();
    await seedDemoData();
    console.log("[seed] Proceso de siembra finalizado.");
  } catch (err) {
    console.error("[seed] Error al sembrar datos:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
