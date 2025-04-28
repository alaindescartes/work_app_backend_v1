import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { checkRole } from '../utils/checkAuth.js';
import multer from 'multer';
import { addResidentData, findResidentByGroupHome } from '../controller/residentController.js';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add-resident', checkRole, checkAuth, upload.single('image'), addResidentData);
router.get('/find-residents/:groupHomeId', checkAuth, findResidentByGroupHome);

export default router;
