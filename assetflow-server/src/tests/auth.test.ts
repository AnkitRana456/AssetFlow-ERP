import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';

describe('🔑 Authentication & Security Integration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:2717/assetflow_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should reject login requests with invalid schemas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bademail' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should fail authentication for non-existent users', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@assetflow.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });

  describe('JWT Middleware Protections', () => {
    it('should block requests to protected endpoints without auth headers', async () => {
      const res = await request(app).get('/api/assets');
      expect(res.status).toBe(401);
    });

    it('should reject expired or malformed JWT access keys', async () => {
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', 'Bearer invalidtokenxyz');
      
      expect(res.status).toBe(401);
    });
  });
});
