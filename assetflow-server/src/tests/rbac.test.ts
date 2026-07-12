import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('🛡️ Role-Based Access Control (RBAC) Integration Tests', () => {
  let employeeToken: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:2717/assetflow_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Sign a temporary mockup token for an standard EMPLOYEE role
    employeeToken = jwt.sign(
      { id: '123456789012345678901234', role: 'EMPLOYEE', email: 'employee@assetflow.com' },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  });

  describe('Strict Audit Trail Controls', () => {
    it('should forbid standard employees from listing activity audit logs', async () => {
      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should forbid standard employees from viewing administrative audit campaigns dashboard', async () => {
      const res = await request(app)
        .get('/api/audit/dashboard')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should forbid standard employees from retrieving campaign summary reports', async () => {
      const res = await request(app)
        .get('/api/audit/123456789012345678901234/report')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });
});
