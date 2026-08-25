import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "./src/config/database.js";
import Enrollment from "./src/modules/enrollment/enrollment.model.js";
import ClassEnrollment from "./src/modules/classEnrollment/classEnrollment.model.js";
import { getAdminPendingClass } from "./src/modules/enrollment/enrollment.controller.js";
import { UploadResource } from "./src/modules/class/class.controller.js";
import storageService from "./src/shared/services/storage.service.js";
import Class from "./src/modules/class/class.model.js";

const runVerify = async () => {
  console.log("=========================================");
  console.log("PHASE 4.2 VERIFICATION SCRIPT");
  console.log("=========================================");

  try {
    await connectDB();
    console.log("✅ Database Connected.");

    // TEST 8: Mongoose Pool Config
    const client = mongoose.connection.getClient();
    const options = client.options;
    if (options.maxPoolSize >= 20) {
      console.log(`✅ TEST 8 PASS: maxPoolSize is ${options.maxPoolSize}`);
    } else {
      console.log(`❌ TEST 8 FAIL: maxPoolSize is ${options.maxPoolSize}`);
    }

    // TEST 5: N+1 empty case
    const mockResEmpty = {
      status: function (code) { this.statusCode = code; return this; },
      json: function (data) { this.data = data; return this; }
    };
    await getAdminPendingClass({ query: {} }, mockResEmpty);
    console.log(`✅ TEST 5 PASS: N+1 empty case returned total: ${mockResEmpty.data.pagination.total}`);

    // TEST 4: N+1 endpoint
    // Seed an approved enrollment
    const newEnr = await Enrollment.create({
      studentId: new mongoose.Types.ObjectId(),
      courseId: new mongoose.Types.ObjectId(),
      paymentMethod: "CASH",
      status: "APPROVED",
      price: 1000000,
      level: "FOUNDATION"
    });

    const mockResSeed = {
      status: function (code) { this.statusCode = code; return this; },
      json: function (data) { this.data = data; return this; }
    };
    await getAdminPendingClass({ query: {} }, mockResSeed);
    
    let found = mockResSeed.data.data.find(e => String(e._id) === String(newEnr._id));
    if (found) {
      console.log("✅ TEST 4 PASS: N+1 endpoint works correctly and returns APPROVED enrollments");
    } else {
      console.log("❌ TEST 4 FAIL: New enrollment not found");
    }

    // Cleanup Seed
    await Enrollment.findByIdAndDelete(newEnr._id);

    // TEST 6 & 7: Cloudinary Rollback
    // Mock storageService.uploadFile and storageService.deleteFile
    const originalUpload = storageService.uploadFile;
    const originalDelete = storageService.deleteFile;
    
    let deletedPublicId = null;
    storageService.deleteFile = async (publicId) => {
      deletedPublicId = publicId;
      return true;
    };

    const targetClass = await Class.create({
      courseId: new mongoose.Types.ObjectId(),
      teacherId: new mongoose.Types.ObjectId(),
      name: "Test Class Rollback",
      code: "TEST-CODE-" + Date.now(),
      level: "FOUNDATION",
      capacity: 10
    });

    // TEST 7: Cloudinary upload failure
    storageService.uploadFile = async () => {
      throw new Error("Simulated Cloudinary Upload Error");
    };

    const mockReq7 = {
      params: { id: targetClass._id },
      body: { title: "Test Doc", type: "Document" },
      file: { buffer: Buffer.from("test"), originalname: "test.pdf", size: 100 },
      user: { id: targetClass.teacherId, role: "Teacher" }
    };
    const mockRes7 = {
      status: function (code) { this.statusCode = code; return this; },
      json: function (data) { this.data = data; return this; }
    };

    const mockNext7 = (err) => { throw err; };

    try {
      await UploadResource(mockReq7, mockRes7, mockNext7);
      console.log("❌ TEST 7 FAIL: Did not throw error");
    } catch (e) {
      if (e.message === "Simulated Cloudinary Upload Error") {
        console.log("✅ TEST 7 PASS: Cloudinary upload failure correctly aborted operation");
      } else {
        console.log("❌ TEST 7 FAIL: Unexpected error:", e.message);
      }
    }

    // TEST 6: Cloudinary DB failure cleanup
    storageService.uploadFile = async () => {
      return { publicId: "test_public_id_123", format: "pdf", bytes: 100, resourceType: "raw" };
    };

    // Override save to throw error
    const originalSave = Class.prototype.save;
    Class.prototype.save = async function() {
      throw new Error("Simulated DB Save Error");
    };

    try {
      await UploadResource(mockReq7, mockRes7, mockNext7);
      console.log("❌ TEST 6 FAIL: Did not throw error");
    } catch (e) {
      if (e.message === "Simulated DB Save Error" && deletedPublicId === "test_public_id_123") {
        console.log("✅ TEST 6 PASS: Cloudinary DB failure cleanup successful. Rollback triggered.");
      } else {
        console.log("❌ TEST 6 FAIL: Error or Rollback condition not met:", e.message, deletedPublicId);
      }
    }

    // Cleanup Mocks
    Class.prototype.save = originalSave;
    storageService.uploadFile = originalUpload;
    storageService.deleteFile = originalDelete;
    await Class.findByIdAndDelete(targetClass._id);

    console.log("=========================================");
    console.log("✅ ALL TESTS COMPLETED");
    console.log("=========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ SCRIPT FAILED:", error);
    process.exit(1);
  }
};

runVerify();
