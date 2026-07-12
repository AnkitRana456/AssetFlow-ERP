"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const mongoose_1 = __importDefault(require("mongoose"));
describe('🔑 Authentication & Security Integration Tests', () => {
    beforeAll(async () => {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:2717/assetflow_test';
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(mongoUri);
        }
    });
    afterAll(async () => {
        await mongoose_1.default.connection.db?.dropDatabase();
        await mongoose_1.default.disconnect();
    });
    describe('POST /api/auth/login', () => {
        it('should reject login requests with invalid schemas', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({ email: 'bademail' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
        });
        it('should fail authentication for non-existent users', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({ email: 'unknown@assetflow.com', password: 'password123' });
            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/invalid/i);
        });
    });
    describe('JWT Middleware Protections', () => {
        it('should block requests to protected endpoints without auth headers', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/assets');
            expect(res.status).toBe(401);
        });
        it('should reject expired or malformed JWT access keys', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/assets')
                .set('Authorization', 'Bearer invalidtokenxyz');
            expect(res.status).toBe(401);
        });
    });
});
