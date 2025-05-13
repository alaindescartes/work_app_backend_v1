import express from "express";
import checkAuth, { checkRole } from "../utils/checkAuth.js";

const router = express.Router();

router.post("add-task", checkAuth, checkRole);

export default router;
