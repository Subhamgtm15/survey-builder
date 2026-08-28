import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import surveyRoutes from "./routes/survey.routes.js";
import publicRoutes from "./routes/public.routes.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/surveys", surveyRoutes);
app.use("/public", publicRoutes);

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Survey API running on port ${port}`);
});
