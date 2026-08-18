import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI no está definida en las variables de entorno.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log(`[database] Conectado a MongoDB (${process.env.NODE_ENV}) -> ${uri}`);

  mongoose.connection.on("error", (err) => {
    console.error("[database] Error de conexión:", err.message);
  });
}
