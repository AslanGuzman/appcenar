import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ROLES } from "../utils/constants.js";

export async function seedDefaultAdmin() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const userName = process.env.DEFAULT_ADMIN_USERNAME;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !userName || !password) {
    console.warn("[seeder] Variables del admin por defecto no configuradas, se omite la creación.");
    return;
  }

  const existing = await User.findOne({ isDefaultAdmin: true });
  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    firstName: "Super",
    lastName: "Admin",
    userName,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone: "0000000000",
    identificationCard: "000-0000000-0",
    role: ROLES.ADMIN,
    isActive: true,
    isDefaultAdmin: true,
  });

  console.log(`[seeder] Administrador por defecto creado: ${userName}`);
}
