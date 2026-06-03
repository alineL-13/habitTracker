import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createHabitEntry, getHabitEntries, deleteHabitEntries } from "../controllers/habitEntriesController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createHabitEntry);
router.get("/", getHabitEntries);
router.delete("/:id", deleteHabitEntries);

export default router;