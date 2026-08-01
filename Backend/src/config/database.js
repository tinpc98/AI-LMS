import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, family: 4, tls: true });
    console.log("Kết nối MongoDB thành công");
  } catch (error) {
    console.log("Kết nối thất bại:", error);
    throw error;
  }
};
