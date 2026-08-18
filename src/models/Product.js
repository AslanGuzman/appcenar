import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productSchema = new Schema(
  {
    commerce: { type: Schema.Types.ObjectId, ref: "Commerce", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
