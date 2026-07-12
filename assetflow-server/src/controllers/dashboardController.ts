import { Request, Response } from 'express';
import { Asset, AssetStatus } from '../models/Asset';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { MaintenanceRequest, MaintenanceStatus } from '../models/MaintenanceRequest';
import { AuditCycle, AuditCycleStatus } from '../models/AuditCycle';
import { AssetAllocation } from '../models/AssetAllocation';
import { asyncHandler } from '../utils';

/**
 * Retrieves aggregate statistics and historical trends for the executive dashboard.
 * Compiles real-time metrics, growth rates, and booking density heatmaps.
 */
export const getExecutiveStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Compile overall system counts
  const totalAssets = await Asset.countDocuments({ deletedAt: null });
  const departments = await Department.countDocuments({ deletedAt: null });
  const employees = await User.countDocuments({});
  
  const available = await Asset.countDocuments({ status: AssetStatus.AVAILABLE, deletedAt: null });
  const allocated = await Asset.countDocuments({ status: AssetStatus.ALLOCATED, deletedAt: null });
  const reserved = await Asset.countDocuments({ status: AssetStatus.RESERVED, deletedAt: null });
  const maintenance = await Asset.countDocuments({ status: AssetStatus.UNDER_MAINTENANCE, deletedAt: null });
  const lost = await Asset.countDocuments({ status: AssetStatus.LOST, deletedAt: null });
  const retired = await Asset.countDocuments({ status: AssetStatus.RETIRED, deletedAt: null });
  const disposed = await Asset.countDocuments({ status: AssetStatus.DISPOSED, deletedAt: null });

  // Compile active operational status
  const bookingsToday = await Booking.countDocuments({
    status: 'APPROVED',
    startDate: { $lte: endOfToday },
    endDate: { $gte: startOfToday }
  } as any);

  const openMaintenance = await MaintenanceRequest.countDocuments({
    approvalStatus: { $in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS] }
  } as any);

  const runningAudits = await AuditCycle.countDocuments({
    status: AuditCycleStatus.IN_PROGRESS
  });

  const overdueAssets = await AssetAllocation.countDocuments({
    status: 'ACTIVE',
    expectedReturn: { $lt: now }
  } as any);

  const sevenDaysFromNow = new Date(Date.now() + 86400000 * 7);
  const upcomingReturns = await AssetAllocation.countDocuments({
    status: 'ACTIVE',
    expectedReturn: { $gte: now, $lte: sevenDaysFromNow }
  } as any);

  const pendingTransfers = 0;

  // Compute category distribution percentages using MongoDB aggregate framework
  const categoryStats = await Asset.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  const populatedCategories = await Department.populate(categoryStats, { path: '_id', model: 'AssetCategory' });
  const categoryDistribution = populatedCategories.map((c: any) => ({
    name: c._id?.name || 'Unassigned',
    value: c.count
  }));

  // Compute department allocation ratios
  const deptStats = await Asset.aggregate([
    { $match: { deletedAt: null, department: { $ne: null } } },
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);
  const populatedDepts = await Department.populate(deptStats, { path: '_id', model: 'Department' });
  const departmentAllocation = populatedDepts.map((d: any) => ({
    name: d._id?.code || 'Unassigned',
    value: d.count
  }));

  // Compile a sliding 6-month window of asset registrations
  const monthlyGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const count = await Asset.countDocuments({
      createdAt: { $gte: monthStart, $lte: monthEnd },
      deletedAt: null
    });

    monthlyGrowth.push({
      month: monthStart.toLocaleString('default', { month: 'short' }),
      Assets: count
    });
  }

  // Compile a sliding 6-month window of completed maintenance costs
  const maintenanceTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const costSum = await MaintenanceRequest.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd }, approvalStatus: MaintenanceStatus.RESOLVED } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    maintenanceTrend.push({
      month: monthStart.toLocaleString('default', { month: 'short' }),
      Cost: costSum[0]?.total || 0
    });
  }

  // Group booking density by day of week and 4-hour slot intervals to construct the usage heatmap
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapData = days.map((dayName) => ({
    day: dayName,
    'Morning (8am-12pm)': 0,
    'Afternoon (12pm-4pm)': 0,
    'Evening (4pm-8pm)': 0
  }));

  const allBookings = await Booking.find({ status: 'APPROVED' } as any);
  allBookings.forEach((bookingItem: any) => {
    const startDateVal = new Date(bookingItem.startDate);
    const dayOfWeekIdx = startDateVal.getDay();
    const startHour = startDateVal.getHours();

    if (startHour >= 8 && startHour < 12) {
      heatmapData[dayOfWeekIdx]['Morning (8am-12pm)']++;
    } else if (startHour >= 12 && startHour < 16) {
      heatmapData[dayOfWeekIdx]['Afternoon (12pm-4pm)']++;
    } else if (startHour >= 16 && startHour < 20) {
      heatmapData[dayOfWeekIdx]['Evening (4pm-8pm)']++;
    }
  });

  res.status(200).json({
    counts: {
      totalAssets,
      departments,
      employees,
      available,
      allocated,
      reserved,
      maintenance,
      lost,
      retired,
      disposed,
      bookingsToday,
      openMaintenance,
      runningAudits,
      overdueAssets,
      upcomingReturns,
      pendingTransfers
    },
    categoryDistribution,
    departmentAllocation,
    monthlyGrowth,
    maintenanceTrend,
    heatmapData
  });
});
