const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'your_jwt_reset_secret';


const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase().trim(), passwordHash]
    );

    const user = newUser.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    logger.error({ err }, 'Registration error');
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    logger.error({ err }, 'Login error');
    res.status(500).json({ error: 'Server error during login' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const sendGenericResponse = () => {
    return res.json({ message: 'If the email exists, a verification code has been sent.' });
  };

  try {
    const formattedEmail = email.toLowerCase().trim();

    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [formattedEmail]);
    if (userCheck.rows.length === 0) {
      return sendGenericResponse();
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);

    // Set expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to database
    await db.query(
      'INSERT INTO password_resets (email, code_hash, expires_at) VALUES ($1, $2, $3)',
      [formattedEmail, codeHash, expiresAt]
    );

    // Send email using nodemailer
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
    logger.info({ email: formattedEmail }, 'Password reset code sent');

    return sendGenericResponse();
  } catch (err) {
    logger.error({ err }, 'Forgot password error');
    res.status(500).json({ error: 'Server error during forgot password' });
  }
};


const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  try {
    const formattedEmail = email.toLowerCase().trim();

    // Find latest active code
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

    // Increment attempts
    await db.query(
      'UPDATE password_resets SET attempts = attempts + 1 WHERE id = $1',
      [resetRecord.id]
    );

    // Verify code match
    const isMatch = await bcrypt.compare(code, resetRecord.code_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Generate reset JWT token (10 minutes)
    const resetToken = jwt.sign(
      { email: formattedEmail, resetId: resetRecord.id },
      JWT_RESET_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      message: 'Code verified successfully',
      resetToken
    });
  } catch (err) {
    console.error('Verify reset code error:', err);
    res.status(500).json({ error: 'Server error during code verification' });
  }
};

const resetPassword = async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ error: 'Email, reset token, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const formattedEmail = email.toLowerCase().trim();

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_RESET_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.email !== formattedEmail) {
      return res.status(400).json({ error: 'Token email mismatch' });
    }

    const checkReset = await db.query(
      'SELECT used FROM password_resets WHERE id = $1',
      [decoded.resetId]
    );
    if (checkReset.rows.length === 0 || checkReset.rows[0].used) {
      return res.status(400).json({ error: 'Reset token already used or invalid' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [newPasswordHash, formattedEmail]
    );

    await db.query(
      'UPDATE password_resets SET used = TRUE WHERE id = $1',
      [decoded.resetId]
    );

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error during password reset' });
  }
};


module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword
};
