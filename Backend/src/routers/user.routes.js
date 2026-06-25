import { Router } from "express";
import { login, register } from "../controllers/auth.controllers.js";
import { loginValidation, registerValidation } from "../utils/validators.js";
const route = Router();
route.post("/register", registerValidation, register);
route.post("/login", loginValidation, login);
export default route;
