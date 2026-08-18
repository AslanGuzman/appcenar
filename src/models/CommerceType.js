import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commerceTypeSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    icon: { type: String, required: true },
  },
  { timestamps: true }
);

export const CommerceType = model("CommerceType", commerceTypeSchema);
