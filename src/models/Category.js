import mongoose from "mongoose";

const { Schema, model } = mongoose;

const categorySchema = new Schema(
  {
    commerce: { type: Schema.Types.ObjectId, ref: "Commerce", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

categorySchema.index({ commerce: 1, name: 1 }, { unique: true });

export const Category = model("Category", categorySchema);
