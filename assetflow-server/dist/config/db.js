"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Initialize MongoDB connection pool.
 */
async function connectDatabase() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow';
    try {
        // Set Mongoose debugging in development
        if (process.env.NODE_ENV === 'development') {
            mongoose_1.default.set('debug', true);
        }
        // Connect to MongoDB
        await mongoose_1.default.connect(mongoUri, {
            autoIndex: true, // Auto-build indexes in dev (can be disabled in production)
        });
        console.log('✅ Connected to MongoDB database successfully.');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}
// Connection event listeners
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ MongoDB active connection error:', err);
});
