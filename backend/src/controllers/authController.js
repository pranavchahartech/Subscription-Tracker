const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');
const logger = require('../utils/logger');

// Environment Secrets Validation
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_RESET_SECRET) {
  throw new Error('FATAL: JWT_SECRET, JWT_REFRESH_SECRET, and JWT_RESET_SECRET environment variables must all be defined.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;

const IS_PROD = process.env.NODE_ENV === 'production';

// Cookie Configuration Helpers
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  path: '/',
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
};

// Generate & Persist Refresh Token in DB
const generateAndStoreRefreshToken = async (userId) => {
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  const salt = await bcrypt.genSalt(10);
  const tokenHash = await bcrypt.hash(refreshToken, salt);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return refreshToken;
};

const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const formattedEmail = email.toLowerCase().trim();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [formattedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, monthly_budget',
      [formattedEmail, passwordHash]
    );

    const user = newUser.rows[0];
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = await generateAndStoreRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, monthly_budget: parseFloat(user.monthly_budget) }
    });
  } catch (err) {
    logger.error({ err }, 'Registration error');
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const formattedEmail = email.toLowerCase().trim();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [formattedEmail]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = await generateAndStoreRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, monthly_budget: parseFloat(user.monthly_budget) }
    });
  } catch (err) {
    logger.error({ err }, 'Login error');
    res.status(500).json({ error: 'Server error during login' });
  }
};

const refreshSession = async (req, res) => {
  let refreshToken = req.cookies?.refreshToken;
  if (!refreshToken && req.headers['x-refresh-token']) {
    refreshToken = req.headers['x-refresh-token'];
  }

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Check if refresh token is revoked or present in DB
    const tokens = await db.query(
      'SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC',
      [decoded.userId]
    );

    let validTokenRecord = null;
    for (const record of tokens.rows) {
      const match = await bcrypt.compare(refreshToken, record.token_hash);
      if (match) {
        validTokenRecord = record;
        break;
      }
    }

    if (!validTokenRecord) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token invalid or revoked' });
    }

    // Revoke current refresh token (rotation)
    await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [validTokenRecord.id]);

    // Issue new token pair
    const newAccessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = await generateAndStoreRefreshToken(decoded.userId);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    const userRes = await db.query('SELECT id, email, monthly_budget FROM users WHERE id = $1', [decoded.userId]);
    const user = userRes.rows[0];

    res.json({
      message: 'Session refreshed',
      user: { id: user.id, email: user.email, monthly_budget: parseFloat(user.monthly_budget) }
    });
  } catch (err) {
    clearAuthCookies(res);
    logger.error({ err }, 'Refresh session error');
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.userId) {
        await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [decoded.userId]);
      }
    } catch {
      // Ignore token decode errors during logout
    }
  }

  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, monthly_budget FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(44).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      monthly_budget: parseFloat(user.monthly_budget)
    });
  } catch (err) {
    logger.error({ err }, 'Get user profile error');
    res.status(500).json({ error: 'Server error while fetching user profile' });
  }
};

const updateBudget = async (req, res) => {
  const { monthly_budget } = req.body;

  try {
    const result = await db.query(
      'UPDATE users SET monthly_budget = $1 WHERE id = $2 RETURNING id, email, monthly_budget',
      [monthly_budget, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      message: 'Monthly budget updated successfully',
      user: { id: user.id, email: user.email, monthly_budget: parseFloat(user.monthly_budget) }
    });
  } catch (err) {
    logger.error({ err }, 'Update budget error');
    res.status(500).json({ error: 'Server error while updating monthly budget' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const sendGenericResponse = () => {
    return res.json({ message: 'If the email exists, a verification code has been sent.' });
  };

  try {
    const formattedEmail = email.toLowerCase().trim();
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [formattedEmail]);
    if (userCheck.rows.length === 0) {
      return sendGenericResponse();
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      'INSERT INTO password_resets (email, code_hash, expires_at) VALUES ($1, $2, $3)',
      [formattedEmail, codeHash, expiresAt]
    );

    const mailOptions = {
      from: `"SubSpace Support" <${process.env.SMTP_USER || 'no-reply@subspace.com'}>`,
      to: formattedEmail,
      subject: 'Password Reset Verification Code',
      text: `Your password reset verification code is: ${code}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset for your SubSpace account.</p>
          <p>Please use the following 6-digit code to verify your identity:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 10px; background-color: #f3f4f6; display: inline-block; border-radius: 8px; margin: 10px 0;">${code}</div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    };

    sendMail(mailOptions);
    if (process.env.NODE_ENV !== 'production') {
      logger.info({ email: formattedEmail, code }, '[DEV ONLY] Verification code generated');
    }

    return sendGenericResponse();
  } catch (err) {
    logger.error({ err }, 'Forgot password error');
    res.status(500).json({ error: 'Server error during forgot password' });
  }
};

const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const formattedEmail = email.toLowerCase().trim();

    const result = await db.query(
      'SELECT * FROM password_resets WHERE email = $1 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [formattedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const resetRecord = result.rows[0];

    if (resetRecord.attempts >= 3) {
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    await db.query('UPDATE password_resets SET attempts = attempts + 1 WHERE id = $1', [resetRecord.id]);

    const isMatch = await bcrypt.compare(code, resetRecord.code_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const resetToken = jwt.sign(
      { email: formattedEmail, resetId: resetRecord.id },
      JWT_RESET_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ message: 'Code verified successfully', resetToken });
  } catch (err) {
    logger.error({ err }, 'Verify reset code error');
    res.status(500).json({ error: 'Server error during code verification' });
  }
};

const resetPassword = async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  try {
    const formattedEmail = email.toLowerCase().trim();

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_RESET_SECRET);
    } catch {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.email !== formattedEmail) {
      return res.status(400).json({ error: 'Reset token mismatch' });
    }

    const resetCheck = await db.query(
      'SELECT * FROM password_resets WHERE id = $1 AND used = FALSE AND expires_at > NOW()',
      [decoded.resetId]
    );

    if (resetCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Reset token already used or invalid' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newPasswordHash, formattedEmail]);
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [decoded.resetId]);

    // Revoke active refresh tokens for security
    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [formattedEmail]);
    if (userRes.rows.length > 0) {
      await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1', [userRes.rows[0].id]);
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    logger.error({ err }, 'Reset password error');
    res.status(500).json({ error: 'Server error during password reset' });
  }
};

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  getMe,
  updateBudget,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
