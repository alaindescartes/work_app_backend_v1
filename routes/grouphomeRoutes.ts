import express from "express";
import checkAuth from "../utils/checkAuth.js";
import {
  addGroupHomeData,
  getAllGrouphomes,
} from "../controller/grouphomeController.js";
import multer from "multer"
const router = express.Router();
const upload = multer({storage:multer.memoryStorage()})

router.post("/add-grouphome", checkAuth, upload.single("image"),addGroupHomeData);
router.get("/get-grouphomes", checkAuth, getAllGrouphomes);

export default router;
