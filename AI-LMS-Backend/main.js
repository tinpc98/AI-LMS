import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./src/config/database.js";
import BookRouter from "./src/router/books.js";
import UserRouter from "./src/router/auth.js";

// Kích hoạt file .env
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use("/", BookRouter);
app.use("/auth", UserRouter);

//gọi kết nối database
connectDB()
  .then(() => {
    app.listen(port, async () => {
      console.log(`Endpoint http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log("Kết nối thất bại");
  });
