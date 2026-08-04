const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  updateBudgetSchema,
} = require('../schemas/authSchemas');

// Dedicated rate limiter for forgot-password endpoint (3 requests per 15 min per IP)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again after 15 minutes.' },
});

// Authentication endpoints
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshSession);
router.post('/logout', authController.logout);

// User profile & budget endpoints (Authenticated)
router.get('/me', authenticateToken, authController.getMe);
router.put('/budget', authenticateToken, validate(updateBudgetSchema), authController.updateBudget);

// Password recovery endpoints
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-code', validate(verifyResetCodeSchema), authController.verifyResetCode);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
