import { Schema, model, Types } from "mongoose";

export const EXAM_SET_SHARE_PERMISSION = {
  VIEW: "VIEW",
  EDIT: "EDIT",
};

export const EXAM_SET_SHARE_STATUS = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
};

const examSetShareSchema = new Schema(
  {
    examSetId: {
      type: Schema.Types.ObjectId,
      ref: "ExamSet",
      required: [true, "examSetId là bắt buộc"],
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ownerId là bắt buộc"],
    },
    sharedWithUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "sharedWithUserId là bắt buộc"],
      validate: {
        validator(value) {
          return String(value) !== String(this.ownerId);
        },
        message: "sharedWithUserId không được trùng với ownerId",
      },
    },
    permission: {
      type: String,
      enum: Object.values(EXAM_SET_SHARE_PERMISSION),
      required: [true, "permission là bắt buộc"],
    },
    status: {
      type: String,
      enum: Object.values(EXAM_SET_SHARE_STATUS),
      default: EXAM_SET_SHARE_STATUS.ACTIVE,
      required: [true, "status là bắt buộc"],
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "sharedBy là bắt buộc"],
    },
    expiresAt: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (value === null) {
            return true;
          }
          if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
            return false;
          }
          if (this.isNew) {
            return value.getTime() > Date.now();
          }
          if (this.createdAt) {
            return value.getTime() > new Date(this.createdAt).getTime();
          }
          return true;
        },
        message: "expiresAt phải là Date hợp lệ và lớn hơn thời điểm tạo",
      },
    },
    revokedAt: {
      type: Date,
      default: null,
      validate: [
        {
          validator(value) {
            return value === null || (value instanceof Date && !Number.isNaN(value.getTime()));
          },
          message: "revokedAt phải là Date hợp lệ hoặc null",
        },
        {
          validator(value) {
            if (this.status !== EXAM_SET_SHARE_STATUS.REVOKED) {
              return value === null;
            }
            return true;
          },
          message: "revokedAt chỉ được phép khi status là REVOKED",
        },
      ],
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: [
        {
          validator(value) {
            return value === null || Types.ObjectId.isValid(String(value));
          },
          message: "revokedBy phải là ObjectId hợp lệ hoặc null",
        },
        {
          validator(value) {
            if (this.status !== EXAM_SET_SHARE_STATUS.REVOKED) {
              return value === null;
            }
            return true;
          },
          message: "revokedBy chỉ được phép khi status là REVOKED",
        },
      ],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "note tối đa 500 ký tự"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => ret,
    },
    toObject: {
      transform: (doc, ret) => ret,
    },
  }
);

examSetShareSchema.index({ examSetId: 1, sharedWithUserId: 1 }, { unique: true });
examSetShareSchema.index({ ownerId: 1 });
examSetShareSchema.index({ sharedWithUserId: 1 });
examSetShareSchema.index({ status: 1 });
examSetShareSchema.index({ sharedWithUserId: 1, status: 1, createdAt: -1 });
examSetShareSchema.index({ sharedWithUserId: 1, permission: 1, status: 1 });

const ExamSetShare = model("ExamSetShare", examSetShareSchema);
export default ExamSetShare;
