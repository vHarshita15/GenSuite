import express from "express";
import {
  startInterview,
  submitInterview,
  getHistory,
  getSession,
} from "../controllers/interviewController.js";

const interviewRouter = express.Router();

interviewRouter.post("/start", startInterview);
interviewRouter.get("/history", getHistory);
interviewRouter.post("/:id/submit", submitInterview);
interviewRouter.get("/:id", getSession);

export default interviewRouter;
