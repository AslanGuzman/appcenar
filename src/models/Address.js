import mongoose from "mongoose";

const { Schema, model } = mongoose;

const addressSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, required: true, trim: true },
    street: { type: String, required: true },
    sector: { type: String, required: true },
    city: { type: String, required: true },
    reference: { type: String, required: true },
  },
  { timestamps: true }
);

export const Address = model("Address", addressSchema);
