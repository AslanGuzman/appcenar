import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commerceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    phone: { type: String, required: true },
    openingTime: { type: String, required: true }, // formato "HH:mm"
    closingTime: { type: String, required: true },
    commerceType: { type: Schema.Types.ObjectId, ref: "CommerceType", required: true },
    logo: { type: String, default: null },
  },
  { timestamps: true }
);

export const Commerce = model("Commerce", commerceSchema);
