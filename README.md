# 🚀 AssetFlow ERP
### Enterprise Asset & Resource Management System

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Node](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)

Enterprise-grade Asset & Resource Management System built for the **Odoo Hackathon**.

</div>

---

# 📌 Overview

AssetFlow is a modern Enterprise Resource Planning (ERP) platform that enables organizations to efficiently manage physical assets, shared resources, maintenance workflows, audit cycles, bookings, analytics, and organizational operations through a centralized dashboard.

The system is designed for enterprises, educational institutions, hospitals, manufacturing industries, government organizations, and any company managing physical assets.

---

# ✨ Key Features

## 🔐 Authentication

- JWT Authentication
- Refresh Tokens
- Forgot Password
- Reset Password
- Role Based Access Control
- Secure Sessions
- Protected Routes

---

## 👥 Organization Management

- Department Management
- Department Hierarchy
- Employee Directory
- Asset Categories
- Role Promotion
- Organization Settings

---

## 💼 Asset Management

- Register Assets
- QR Code Generation
- Barcode Support
- Asset Images
- Document Uploads
- Asset Lifecycle
- Asset Timeline
- Bulk Import
- Bulk Export
- Advanced Search

---

## 🔄 Asset Allocation

- Asset Assignment
- Transfer Requests
- Return Workflow
- Approval Workflow
- Allocation History
- Overdue Detection

---

## 📅 Resource Booking

- Meeting Room Booking
- Vehicle Booking
- Equipment Booking
- Calendar View
- Conflict Detection
- Booking Reminders
- Booking Analytics

---

## 🛠 Maintenance

- Raise Requests
- Approval Workflow
- Technician Assignment
- Work Orders
- Maintenance Timeline
- SLA Tracking
- Cost Tracking

---

## 📋 Audit Management

- Audit Cycles
- Auditor Assignment
- QR Verification
- Discrepancy Reports
- Audit Analytics
- Compliance Reports

---

## 📊 Reports & Analytics

- Executive Dashboard
- Department Reports
- Asset Utilization
- Maintenance Reports
- Booking Analytics
- Export PDF
- Export Excel
- Export CSV

---

## 🤖 AI Assistant

- Natural Language Search
- AI Report Generation
- Maintenance Prediction
- Executive Dashboard Summary
- Smart Recommendations
- Audit Summary

---

## 🔔 Notifications

- Real-time Notifications
- Email Notifications
- Booking Reminders
- Maintenance Updates
- Transfer Alerts
- Audit Alerts

---

## 📜 Activity Logs

- Complete Audit Trail
- User Activities
- Security Logs
- System Logs

---

# 🏗 Architecture

```
Client (React)

↓

REST API

↓

Express Server

↓

MongoDB Atlas

↓

Cloudinary

↓

Socket.io

↓

Gemini AI

↓

Nodemailer
```

---

# 🖥 Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Framer Motion
- TanStack Query
- React Hook Form
- Zod
- Zustand
- Recharts
- Axios

---

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- Cloudinary
- Socket.io
- Nodemailer
- Node Cron

---

## Database

- MongoDB Atlas

---

## AI

- Google Gemini API

---

## Deployment

- Vercel
- Render
- Docker
- Docker Compose

---

# 👨‍💻 User Roles

## Admin

- Manage Departments
- Manage Employees
- Promote Roles
- Analytics
- Audit Cycles
- Reports
- System Settings

---

## Asset Manager

- Register Assets
- Allocate Assets
- Maintenance Approval
- Transfer Approval
- Asset Reports

---

## Department Head

- Department Assets
- Booking Approval
- Allocation Approval

---

## Employee

- View Assets
- Book Resources
- Raise Maintenance
- Request Transfer
- Request Return

---

# 📁 Folder Structure

```
AssetFlow/

├── assetflow-client/

│── src/

│ ├── components/

│ ├── pages/

│ ├── layouts/

│ ├── hooks/

│ ├── services/

│ ├── store/

│ ├── routes/

│ ├── utils/

│ ├── types/

│ └── assets/

│

├── assetflow-server/

│── src/

│ ├── controllers/

│ ├── services/

│ ├── repositories/

│ ├── models/

│ ├── middleware/

│ ├── routes/

│ ├── validators/

│ ├── config/

│ ├── jobs/

│ ├── socket/

│ ├── utils/

│ └── seed/

│

└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/AssetFlow.git

cd AssetFlow
```

---

## Backend

```bash
cd assetflow-server

npm install
```

---

## Frontend

```bash
cd ../assetflow-client

npm install
```

---

# 🔑 Environment Variables

## Backend

Create

```
assetflow-server/.env
```

```env
PORT=5000

NODE_ENV=development

MONGODB_URI=

JWT_SECRET=

JWT_REFRESH_SECRET=

CLIENT_URL=http://localhost:5173

SERVER_URL=http://localhost:5000

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

EMAIL_HOST=

EMAIL_PORT=

EMAIL_USER=

EMAIL_PASSWORD=

GEMINI_API_KEY=
```

---

## Frontend

Create

```
assetflow-client/.env
```

```env
VITE_API_URL=http://localhost:5000/api

VITE_SOCKET_URL=http://localhost:5000

VITE_GEMINI_API_KEY=
```

---

# ▶ Running Project

Backend

```bash
npm run dev
```

Frontend

```bash
npm run dev
```

---

# 📊 Core Modules

- Authentication
- Organization Management
- Asset Registration
- Asset Directory
- Allocation Workflow
- Resource Booking
- Maintenance
- Audit
- Reports
- AI Assistant
- Notifications
- Activity Logs

---

# 🔐 Security

- JWT Authentication
- Password Hashing
- Helmet
- Rate Limiting
- Input Validation
- XSS Protection
- CORS
- RBAC

---

# 📱 Responsive

- Mobile
- Tablet
- Laptop
- Desktop

---

# 📈 Future Enhancements

- Mobile Application
- RFID Integration
- IoT Sensors
- Predictive Maintenance
- Multi-Tenant Support
- SAP Integration
- Odoo Integration
- SSO Authentication

---

# 🤝 Contributors

Developed by

**Ankit Rana**

For the **Odoo Enterprise ERP Hackathon**

---

# 📄 License

This project is developed for educational and hackathon purposes.

---

<div align="center">

⭐ If you like this project, consider giving it a star!

</div>
