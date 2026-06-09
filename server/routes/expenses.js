import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listExpenses, createExpense, updateExpense, deleteExpense,
  getExpenseSummary, getMonthlyTotals, exportExpenses,
} from '../controllers/expenseController.js';

const router = Router();
router.use(authenticate);

// Named routes MUST come before /:id to avoid "summary" being treated as an id
router.get('/summary',        asyncHandler(getExpenseSummary));
router.get('/monthly-totals', asyncHandler(getMonthlyTotals));
router.get('/export',         asyncHandler(exportExpenses));
router.get('/',               asyncHandler(listExpenses));
router.post('/',              asyncHandler(createExpense));
router.put('/:id',            asyncHandler(updateExpense));
router.delete('/:id',         asyncHandler(deleteExpense));

export default router;
