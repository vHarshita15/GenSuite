import sql from "../configs/db.js";
import { callAIJson, parseAiJson } from "./aiController.js";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// POST /api/interview/start  { role, difficulty, count }
export const startInterview = async (req, res) => {
  try {
    const userId = req.userId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const role = String(req.body?.role || "").trim().slice(0, 100);
    const difficulty = String(req.body?.difficulty || "Medium").trim();
    const count = Math.min(Math.max(Number(req.body?.count) || 5, 3), 10);

    if (!role) return res.status(400).json({ success: false, message: "Role is required" });
    if (!DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ success: false, message: "Difficulty must be Easy, Medium or Hard" });
    }

    const raw = await callAIJson([
      {
        role: "system",
        content: `You are a technical interviewer. Generate exactly ${count} ${difficulty}-level interview questions for the role "${role}". Mix conceptual and practical questions. Return ONLY JSON: {"questions":["question 1","question 2"]}`,
      },
      { role: "user", content: `Role: ${role}\nDifficulty: ${difficulty}\nNumber of questions: ${count}` },
    ]);

    const parsed = parseAiJson(raw);
    const questions = (parsed?.questions || [])
      .map((q) => String(q).trim())
      .filter(Boolean)
      .slice(0, count);

    if (!questions.length) {
      return res.status(502).json({ success: false, message: "AI could not generate questions. Try again." });
    }

    const [session] = await sql`
      INSERT INTO interview_sessions (user_id, role, difficulty, questions)
      VALUES (${userId}, ${role}, ${difficulty}, ${JSON.stringify(questions)}::jsonb)
      RETURNING id, role, difficulty, questions, created_at`;

    return res.json({ success: true, session });
  } catch (error) {
    console.error("[startInterview] error", error?.message || error);
    if (error?.status === 429) {
      return res.status(429).json({ success: false, message: "Rate limit hit. Please try again in a few seconds." });
    }
    return res.status(500).json({ success: false, message: error.message || "Failed to start interview" });
  }
};

// POST /api/interview/:id/submit  { answers: ["...", "..."] }
export const submitInterview = async (req, res) => {
  try {
    const userId = req.userId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid session id" });

    const answers = Array.isArray(req.body?.answers)
      ? req.body.answers.map((a) => String(a || "").trim().slice(0, 2000))
      : [];
    if (!answers.some(Boolean)) {
      return res.status(400).json({ success: false, message: "Please answer at least one question" });
    }

    const [session] = await sql`
      SELECT * FROM interview_sessions WHERE id = ${id} AND user_id = ${userId}`;
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    const questions = session.questions || [];
    const qa = questions.map((question, i) => ({ question, answer: answers[i] || "(no answer)" }));

    const raw = await callAIJson([
      {
        role: "system",
        content: `You are a strict but fair interviewer evaluating a ${session.difficulty} interview for the role "${session.role}". Score each answer 0-10 and give short, actionable feedback. Do not invent facts. Return ONLY JSON: {"overallScore":0,"summary":"","strengths":[""],"improvements":[""],"perQuestion":[{"question":"","score":0,"feedback":"","idealAnswer":""}]}. overallScore is 0-100.`,
      },
      { role: "user", content: JSON.stringify(qa) },
    ]);

    const feedback = parseAiJson(raw);
    if (!feedback) return res.status(502).json({ success: false, message: "AI feedback failed. Try again." });

    await sql`
      UPDATE interview_sessions
      SET answers = ${JSON.stringify(answers)}::jsonb,
          feedback = ${JSON.stringify(feedback)}::jsonb
      WHERE id = ${id} AND user_id = ${userId}`;

    return res.json({ success: true, feedback });
  } catch (error) {
    console.error("[submitInterview] error", error?.message || error);
    if (error?.status === 429) {
      return res.status(429).json({ success: false, message: "Rate limit hit. Please try again in a few seconds." });
    }
    return res.status(500).json({ success: false, message: error.message || "Failed to submit interview" });
  }
};

// GET /api/interview/history
export const getHistory = async (req, res) => {
  try {
    const userId = req.userId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sessions = await sql`
      SELECT id, role, difficulty, questions, answers, feedback, created_at
      FROM interview_sessions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC`;

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error("[getHistory] error", error?.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load history" });
  }
};

// GET /api/interview/:id
export const getSession = async (req, res) => {
  try {
    const userId = req.userId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid session id" });

    const [session] = await sql`
      SELECT * FROM interview_sessions WHERE id = ${id} AND user_id = ${userId}`;
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    return res.json({ success: true, session });
  } catch (error) {
    console.error("[getSession] error", error?.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load session" });
  }
};
