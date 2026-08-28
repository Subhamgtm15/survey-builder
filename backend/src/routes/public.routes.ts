import express from "express";
import { pool } from "../db.js";
import { submitLimiter } from "../middlewares/rateLimit.middleware.js";
import { validateAnswers } from "../utils/validation.js";
import type { Question, AnswerMap } from "../types/survey.js";

const router = express.Router();

router.get("/surveys/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, questions FROM surveys WHERE id = $1 AND is_published = true",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found or not published." });
    }
    res.status(200).json({ survey: result.rows[0] });
  } catch (error) {
    console.error("Public survey fetch error:", error);
    res.status(500).json({ message: "Failed to load survey." });
  }
});

router.post("/surveys/:id/responses", submitLimiter, async (req, res) => {
  const answers = req.body?.answers as AnswerMap;
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ message: "Answers are required." });
  }

  try {
    const surveyResult = await pool.query(
      "SELECT questions FROM surveys WHERE id = $1 AND is_published = true",
      [req.params.id]
    );
    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found or not published." });
    }

    const questions: Question[] = surveyResult.rows[0].questions;
    const errors = validateAnswers(questions, answers);
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const validIds = new Set(questions.map((q) => q.id));
    const cleanAnswers: AnswerMap = {};
    for (const [key, value] of Object.entries(answers)) {
      if (validIds.has(key)) cleanAnswers[key] = value;
    }

    await pool.query("INSERT INTO responses (survey_id, answers) VALUES ($1, $2)", [
      req.params.id,
      JSON.stringify(cleanAnswers),
    ]);

    res.status(201).json({ message: "Response submitted. Thank you!" });
  } catch (error) {
    console.error("Submit response error:", error);
    res.status(500).json({ message: "Failed to submit response." });
  }
});

export default router;
