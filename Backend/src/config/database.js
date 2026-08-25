import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
      tls: true,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
    });
    
    // Kiểm tra cấu hình Replica Set (bắt buộc cho Transactions)
    if (process.env.NODE_ENV === "production") {
      const adminDb = mongoose.connection.db.admin();
      const status = await adminDb.command({ hello: 1 });
      if (!status.setName) {
        console.error("❌ CRITICAL FATAL: MongoDB không được cấu hình dưới dạng Replica Set.");
        console.error("❌ Hệ thống EDU SPACE yêu cầu Replica Set để chạy Database Transactions một cách an toàn.");
        throw new Error("MongoDB Replica Set is required for production transactions.");
      }
    }

    console.log("Kết nối MongoDB thành công");
  } catch (error) {
    console.log("Kết nối thất bại:", error);
    throw error;
  }
};
