import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listBudgets, upsertBudget, deleteBudget } from '../controllers/budgetController.js';

const router = Router();
router.use(authenticate);

router.get('/',               asyncHandler(listBudgets));
router.put('/:categoryId',    asyncHandler(upsertBudget));
router.delete('/:categoryId', asyncHandler(deleteBudget));

export default router;
