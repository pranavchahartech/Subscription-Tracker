const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./models/db');
const logger = require('./utils/logger');
const { startReminderJob } = require('./jobs/reminderJob');
require('dotenv').config();

// Enforce required secrets at boot
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_RESET_SECRET) {
  logger.error('FATAL: JWT_SECRET, JWT_REFRESH_SECRET, and JWT_RESET_SECRET environment variables must all be defined.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet());

// CORS configuration (Credentials allowed for httpOnly cookie authentication)
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Global rate limiter (100 requests / 15 mins per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// Auth Rate Limiter (15 requests / 15 mins per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again after 15 minutes.' },
});

// Route Handlers
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

// Health check with database connectivity ping
app.get('/health', async (req, res) => {
  try {
    const { pool } = require('./models/db');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', uptime: Math.floor(process.uptime()) });
  } catch (err) {
    logger.error({ err }, 'Health check DB ping failed');
    res.status(503).json({ status: 'degraded', db: 'disconnected', uptime: Math.floor(process.uptime()) });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const startServer = async () => {
  try {
    await initDb();
    startReminderJob();
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Backend server running');
    });
  } catch (err) {
    logger.error({ err }, 'Unable to start backend server');
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
