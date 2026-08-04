const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./models/db');
const logger = require('./utils/logger');
const { startReminderJob } = require('./jobs/reminderJob');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Global rate limiter — 100 requests per 15 min per IP (broad safety net)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// Tighter limiter for auth endpoints (login + register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again after 15 minutes.' },
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

// Enhanced health check — includes DB connectivity
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

// Global error handler
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

startServer();
