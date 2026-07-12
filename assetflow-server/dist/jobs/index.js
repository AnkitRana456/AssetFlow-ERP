"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const overdueDetectionJob_1 = require("./overdueDetectionJob");
function initCronJobs() {
    (0, overdueDetectionJob_1.startOverdueDetectionJob)();
}
