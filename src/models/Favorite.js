import mongoose from "mongoose";

const { Schema, model } = mongoose;

const favoriteSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    commerce: { type: Schema.Types.ObjectId, ref: "Commerce", required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ client: 1, commerce: 1 }, { unique: true });

export const Favorite = model("Favorite", favoriteSchema);
