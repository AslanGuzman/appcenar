import mongoose from "mongoose";
import { ROLES } from "../utils/constants.js";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    userName: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    identificationCard: { type: String, default: null, trim: true },
    profileImage: { type: String, default: null },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    isActive: { type: Boolean, default: false },
    isDefaultAdmin: { type: Boolean, default: false },

    // Activación de cuenta
    activateToken: { type: String, default: null },
    activateTokenExpiration: { type: Date, default: null },

    // Recuperación de contraseña
    resetToken: { type: String, default: null },
    resetTokenExpiration: { type: Date, default: null },

    // Solo aplica a role = Delivery
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.activateToken;
  delete obj.resetToken;
  delete obj.resetTokenExpiration;
  return obj;
};

export const User = model("User", userSchema);
