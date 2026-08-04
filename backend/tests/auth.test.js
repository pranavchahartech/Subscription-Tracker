const request = require('supertest');

// Set test environment variables before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_minimum_32_characters';
process.env.JWT_RESET_SECRET = 'test_jwt_reset_secret_key_minimum_32_characters';

const app = require('../src/app');

describe('Auth Endpoints & Validation API', () => {
  const testUser = {
    email: `unittest_${Date.now()}@example.com`,
    password: 'password123',
  };

  test('POST /api/auth/register - Validation Error on invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body.details).toBeDefined();
  });

  test('POST /api/auth/register - Successfully registers user & sets httpOnly cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login - Successfully logs in user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login - Rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid email or password');
  });

  test('POST /api/auth/forgot-password - Triggers generic recovery response', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('verification code has been sent');
  });
});
