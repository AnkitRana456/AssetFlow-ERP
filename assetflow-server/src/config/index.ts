export * from './db';

export const CONFIG = {
  db: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow'
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_me_in_production_123456',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_change_me_in_production_678910',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  }
};
