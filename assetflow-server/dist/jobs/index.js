"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const overdueDetectionJob_1 = require("./overdueDetectionJob");
const bookingRemindersJob_1 = require("./bookingRemindersJob");
const smartAlertsJob_1 = require("./smartAlertsJob");
function initCronJobs() {
    (0, overdueDetectionJob_1.startOverdueDetectionJob)();
    (0, bookingRemindersJob_1.startBookingJobs)();
    (0, smartAlertsJob_1.startSmartAlertsJob)();
}
