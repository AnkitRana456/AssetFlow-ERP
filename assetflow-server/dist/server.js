"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const socket_1 = require("./socket");
const jobs_1 = require("./jobs");
const PORT = process.env.PORT || 5000;
async function startServer() {
    await (0, config_1.connectDatabase)();
    const server = http_1.default.createServer(app_1.default);
    // Initialize Socket.io
    socket_1.socketService.init(server);
    console.log('✅ Socket.io initialized successfully.');
    // Initialize Cron Jobs
    (0, jobs_1.initCronJobs)();
    console.log('⏰ Cron jobs initialized successfully.');
    server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}
startServer();
