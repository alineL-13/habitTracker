import { Router } from "express";
import { signup, login, checkLoggedUser } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/checkLoggedUser", authMiddleware, checkLoggedUser);

export default router;