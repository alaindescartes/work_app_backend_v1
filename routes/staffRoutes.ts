import express from "express";
import { addStaffData, deleteStaffData } from "../controller/userController.js";
import checkAuth from "../utils/checkAuth.js";

const router = express.Router();

//Route for adding staff to the database
router.post("/add-staff", checkAuth, addStaffData);

//route for deleting staff data
router.delete("/delete-staff", checkAuth, deleteStaffData);

export default router;
