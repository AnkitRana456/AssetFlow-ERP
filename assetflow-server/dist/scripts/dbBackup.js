"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const BACKUP_DIR = path_1.default.join(__dirname, '../../backups');
async function runBackup() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI environment variable is missing.');
        process.exit(1);
    }
    console.log('⚡ Starting database backup process...');
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to database.');
        // Ensure backup directory exists
        if (!fs_1.default.existsSync(BACKUP_DIR)) {
            fs_1.default.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const folderName = `backup-${timestamp}`;
        const targetPath = path_1.default.join(BACKUP_DIR, folderName);
        fs_1.default.mkdirSync(targetPath);
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('Database connection is undefined');
        }
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            console.log(`📦 Dumping collection: ${col.name}`);
            const data = await db.collection(col.name).find({}).toArray();
            const filePath = path_1.default.join(targetPath, `${col.name}.json`);
            fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        console.log(`🎉 Database backup created successfully at: ${targetPath}`);
        // Purge old backups (keep last 7 days)
        const backupFolders = fs_1.default.readdirSync(BACKUP_DIR)
            .map(name => ({ name, path: path_1.default.join(BACKUP_DIR, name), stat: fs_1.default.statSync(path_1.default.join(BACKUP_DIR, name)) }))
            .filter(item => item.stat.isDirectory() && item.name.startsWith('backup-'))
            .sort((a, b) => a.stat.mtime.getTime() - b.stat.mtime.getTime());
        if (backupFolders.length > 7) {
            const purgeList = backupFolders.slice(0, backupFolders.length - 7);
            for (const folder of purgeList) {
                console.log(`🧹 Purging old backup: ${folder.name}`);
                fs_1.default.rmSync(folder.path, { recursive: true, force: true });
            }
        }
    }
    catch (error) {
        console.error('❌ Database backup process failed:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from database.');
    }
}
runBackup();
