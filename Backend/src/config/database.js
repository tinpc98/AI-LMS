import mongoose from "mongoose";

const uri = process.env.MONGO_URI;

export const connectDB = async () => {
  try {
    const uri = "mongodb+srv://admin:admin123@cluster0.wissmyr.mongodb.net/AI-LMS?appName=Cluster0";
    if (!uri) {
      console.log(" Không tìm thấy MONGO_URI trong file .env");
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, family: 4, tls: true });
    console.log("Kết nối MongoDB thành công");
  } catch (error) {
    console.log("Kết nối thất bại:", error);
    throw error;
  }
};
