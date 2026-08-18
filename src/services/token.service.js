import jwt from "jsonwebtoken";
import crypto from "crypto";
import { TOKEN_EXPIRATION_HOURS } from "../utils/constants.js";

export function generateAccessToken(user) {
  const payload = {
    id: user._id,
    userName: user.userName,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  return { token, expiresAt };
}

export function generateRandomToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const expiration = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);
  return { token, expiration };
}
