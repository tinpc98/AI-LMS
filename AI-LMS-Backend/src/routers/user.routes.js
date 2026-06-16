import { Router } from "express";
import { register } from "../controllers/auth.controllers.js";
import { registerValidation } from "../utils/validators.js";
const route = Router();
route.post("/register", registerValidation, register);
export default route;
