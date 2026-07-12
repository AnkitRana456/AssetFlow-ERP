import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { errorHandler } from './middlewares';

dotenv.config();

const app = express();

// Standard middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routing
app.use('/api', apiRouter);

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'assetflow-server', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

export default app;
