import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.log(" Không tìm thấy MONGO_URI trong file .env");
    }

    await mongoose.connect(uri);
    console.log("Kết nối MongoDB thành công");
  } catch (error) {
    console.log("Kết nối thất bại:", error.message);
    throw error; // Bắt buộc ném lỗi ra ngoài để main.js dừng khởi động server
  }
};
