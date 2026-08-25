import { Schema, model } from "mongoose";

const classEnrollmentSchema = new Schema(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRANSFERRED", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    transferredFrom: {
      type: Schema.Types.ObjectId,
      ref: "ClassEnrollment",
      default: null,
    },
    transferredTo: {
      type: Schema.Types.ObjectId,
      ref: "ClassEnrollment",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// One active class rule: Only one ACTIVE enrollment per enrollmentId
classEnrollmentSchema.index(
  { enrollmentId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "ACTIVE" },
  }
);

classEnrollmentSchema.index({ studentId: 1, status: 1 });
classEnrollmentSchema.index({ classId: 1, status: 1 });

const ClassEnrollment = model("ClassEnrollment", classEnrollmentSchema);

export default ClassEnrollment;
