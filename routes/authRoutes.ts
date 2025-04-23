import express from "express";
import { getSession, login, logout } from "../controller/authController.js";
const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/get-session", getSession);

export default router;
