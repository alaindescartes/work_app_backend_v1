import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import {
  addAllowance,
  addCashCount,
  cashTransaction,
  getCashCountByHome,
} from '../controller/financeController.js';
const router = express.Router();
router.get('/get-cashCount-by-home/:homeId', checkAuth, getCashCountByHome);
router.post('/add-cashCount', checkAuth, addCashCount);
router.post('/add-allowance/:supervisorId', checkAuth, addAllowance);
router.post('/cash-transaction', checkAuth, cashTransaction);

export default router;
