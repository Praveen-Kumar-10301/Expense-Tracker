import { Router } from 'express';
import { register, login, logout, getMe, updateName, changePassword, deleteAccount } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login',    asyncHandler(login));
router.post('/logout',   logout);
router.get('/me',        authenticate, asyncHandler(getMe));
router.put('/name',      authenticate, asyncHandler(updateName));
router.put('/password',  authenticate, asyncHandler(changePassword));
router.delete('/account', authenticate, asyncHandler(deleteAccount));

export default router;
