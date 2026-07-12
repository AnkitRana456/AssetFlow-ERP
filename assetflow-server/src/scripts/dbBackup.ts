import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const BACKUP_DIR = path.join(__dirname, '../../backups');

async function runBackup() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  console.log('⚡ Starting database backup process...');
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database.');

    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `backup-${timestamp}`;
    const targetPath = path.join(BACKUP_DIR, folderName);
    fs.mkdirSync(targetPath);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is undefined');
    }
    const collections = await db.listCollections().toArray();

    for (const col of collections) {
      console.log(`📦 Dumping collection: ${col.name}`);
      const data = await db.collection(col.name).find({}).toArray();
      const filePath = path.join(targetPath, `${col.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    console.log(`🎉 Database backup created successfully at: ${targetPath}`);
    
    // Purge old backups (keep last 7 days)
    const backupFolders = fs.readdirSync(BACKUP_DIR)
      .map(name => ({ name, path: path.join(BACKUP_DIR, name), stat: fs.statSync(path.join(BACKUP_DIR, name)) }))
      .filter(item => item.stat.isDirectory() && item.name.startsWith('backup-'))
      .sort((a, b) => a.stat.mtime.getTime() - b.stat.mtime.getTime());

    if (backupFolders.length > 7) {
      const purgeList = backupFolders.slice(0, backupFolders.length - 7);
      for (const folder of purgeList) {
        console.log(`🧹 Purging old backup: ${folder.name}`);
        fs.rmSync(folder.path, { recursive: true, force: true });
      }
    }

  } catch (error) {
    console.error('❌ Database backup process failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

runBackup();
