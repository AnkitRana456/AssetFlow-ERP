"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReturn = createReturn;
exports.getReturns = getReturns;
exports.approveReturn = approveReturn;
exports.rejectReturn = rejectReturn;
const mongoose_1 = __importDefault(require("mongoose"));
const Asset_1 = require("../models/Asset");
const User_1 = require("../models/User");
const AssetAllocation_1 = require("../models/AssetAllocation");
const ReturnRequest_1 = require("../models/ReturnRequest");
const AssetHistory_1 = require("../models/AssetHistory");
const Notification_1 = require("../models/Notification");
const ActivityLog_1 = require("../models/ActivityLog");
const socketService_1 = require("../socket/socketService");
/**
 * POST /api/returns
 * Create a new return request (Employee or Manager)
 */
async function createReturn(req, res, next) {
    try {
        const { asset: assetId, returnNotes, condition, photos } = req.body;
        const employeeId = req.user?.userId;
        // 1. Fetch Asset
        const asset = await Asset_1.Asset.findById(assetId);
        if (!asset) {
            res.status(404).json({ message: 'Asset not found.' });
            return;
        }
        // 2. Fetch Active Allocation
        const activeAllocation = await AssetAllocation_1.AssetAllocation.findOne({
            asset: assetId,
            status: { $in: [AssetAllocation_1.AllocationStatus.ACTIVE, AssetAllocation_1.AllocationStatus.OVERDUE] }
        }).populate('employee');
        if (!activeAllocation) {
            res.status(400).json({ message: 'Asset has no active allocation and cannot be returned.' });
            return;
        }
        // Enforce authorization
        const isHolder = activeAllocation.employee._id.toString() === employeeId;
        const isManager = req.user?.role === User_1.UserRole.ADMIN || req.user?.role === User_1.UserRole.ASSET_MANAGER;
        if (!isHolder && !isManager) {
            res.status(403).json({ message: 'Only the current holder or an asset manager can submit a return request.' });
            return;
        }
        // 3. Create Return Request
        const returnRequest = new ReturnRequest_1.ReturnRequest({
            asset: assetId,
            employee: activeAllocation.employee._id,
            allocation: activeAllocation._id,
            returnNotes,
            condition,
            photos: photos || [],
            status: ReturnRequest_1.ReturnRequestStatus.PENDING
        });
        await returnRequest.save();
        // 4. Log timeline history
        await AssetHistory_1.AssetHistory.create({
            asset: assetId,
            action: 'RETURN_REQUESTED',
            performedBy: employeeId,
            details: `Return requested by employee. Reported condition: ${condition}`,
            returnRequest: returnRequest._id
        });
        // 5. Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: employeeId,
            action: 'SUBMIT_RETURN',
            module: 'RETURN',
            entityId: returnRequest._id.toString(),
            newData: {
                assetId,
                condition,
                returnNotes
            }
        });
        // 6. Notify Asset Managers & Admins
        const managers = await User_1.User.find({ role: { $in: [User_1.UserRole.ASSET_MANAGER, User_1.UserRole.ADMIN] } });
        for (const manager of managers) {
            const managerNotification = await Notification_1.Notification.create({
                receiver: manager._id,
                title: 'New Return Review Pending',
                message: `Asset "${asset.name}" return request by ${activeAllocation.employee.firstName} ${activeAllocation.employee.lastName} requires inspection.`,
                type: Notification_1.NotificationType.WARNING,
                read: false
            });
            socketService_1.socketService.emitToUser(manager._id.toString(), 'notification', managerNotification);
        }
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Return requested' });
        res.status(201).json({
            message: 'Return request submitted successfully.',
            data: returnRequest
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/returns
 * List return requests
 */
async function getReturns(req, res, next) {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const filter = {};
        if (userRole === User_1.UserRole.EMPLOYEE) {
            filter.employee = userId;
        }
        const returns = await ReturnRequest_1.ReturnRequest.find(filter)
            .populate('asset', 'name assetTag status')
            .populate('employee', 'firstName lastName email employeeId')
            .populate('allocation', 'allocatedDate expectedReturn')
            .populate('reviewedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.status(200).json(returns);
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/returns/:id/approve
 * Approve asset return request (Asset Manager / Admin)
 */
async function approveReturn(req, res, next) {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { id } = req.params;
        const { remarks } = req.body;
        const userId = req.user?.userId;
        const returnRequest = await ReturnRequest_1.ReturnRequest.findById(id)
            .populate('asset')
            .populate('employee')
            .populate('allocation')
            .session(session);
        if (!returnRequest) {
            res.status(404).json({ message: 'Return request not found.' });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        if (returnRequest.status !== ReturnRequest_1.ReturnRequestStatus.PENDING) {
            res.status(400).json({ message: `Cannot approve a return request that is already ${returnRequest.status.toLowerCase()}.` });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        const asset = returnRequest.asset;
        const allocation = returnRequest.allocation;
        // 1. Close active allocation
        const assetAllocation = await AssetAllocation_1.AssetAllocation.findById(allocation._id).session(session);
        if (assetAllocation) {
            assetAllocation.status = AssetAllocation_1.AllocationStatus.RETURNED;
            assetAllocation.returnedDate = new Date();
            // Map return request condition to asset condition
            assetAllocation.returnCondition = returnRequest.condition;
            await assetAllocation.save({ session });
        }
        // 2. Update Asset status, holder, and condition
        asset.currentHolder = null;
        asset.condition = returnRequest.condition;
        // Business Rules for asset status updates based on return condition
        if (returnRequest.condition === ReturnRequest_1.ReturnCondition.LOST) {
            asset.status = Asset_1.AssetStatus.LOST;
        }
        else if (returnRequest.condition === ReturnRequest_1.ReturnCondition.MAJOR_DAMAGE) {
            asset.status = Asset_1.AssetStatus.UNDER_MAINTENANCE;
        }
        else {
            asset.status = Asset_1.AssetStatus.AVAILABLE;
        }
        await asset.save({ session });
        // 3. Approve return request
        returnRequest.status = ReturnRequest_1.ReturnRequestStatus.APPROVED;
        returnRequest.reviewedBy = userId;
        returnRequest.reviewedAt = new Date();
        returnRequest.remarks = remarks || 'Return inspected and approved.';
        await returnRequest.save({ session });
        // 4. Create History
        let historyAction = 'RETURNED';
        let historyDetails = `Asset return approved. Physical condition reported: ${returnRequest.condition}.`;
        if (returnRequest.condition === ReturnRequest_1.ReturnCondition.LOST) {
            historyAction = 'LOST';
            historyDetails = `Asset reported LOST by employee and approved. Status marked as LOST.`;
        }
        else if (returnRequest.condition === ReturnRequest_1.ReturnCondition.MAJOR_DAMAGE) {
            historyAction = 'DAMAGED';
            historyDetails = `Asset reported DAMAGED (Major Damage) and approved. Sent to maintenance.`;
        }
        await AssetHistory_1.AssetHistory.create([{
                asset: asset._id,
                action: historyAction,
                performedBy: userId,
                details: historyDetails,
                returnRequest: returnRequest._id,
                allocation: allocation._id
            }], { session });
        // 5. Log Activity
        await ActivityLog_1.ActivityLog.create([{
                user: userId,
                action: 'APPROVE_RETURN',
                module: 'RETURN',
                entityId: returnRequest._id.toString(),
                newData: {
                    status: ReturnRequest_1.ReturnRequestStatus.APPROVED,
                    condition: returnRequest.condition,
                    remarks
                }
            }], { session });
        // 6. Notify Employee
        const notification = new Notification_1.Notification({
            receiver: returnRequest.employee._id,
            title: 'Return Request Approved',
            message: `Your return request for asset "${asset.name}" has been approved. The asset status is now ${asset.status.replace('_', ' ')}.`,
            type: Notification_1.NotificationType.SUCCESS,
            read: false
        });
        await notification.save({ session });
        await session.commitTransaction();
        session.endSession();
        // Emits
        socketService_1.socketService.emitToUser(returnRequest.employee._id.toString(), 'notification', notification);
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Return approved' });
        res.status(200).json({
            message: 'Return request approved successfully.',
            data: returnRequest
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}
/**
 * PATCH /api/returns/:id/reject
 * Reject asset return request (Asset Manager / Admin)
 */
async function rejectReturn(req, res, next) {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const userId = req.user?.userId;
        if (!remarks) {
            res.status(400).json({ message: 'Remarks are required to reject a return request.' });
            return;
        }
        const returnRequest = await ReturnRequest_1.ReturnRequest.findById(id).populate('asset').populate('employee');
        if (!returnRequest) {
            res.status(404).json({ message: 'Return request not found.' });
            return;
        }
        if (returnRequest.status !== ReturnRequest_1.ReturnRequestStatus.PENDING) {
            res.status(400).json({ message: `Cannot reject a return request that is already ${returnRequest.status.toLowerCase()}.` });
            return;
        }
        const oldStatus = returnRequest.status;
        returnRequest.status = ReturnRequest_1.ReturnRequestStatus.REJECTED;
        returnRequest.reviewedBy = userId;
        returnRequest.reviewedAt = new Date();
        returnRequest.remarks = remarks;
        await returnRequest.save();
        // Timeline Log
        await AssetHistory_1.AssetHistory.create({
            asset: returnRequest.asset._id,
            action: 'RETURN_REJECTED',
            performedBy: userId,
            details: `Return request rejected by Asset Manager. Remarks: ${remarks}`,
            returnRequest: returnRequest._id
        });
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: userId,
            action: 'REJECT_RETURN',
            module: 'RETURN',
            entityId: returnRequest._id.toString(),
            oldData: { status: oldStatus },
            newData: { status: ReturnRequest_1.ReturnRequestStatus.REJECTED, remarks }
        });
        // Notify Employee
        const notification = await Notification_1.Notification.create({
            receiver: returnRequest.employee._id,
            title: 'Return Request Rejected',
            message: `Your return request for asset "${returnRequest.asset.name}" has been rejected. Reason: ${remarks}`,
            type: Notification_1.NotificationType.ERROR,
            read: false
        });
        socketService_1.socketService.emitToUser(returnRequest.employee._id.toString(), 'notification', notification);
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Return rejected' });
        res.status(200).json({
            message: 'Return request rejected successfully.',
            data: returnRequest
        });
    }
    catch (error) {
        next(error);
    }
}
