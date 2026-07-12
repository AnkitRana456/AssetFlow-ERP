# AssetFlow ERP

AssetFlow is a web-based asset and resource planning (ERP) platform built using the MERN stack. The codebase provides real-time physical inventory monitoring, device allocation logs, shared resource bookings, scheduled maintenance, AI-assisted dashboard analysis, and system activity logging.

---

## 🏗️ Architecture & Stack

The repository is structured as a decoupled monorepo containing a React frontend client and an Express Node.js API server.

- **Backend**: Node.js, Express, Mongoose (MongoDB). Utilizes Helmet for security headers, express-rate-limit to protect computationally heavy routes (like the Gemini chat service), and GZIP compression for payload optimization.
- **Frontend**: React, Vite, Zustand (auth context), React Hook Form, and TanStack React Query (data caching and sync). Navigation routes are split via dynamic imports (`React.lazy`) to minimize initial bundle loading sizes.

---

## 📂 Repository Structure

- `assetflow-client/`: Vite React client application.
  - `src/components/`: Core interface layouts (collapsible Sidebar, Navbar, and AI widget).
  - `src/hooks/`: Data synchronizations with React Query.
  - `src/pages/`: Main application modules.
- `assetflow-server/`: Express REST API.
  - `src/controllers/`: Route handlers. Wraps routes in a central `asyncHandler` utility to propagate errors cleanly.
  - `src/middlewares/`: JWT authentication, Role-Based Access Control (RBAC), and activity logging.
  - `src/models/`: Mongoose schemas. Configured with text indices for inventory searches and compound indices for booking conflict verification.
  - `src/tests/`: Integration and API test suites.

---

## ⚡ Setup & Development

### 1. Database and Server Configuration
Ensure you have a MongoDB instance (local or Atlas cluster) running, then configure `.env` inside the `assetflow-server` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/assetflow
JWT_SECRET=development-secret-signing-key
GEMINI_API_KEY=your-google-gemini-credentials
CLIENT_URL=http://localhost:5173
```

### 2. Seed Initial Database
Seed departments, categories, and test users into the database instance:
```bash
cd assetflow-server
npm run seed
```

### 3. Start Development Services
- **Backend API**:
  ```bash
  cd assetflow-server
  npm run dev
  ```
- **Frontend Client**:
  ```bash
  cd assetflow-client
  npm i
  ```
  Then run the local Vite bundler:
  ```bash
  npm run dev
  ```

---

## 🔒 Testing and Operations

### Running Jest Test Suites
The server includes automated integration tests utilizing Jest and Supertest to verify authentication states and RBAC endpoint rules. Run tests from the server folder:
```bash
npm run test
```

### Automated Database Backups
A collection dump and rotation script is located at `src/scripts/dbBackup.ts`. It dumps all active MongoDB collections to local backups and retains the last 7 daily folders:
```bash
# Compile and run
npm run build
node dist/scripts/dbBackup.js
```

### PM2 Clustering
For production deployments, manage processes using PM2:
```bash
pm2 start ecosystem.config.js --env production
```
