"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('🛡️ Role-Based Access Control (RBAC) Integration Tests', () => {
    let employeeToken;
    beforeAll(async () => {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:2717/assetflow_test';
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(mongoUri);
        }
        // Sign a temporary mockup token for an standard EMPLOYEE role
        employeeToken = jsonwebtoken_1.default.sign({ id: '123456789012345678901234', role: 'EMPLOYEE', email: 'employee@assetflow.com' }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1h' });
    });
    afterAll(async () => {
        await mongoose_1.default.connection.db?.dropDatabase();
        await mongoose_1.default.disconnect();
    });
    describe('Strict Audit Trail Controls', () => {
        it('should forbid standard employees from listing activity audit logs', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/logs')
                .set('Authorization', `Bearer ${employeeToken}`);
            expect(res.status).toBe(403);
        });
        it('should forbid standard employees from viewing administrative audit campaigns dashboard', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/audit/dashboard')
                .set('Authorization', `Bearer ${employeeToken}`);
            expect(res.status).toBe(403);
        });
        it('should forbid standard employees from retrieving campaign summary reports', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/audit/123456789012345678901234/report')
                .set('Authorization', `Bearer ${employeeToken}`);
            expect(res.status).toBe(403);
        });
    });
});
