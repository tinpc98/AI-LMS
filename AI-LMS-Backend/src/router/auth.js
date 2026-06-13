import { Router } from "express";
import { Register, Login } from "../controllers/auth.js";
import { LoginValidation, RegisterValidation } from "../utils/validators.js";
const route = Router();
route.post("/register", RegisterValidation, Register);
route.post("/login", LoginValidation, Login);
export default route;
