# Production Deployment Guide - AssetFlow ERP

This guide provides instructions for deploying AssetFlow ERP to a production-ready environment using hosted cloud providers.

---

## ☁️ 1. MongoDB Atlas Configuration
1. **Sign Up**: Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Create Cluster**: Spin up a shared tier cluster (M0) or dedicated cluster.
3. **Database Access**: Create a database user with read/write credentials.
4. **Network Access**: Add IP Access list permissions (`0.0.0.0/0` for cloud deployment or whitelist specific server instances).
5. **Connection String**: Retrieve the connection URI (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/assetflow`).

---

## 🖼️ 2. Cloudinary Setup (Media Assets)
1. **Sign Up**: Create an account at [Cloudinary](https://cloudinary.com).
2. **Retrieve API Credentials**: Copy the Cloud Name, API Key, and API Secret from the console dashboard.
3. **Configure Environment**: Configure the server keys in the environment parameters (see variables below).

---

## 🚀 3. Backend Deployment (Render / Heroku)
The Express backend is deployed as a Web Service.

1. **Deploy to Render**:
   - Create a new **Web Service** pointing to your repository.
   - Root Directory: `assetflow-server`.
   - Build Command: `npm install && npm run build` (compiles TS files to `dist/`).
   - Start Command: `npm start` (runs `node dist/server.js`).
2. **Add Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=production-secret-signing-key
   GEMINI_API_KEY=google-gemini-credentials-token
   CLIENT_URL=https://your-vercel-frontend-domain.vercel.app
   ```

---

## 🎨 4. Frontend Deployment (Vercel)
The React client is deployed as static files.

1. **Deploy to Vercel**:
   - Import your repository.
   - Root Directory: `assetflow-client`.
   - Framework Preset: `Vite`.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
2. **Configure Router Redirects**:
   Vercel requires a `vercel.json` file in the root of the client folder to support SPA browser routing.
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           }
         ]
       }
     ]
   }
   ```

---

## 🔒 5. SSL, HTTPS & Encryption
- **Render** and **Vercel** automatically provision and renew valid Let's Encrypt SSL certificates for HTTPS custom domains out of the box.
- All HTTP requests are redirected to HTTPS by default.

---

## ⏰ 6. Scheduled Backups
To automate database dumps, configure a daily cron job to run the backup script:

```bash
# Compile and run the backup script
node dist/scripts/dbBackup.js
```
Use crontab to schedule daily exports:
```cron
0 0 * * * cd /path/to/server && node dist/scripts/dbBackup.js >> /var/log/dbbackup.log 2>&1
```
