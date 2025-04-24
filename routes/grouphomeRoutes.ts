import express from 'express';
import checkAuth, { checkRole } from '../utils/checkAuth.js';
import {
  addGroupHomeData,
  deleteGroupHome,
  editGroupHome,
  getAllGrouphomes,
  getIndividualGroupHome,
} from '../controller/grouphomeController.js';
import multer from 'multer';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add-grouphome', checkAuth, upload.single('image'), addGroupHomeData);
router.get('/get-grouphomes', checkAuth, getAllGrouphomes);
router.post('/delete-groupHome/:id', checkAuth, checkRole, deleteGroupHome);
router.post(
  '/edit-grouphome/:id/home',
  checkAuth,
  checkRole,
  upload.single('image'),
  editGroupHome
);
router.get('/get-grouphome/:id', checkAuth, getIndividualGroupHome);

export default router;
