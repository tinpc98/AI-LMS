import { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const folderSchema = new Schema(
  {
    // ID của người sở hữu folder
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ownerId là bắt buộc"],
      index: true,
    },

    // ID của folder cha (null nếu là root folder)
    parentFolderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

    // Tên folder
    name: {
      type: String,
      required: [true, "Tên folder là bắt buộc"],
      trim: true,
      minlength: 1,
      maxlength: 255,
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        return ret;
      },
    },
  }
);

// Apply soft delete plugin
folderSchema.plugin(softDeletePlugin);

// Compound index cho owner và parent folder để tối ưu truy vấn
folderSchema.index({ ownerId: 1, parentFolderId: 1 });

// Index để tìm root folder của một user
folderSchema.index({ ownerId: 1, parentFolderId: 1, isDeleted: 1 });

const Folder = model("Folder", folderSchema);

export default Folder;
