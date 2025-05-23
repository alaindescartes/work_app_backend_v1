import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { checkRole } from '../utils/checkAuth.js';
import multer from 'multer';
import {
  addResidentData,
  deleteResident,
  editResident,
  findResidentByGroupHome,
  getSingleClient,
} from '../controller/residentController.js';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add-resident', checkRole, checkAuth, upload.single('image'), addResidentData);
router.get('/find-residents/:groupHomeId', checkAuth, findResidentByGroupHome);
router.delete('/delete-resident/:clientId', checkAuth, checkRole, deleteResident);
router.post('/edit-resident/:clientId', checkAuth, upload.single('image'), editResident);
router.get('/single-client/:clientId', checkAuth, getSingleClient);

export default router;
