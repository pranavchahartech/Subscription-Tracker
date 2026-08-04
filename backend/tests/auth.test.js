const request = require('supertest');

// Set test environment variables BEFORE requiring app or any modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_minimum_32_characters';
process.env.JWT_RESET_SECRET = 'test_jwt_reset_secret_key_minimum_32_characters';

// Mock the database module — prevents ECONNREFUSED when no PostgreSQL is running
jest.mock('../src/models/db', () => ({
  query: jest.fn(),
  pool: { query: jest.fn(), end: jest.fn() },
  initDb: jest.fn().mockResolvedValue(undefined),
}));

// Mock the mailer — prevents SMTP connection attempts in tests
jest.mock('../src/utils/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

const db = require('../src/models/db');
const bcrypt = require('bcryptjs');
const app = require('../src/app');

describe('Auth Endpoints & Validation API', () => {
  const testUser = {
    email: 'unittest@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register - Validation Error on invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body.details).toBeDefined();
  });

  test('POST /api/auth/register - Successfully registers user & sets httpOnly cookies', async () => {
    // 1st call: SELECT to check if email exists → no rows
    // 2nd call: INSERT user → returns new user row
    // 3rd call: INSERT refresh token
    db.query
      .mockResolvedValueOnce({ rows: [] }) // email existence check
      .mockResolvedValueOnce({             // INSERT user
        rows: [{ id: 'uuid-1234', email: testUser.email, monthly_budget: '0.00' }]
      })
      .mockResolvedValueOnce({ rows: [] }); // INSERT refresh_token

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login - Successfully logs in user', async () => {
    // Pre-hash the test password to simulate what the DB stores
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testUser.password, salt);

    // 1st call: SELECT user by email → returns user with hashed password
    // 2nd call: INSERT refresh_token
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 'uuid-1234', email: testUser.email, password_hash: passwordHash, monthly_budget: '0.00' }]
      })
      .mockResolvedValueOnce({ rows: [] }); // INSERT refresh_token

    const res = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login - Rejects invalid password', async () => {
    // Return a user but with a hash that won't match 'wrongpassword'
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('correctpassword', salt);

    db.query.mockResolvedValueOnce({
      rows: [{ id: 'uuid-1234', email: testUser.email, password_hash: passwordHash, monthly_budget: '0.00' }]
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid email or password');
  });

  test('POST /api/auth/forgot-password - Triggers generic recovery response (user not found)', async () => {
    // SELECT returns no user → should still return the generic message (timing-safe)
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('verification code has been sent');
  });

  test('POST /api/auth/forgot-password - Triggers generic recovery response (user found)', async () => {
    // SELECT returns a user → inserts reset code, sends email, returns same generic message
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'uuid-1234' }] }) // SELECT user
      .mockResolvedValueOnce({ rows: [] });                    // INSERT password_reset

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('verification code has been sent');
  });

  test('GET /api/auth/me - Returns 401 without authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/logout - Clears cookies successfully', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
});
