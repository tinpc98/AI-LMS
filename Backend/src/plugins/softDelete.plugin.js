import mongoose from "mongoose";

/**
 * Enterprise Mongoose Soft Delete Plugin
 * Tự động thêm các trường, methods, query helpers và middleware lọc dữ liệu soft delete.
 */
export function softDeletePlugin(schema) {
  // 1. Bổ sung các trường dữ liệu chuẩn Enterprise
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  });

  // 2. Query Helpers
  schema.query.onlyActive = function () {
    return this.find({ isDeleted: false });
  };

  schema.query.onlyDeleted = function () {
    return this.find({ isDeleted: true });
  };

  schema.query.withDeleted = function () {
    this._withDeleted = true;
    return this;
  };

  // 3. Pre-Query Middlewares (Tự động lọc isDeleted: false cho find, findOne, countDocuments, count)
  const autoFilterMethods = ["find", "findOne", "countDocuments", "count"];
  autoFilterMethods.forEach((method) => {
    schema.pre(method, function () {
      if (this._withDeleted) return;
      const currentQuery = this.getQuery();
      if (currentQuery.isDeleted === undefined) {
        this.where({ isDeleted: false });
      }
    });
  });

  // 4. Instance Methods
  schema.methods.softDelete = async function (deletedByUserId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId || null;
    return await this.save();
  };

  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return await this.save();
  };

  // 5. Static Methods
  schema.statics.softDelete = async function (id, deletedByUserId = null) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.findOne({ _id: id }).withDeleted();
    if (!doc) return null;
    return await doc.softDelete(deletedByUserId);
  };

  schema.statics.restore = async function (id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.findOne({ _id: id }).withDeleted();
    if (!doc) return null;
    return await doc.restore();
  };

  schema.statics.findActive = function (query = {}) {
    return this.find({ ...query, isDeleted: false });
  };

  schema.statics.findDeleted = function (query = {}) {
    return this.find({ ...query, isDeleted: true }).withDeleted();
  };

  schema.statics.countActive = function (query = {}) {
    return this.countDocuments({ ...query, isDeleted: false });
  };

  schema.statics.countDeleted = function (query = {}) {
    return this.countDocuments({ ...query, isDeleted: true }).withDeleted();
  };
}

export default softDeletePlugin;
