import express from "express";
import checkAuth from "../utils/checkAuth.js";
import {
  addGroupHomeData,
  getAllGrouphomes,
} from "../controller/grouphomeController.js";
const router = express.Router();

router.post("/add-grouphome", checkAuth, addGroupHomeData);
router.get("/get-grouphomes", checkAuth, getAllGrouphomes);

export default router;
