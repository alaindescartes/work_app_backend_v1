import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { addMeal, getMeals } from '../controller/mealController.js';
const router = express.Router();
router.get('/get-meals/:homeId', checkAuth, getMeals);
router.post('/add-meal', checkAuth, addMeal);
export default router;
