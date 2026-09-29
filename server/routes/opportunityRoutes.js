import express from "express";
import { getOpportunities } from "../controllers/opportunityController.js";

const opportunityRouter = express.Router();

opportunityRouter.get("/", getOpportunities);

export default opportunityRouter;
