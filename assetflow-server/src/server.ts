import http from 'http';
import app from './app';
import { connectDatabase } from './config';
import { socketService } from './socket';
import { initCronJobs } from './jobs';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();
  
  const server = http.createServer(app);
  
  // Initialize Socket.io
  socketService.init(server);
  console.log('✅ Socket.io initialized successfully.');
  
  // Initialize Cron Jobs
  initCronJobs();
  console.log('⏰ Cron jobs initialized successfully.');

  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

startServer();

