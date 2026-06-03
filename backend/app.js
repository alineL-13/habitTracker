import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import habitsRoutes from "./routes/habitsRoutes.js";
import habitEntriesRoutes from "./routes/habitEntriesRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes); // todas as rotas em authRoutes vão ficar como /auth/rota
app.use("/habits", habitsRoutes);
app.use("/habit_entries", habitEntriesRoutes);

export default app;