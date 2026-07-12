import { startOverdueDetectionJob } from './overdueDetectionJob';

export function initCronJobs() {
  startOverdueDetectionJob();
}

