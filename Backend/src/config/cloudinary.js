import "dotenv/config"; // THÊM DÒNG NÀY
import { v2 as cloudinary } from "cloudinary";

console.log("🔥 ĐANG CHECK API KEY:", process.env.CLOUDINARY_API_KEY); // THÊM DÒNG NÀY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
