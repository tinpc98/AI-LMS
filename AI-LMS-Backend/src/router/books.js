import { Router } from "express";
import {
  BookList,
  BookAdd,
  BookEdit,
  BookById,
  BookDelete,
} from "./../controllers/books.js";
import { VerifyUser } from "./../utils/verify.js";
import { ProductValidation } from "../utils/validators.js";

const router = Router();
router.get("/product", BookList);
router.get("/product/:id", BookById);
router.post("/product", BookAdd);
router.put("/product/:id", BookEdit);
router.delete("/product/:id", BookDelete);
export default router;
