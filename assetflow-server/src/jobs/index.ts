import { startOverdueDetectionJob } from './overdueDetectionJob';
import { startBookingJobs } from './bookingRemindersJob';
import { startSmartAlertsJob } from './smartAlertsJob';

export function initCronJobs() {
  startOverdueDetectionJob();
  startBookingJobs();
  startSmartAlertsJob();
}



