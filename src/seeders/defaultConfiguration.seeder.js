import { Configuration } from "../models/Configuration.js";

export async function seedDefaultConfigurations() {
  const existingItbis = await Configuration.findOne({ key: "ITBIS" });

  if (!existingItbis) {
    await Configuration.create({
      key: "ITBIS",
      value: String(process.env.DEFAULT_ITBIS || 18),
      type: "number",
      description: "Porcentaje de ITBIS aplicado al subtotal de los pedidos.",
    });
    console.log("[seeder] Configuración ITBIS creada por defecto.");
  }
}
