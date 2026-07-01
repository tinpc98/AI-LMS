import { Schema, model, mongoose } from "mongoose";

export const classSchema = new Schema(
  {
    className: { type: String, required: true },
    joinCode: { type: String, unique: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true },
);
const classModel = model("class", classSchema);
export default classModel;
