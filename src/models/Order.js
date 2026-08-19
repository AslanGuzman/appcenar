import mongoose from "mongoose";
import { ORDER_STATUS } from "../utils/constants.js";

const { Schema, model } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    commerce: { type: Schema.Types.ObjectId, ref: "Commerce", required: true },
    address: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    delivery: { type: Schema.Types.ObjectId, ref: "User", default: null },

    items: { type: [orderItemSchema], required: true },

    subtotal: { type: Number, required: true },
    itbisPercentage: { type: Number, required: true },
    itbisAmount: { type: Number, required: true },
    total: { type: Number, required: true },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
  },
  { timestamps: true }
);

export const Order = model("Order", orderSchema);
