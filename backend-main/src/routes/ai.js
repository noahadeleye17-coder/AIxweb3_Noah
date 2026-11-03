import { Router } from "express";
import { analyseSavingsController } from "../controllers/aiController.js";

const router = Router();

router.post("/analyse-savings", analyseSavingsController);

export default router;