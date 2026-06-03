import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createHabit, getHabits, updateHabit, deleteHabit } from "../controllers/habitsController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createHabit);
router.get("/", getHabits);
router.put("/:id", updateHabit);
router.delete("/:id", deleteHabit);

export default router;