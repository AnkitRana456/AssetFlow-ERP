"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const PORT = process.env.PORT || 5000;
async function startServer() {
    await (0, config_1.connectDatabase)();
    app_1.default.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
startServer();
