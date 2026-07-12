import cron from 'node-cron';
import { AssetAllocation, AllocationStatus } from '../models/AssetAllocation';
import { Asset, AssetStatus } from '../models/Asset';
import { Notification, NotificationType } from '../models/Notification';
import { User, UserRole } from '../models/User';
import { socketService } from '../socket/socketService';
import { AssetHistory } from '../models/AssetHistory';

export async function detectOverdueAllocations(): Promise<void> {
  console.log('🔍 Running nightly overdue allocation detection job...');
  try {
    const today = new Date();
    
    // Find ACTIVE allocations where expectedReturn is in the past
    const overdueAllocations = await AssetAllocation.find({
      status: AllocationStatus.ACTIVE,
      expectedReturn: { $lt: today }
    }).populate('asset employee');

    if (overdueAllocations.length === 0) {
      console.log('✅ No new overdue allocations detected.');
      return;
    }

    console.log(`⚠️ Found ${overdueAllocations.length} overdue allocations. Processing...`);

    // Fetch all Asset Managers and Admins to notify them
    const managers = await User.find({
      role: { $in: [UserRole.ASSET_MANAGER, UserRole.ADMIN] }
    });

    for (const allocation of overdueAllocations) {
      // Update status to OVERDUE
      allocation.status = AllocationStatus.OVERDUE;
      await allocation.save();

      const asset = allocation.asset;
      const employee = allocation.employee;

      if (!asset || !employee) continue;

      // 1. Create history record
      await AssetHistory.create({
        asset: asset._id,
        action: 'OVERDUE',
        performedBy: employee._id,
        details: `Allocation became overdue. Expected return date was ${allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'N/A'}`,
        allocation: allocation._id
      });

      // 2. Notify Employee
      const employeeNotification = await Notification.create({
        receiver: employee._id,
        title: 'Return Overdue Notice',
        message: `Your allocation for asset "${asset.name}" (${asset.assetTag}) was due on ${allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'N/A'}. Please return it immediately or request an extension.`,
        type: NotificationType.WARNING,
        read: false
      });

      socketService.emitToUser(employee._id.toString(), 'notification', employeeNotification);

      // 3. Notify Asset Managers & Admins
      for (const manager of managers) {
        const managerNotification = await Notification.create({
          receiver: manager._id,
          title: 'Asset Allocation Overdue',
          message: `Asset "${asset.name}" (${asset.assetTag}) assigned to ${employee.firstName} ${employee.lastName} is overdue since ${allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'N/A'}.`,
          type: NotificationType.ERROR,
          read: false
        });

        socketService.emitToUser(manager._id.toString(), 'notification', managerNotification);
      }
    }

    // Emit global dashboard update since KPIs changed
    socketService.emitToAll('dashboard_update', { message: 'Overdue assets detected' });
    console.log('✅ Overdue allocations processing completed.');
  } catch (error) {
    console.error('❌ Error in overdue allocation detection job:', error);
  }
}

export function startOverdueDetectionJob(): void {
  // Run every night at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    await detectOverdueAllocations();
  });
  console.log('⏰ Overdue allocation check scheduled for every night at midnight.');
}
