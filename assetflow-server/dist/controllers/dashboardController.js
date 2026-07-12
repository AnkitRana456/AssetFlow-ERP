"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutiveStats = void 0;
const Asset_1 = require("../models/Asset");
const Department_1 = require("../models/Department");
const User_1 = require("../models/User");
const Booking_1 = require("../models/Booking");
const MaintenanceRequest_1 = require("../models/MaintenanceRequest");
const AuditCycle_1 = require("../models/AuditCycle");
const AssetAllocation_1 = require("../models/AssetAllocation");
const utils_1 = require("../utils");
/**
 * Retrieves aggregate statistics and historical trends for the executive dashboard.
 * Compiles real-time metrics, growth rates, and booking density heatmaps.
 */
exports.getExecutiveStats = (0, utils_1.asyncHandler)(async (req, res) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    // Compile overall system counts
    const totalAssets = await Asset_1.Asset.countDocuments({ deletedAt: null });
    const departments = await Department_1.Department.countDocuments({ deletedAt: null });
    const employees = await User_1.User.countDocuments({});
    const available = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.AVAILABLE, deletedAt: null });
    const allocated = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.ALLOCATED, deletedAt: null });
    const reserved = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.RESERVED, deletedAt: null });
    const maintenance = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.UNDER_MAINTENANCE, deletedAt: null });
    const lost = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.LOST, deletedAt: null });
    const retired = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.RETIRED, deletedAt: null });
    const disposed = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.DISPOSED, deletedAt: null });
    // Compile active operational status
    const bookingsToday = await Booking_1.Booking.countDocuments({
        status: 'APPROVED',
        startDate: { $lte: endOfToday },
        endDate: { $gte: startOfToday }
    });
    const openMaintenance = await MaintenanceRequest_1.MaintenanceRequest.countDocuments({
        approvalStatus: { $in: [MaintenanceRequest_1.MaintenanceStatus.PENDING, MaintenanceRequest_1.MaintenanceStatus.IN_PROGRESS] }
    });
    const runningAudits = await AuditCycle_1.AuditCycle.countDocuments({
        status: AuditCycle_1.AuditCycleStatus.IN_PROGRESS
    });
    const overdueAssets = await AssetAllocation_1.AssetAllocation.countDocuments({
        status: 'ACTIVE',
        expectedReturn: { $lt: now }
    });
    const sevenDaysFromNow = new Date(Date.now() + 86400000 * 7);
    const upcomingReturns = await AssetAllocation_1.AssetAllocation.countDocuments({
        status: 'ACTIVE',
        expectedReturn: { $gte: now, $lte: sevenDaysFromNow }
    });
    const pendingTransfers = 0;
    // Compute category distribution percentages using MongoDB aggregate framework
    const categoryStats = await Asset_1.Asset.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const populatedCategories = await Department_1.Department.populate(categoryStats, { path: '_id', model: 'AssetCategory' });
    const categoryDistribution = populatedCategories.map((c) => ({
        name: c._id?.name || 'Unassigned',
        value: c.count
    }));
    // Compute department allocation ratios
    const deptStats = await Asset_1.Asset.aggregate([
        { $match: { deletedAt: null, department: { $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const populatedDepts = await Department_1.Department.populate(deptStats, { path: '_id', model: 'Department' });
    const departmentAllocation = populatedDepts.map((d) => ({
        name: d._id?.code || 'Unassigned',
        value: d.count
    }));
    // Compile a sliding 6-month window of asset registrations
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const count = await Asset_1.Asset.countDocuments({
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
        const costSum = await MaintenanceRequest_1.MaintenanceRequest.aggregate([
            { $match: { createdAt: { $gte: monthStart, $lte: monthEnd }, approvalStatus: MaintenanceRequest_1.MaintenanceStatus.RESOLVED } },
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
    const allBookings = await Booking_1.Booking.find({ status: 'APPROVED' });
    allBookings.forEach((bookingItem) => {
        const startDateVal = new Date(bookingItem.startDate);
        const dayOfWeekIdx = startDateVal.getDay();
        const startHour = startDateVal.getHours();
        if (startHour >= 8 && startHour < 12) {
            heatmapData[dayOfWeekIdx]['Morning (8am-12pm)']++;
        }
        else if (startHour >= 12 && startHour < 16) {
            heatmapData[dayOfWeekIdx]['Afternoon (12pm-4pm)']++;
        }
        else if (startHour >= 16 && startHour < 20) {
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
