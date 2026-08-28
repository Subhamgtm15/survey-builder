import express, { Response } from "express";
import { pool } from "../db.js";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware.js";
import { sanitizeQuestions } from "../utils/validation.js";
import type { Question, AnswerMap } from "../types/survey.js";

const router = express.Router();

// All routes here require an authenticated admin.
router.use(authMiddleware);

// POST /surveys — create a new survey.
router.post("/", async (req: AuthRequest, res: Response) => {
  const { title, description, questions, isPublished } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Survey title is required." });
  }

  let cleanQuestions: Question[];
  try {
    cleanQuestions = sanitizeQuestions(questions);
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }

  try {
    const result = await pool.query(
      `INSERT INTO surveys (title, description, questions, is_published)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title.trim(), description ?? null, JSON.stringify(cleanQuestions), Boolean(isPublished)]
    );
    res.status(201).json({ survey: result.rows[0] });
  } catch (error) {
    console.error("Create survey error:", error);
    res.status(500).json({ message: "Failed to create survey." });
  }
});

// GET /surveys — list all surveys with response counts.
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT s.*, COUNT(r.id)::int AS response_count
       FROM surveys s
       LEFT JOIN responses r ON r.survey_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    );
    res.status(200).json({ surveys: result.rows });
  } catch (error) {
    console.error("List surveys error:", error);
    res.status(500).json({ message: "Failed to fetch surveys." });
  }
});

// GET /surveys/:id — fetch a single survey (for editing).
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM surveys WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found." });
    }
    res.status(200).json({ survey: result.rows[0] });
  } catch (error) {
    console.error("Get survey error:", error);
    res.status(500).json({ message: "Failed to fetch survey." });
  }
});

// PUT /surveys/:id — update an existing survey.
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const { title, description, questions, isPublished } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Survey title is required." });
  }

  let cleanQuestions: Question[];
  try {
    cleanQuestions = sanitizeQuestions(questions);
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }

  try {
    const result = await pool.query(
      `UPDATE surveys
       SET title = $1, description = $2, questions = $3, is_published = $4, updated_at = now()
       WHERE id = $5 RETURNING *`,
      [
        title.trim(),
        description ?? null,
        JSON.stringify(cleanQuestions),
        Boolean(isPublished),
        req.params.id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found." });
    }
    res.status(200).json({ survey: result.rows[0] });
  } catch (error) {
    console.error("Update survey error:", error);
    res.status(500).json({ message: "Failed to update survey." });
  }
});

// DELETE /surveys/:id — remove a survey and its responses (cascade).
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM surveys WHERE id = $1 RETURNING id", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found." });
    }
    res.status(200).json({ message: "Survey deleted." });
  } catch (error) {
    console.error("Delete survey error:", error);
    res.status(500).json({ message: "Failed to delete survey." });
  }
});

// GET /surveys/:id/analytics — aggregate response insights per question.
router.get("/:id/analytics", async (req: AuthRequest, res: Response) => {
  try {
    const surveyResult = await pool.query("SELECT * FROM surveys WHERE id = $1", [req.params.id]);
    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found." });
    }
    const survey = surveyResult.rows[0];
    const questions: Question[] = survey.questions;

    const responseResult = await pool.query(
      "SELECT answers FROM responses WHERE survey_id = $1",
      [req.params.id]
    );
    const answerMaps: AnswerMap[] = responseResult.rows.map((r: { answers: AnswerMap }) => r.answers);
    const total = answerMaps.length;

    // Build per-question aggregates tailored to each question type.
    const insights = questions.map((q) => {
      const values = answerMaps
        .map((a) => a[q.id])
        .filter((v) => v !== undefined && v !== null && v !== "");

      if (q.type === "single_choice" || q.type === "multiple_choice") {
        const counts: Record<string, number> = {};
        for (const opt of q.options ?? []) counts[opt] = 0;
        for (const v of values) {
          const picks = Array.isArray(v) ? v : [v];
          for (const pick of picks) {
            if (typeof pick === "string" && pick in counts) counts[pick] += 1;
          }
        }
        return { questionId: q.id, label: q.label, type: q.type, answered: values.length, counts };
      }

      if (q.type === "rating") {
        const nums = values.filter((v): v is number => typeof v === "number");
        const average = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
        const distribution: Record<number, number> = {};
        const max = q.maxRating ?? 5;
        for (let i = 1; i <= max; i++) distribution[i] = 0;
        for (const n of nums) if (n in distribution) distribution[n] += 1;
        return {
          questionId: q.id,
          label: q.label,
          type: q.type,
          answered: nums.length,
          average: Number(average.toFixed(2)),
          distribution,
        };
      }

      // Free-text: return the raw answers so the admin can read them.
      return {
        questionId: q.id,
        label: q.label,
        type: q.type,
        answered: values.length,
        responses: values as string[],
      };
    });

    res.status(200).json({ survey: { id: survey.id, title: survey.title }, total, insights });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Failed to compute analytics." });
  }
});

export default router;
