import { text } from "express";
import { Schema, model } from "mongoose";

const bookSchema = new Schema(
  {
    name: { type: String, minLength: 6, maxLength: 255, require: true },
    price: { type: Number, require: true },
    description: { type: String },
    image: { type: String },
  },
  {
    timestamps: true,
  },
);
bookSchema.index({ name: "text" });
export const bookModel = model("books", bookSchema);
