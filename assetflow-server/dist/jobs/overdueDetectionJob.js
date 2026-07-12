"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectOverdueAllocations = detectOverdueAllocations;
exports.startOverdueDetectionJob = startOverdueDetectionJob;
const node_cron_1 = __importDefault(require("node-cron"));
const AssetAllocation_1 = require("../models/AssetAllocation");
const Notification_1 = require("../models/Notification");
const User_1 = require("../models/User");
const socketService_1 = require("../socket/socketService");
const AssetHistory_1 = require("../models/AssetHistory");
async function detectOverdueAllocations() {
    console.log('🔍 Running nightly overdue allocation detection job...');
    try {
        const today = new Date();
        // Find ACTIVE allocations where expectedReturn is in the past
        const overdueAllocations = await AssetAllocation_1.AssetAllocation.find({
            status: AssetAllocation_1.AllocationStatus.ACTIVE,
            expectedReturn: { $lt: today }
        }).populate('asset employee');
        if (overdueAllocations.length === 0) {
            console.log('✅ No new overdue allocations detected.');
            return;
        }
        console.log(`⚠️ Found ${overdueAllocations.length} overdue allocations. Processing...`);
        // Fetch all Asset Managers and Admins to notify them
        const managers = await User_1.User.find({
            role: { $in: [User_1.UserRole.ASSET_MANAGER, User_1.UserRole.ADMIN] }
        });
        for (const allocation of overdueAllocations) {
            // Update status to OVERDUE
            allocation.status = AssetAllocation_1.AllocationStatus.OVERDUE;
            await allocation.save();
            const asset = allocation.asset;
            const employee = allocation.employee;
            if (!asset || !employee)
                continue;
            // 1. Create history record
            await AssetHistory_1.AssetHistory.create({
                asset: asset._id,
                action: 'OVERDUE',
                performedBy: employee._id,
                details: `Allocation became overdue. Expected return date was ${allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'N/A'}`,
                allocation: allocation._id
            });
            // 2. Notify Employee
            const employeeNotification = await Notification_1.Notification.create({
                receiver: employee._id,
                title: 'Return Overdue Notice',
                message: `Your allocation for asset "${asset.name}" (${asset.assetTag}) was due on ${allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'N/A'}. Please return it immediately or request an extension.`,
                type: Notification_1.NotificationType.WARNING,
                read: false
            });
            socketService_1.socketService.emitToUser(employee._id.toString(), 'notification', employeeNotification);
            // 3. Notify Asset Managers & Admins
            for (const manager of managers) {
                const managerNotification = await Notification_1.Notification.create({
                    receiver: manager._id,
                    title: 'Asset Allocation Overdue',
                    message: `Asset "${asset.name}" (${asset.assetTag}) assigned to ${employee.firstName} ${employee.lastName} is overdue since ${allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'N/A'}.`,
                    type: Notification_1.NotificationType.ERROR,
                    read: false
                });
                socketService_1.socketService.emitToUser(manager._id.toString(), 'notification', managerNotification);
            }
        }
        // Emit global dashboard update since KPIs changed
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Overdue assets detected' });
        console.log('✅ Overdue allocations processing completed.');
    }
    catch (error) {
        console.error('❌ Error in overdue allocation detection job:', error);
    }
}
function startOverdueDetectionJob() {
    // Run every night at midnight (0 0 * * *)
    node_cron_1.default.schedule('0 0 * * *', async () => {
        await detectOverdueAllocations();
    });
    console.log('⏰ Overdue allocation check scheduled for every night at midnight.');
}
