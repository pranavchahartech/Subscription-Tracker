const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

const verifyResetCodeSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  code: z.string().length(6, 'Verification code must be exactly 6 digits').regex(/^\d+$/, 'Code must contain digits only'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

const updateBudgetSchema = z.object({
  monthly_budget: z.number().min(0, 'Budget must be greater than or equal to 0'),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  updateBudgetSchema,
};
