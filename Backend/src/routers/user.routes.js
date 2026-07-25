import { Router } from "express";
import {
  getMyProfile,
  login,
  updateMyProfile,
} from "../controllers/auth.controllers.js";
import { loginValidation } from "../utils/validators.js";
import { verifyUser } from "./../middlewares/auth.middlewares.js";

const route = Router();

route.post("/login", loginValidation, login);
route.get("/me", verifyUser, getMyProfile);
route.put("/me", verifyUser, updateMyProfile);

export default route;

