import mongoose from "mongoose";

const { Schema, model } = mongoose;

const configurationSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    value: { type: String, required: true },
    type: { type: String, enum: ["number", "string", "boolean"], default: "number" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Configuration = model("Configuration", configurationSchema);
