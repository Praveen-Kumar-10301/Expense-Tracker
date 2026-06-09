import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getIncome, setIncome } from '../controllers/incomeController.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(getIncome));
router.put('/', asyncHandler(setIncome));

export default router;
