"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransfer = createTransfer;
exports.getTransfers = getTransfers;
exports.approveTransfer = approveTransfer;
exports.rejectTransfer = rejectTransfer;
exports.completeTransfer = completeTransfer;
const mongoose_1 = __importDefault(require("mongoose"));
const Asset_1 = require("../models/Asset");
const User_1 = require("../models/User");
const Department_1 = require("../models/Department");
const AssetAllocation_1 = require("../models/AssetAllocation");
const TransferRequest_1 = require("../models/TransferRequest");
const AssetHistory_1 = require("../models/AssetHistory");
const Notification_1 = require("../models/Notification");
const ActivityLog_1 = require("../models/ActivityLog");
const socketService_1 = require("../socket/socketService");
/**
 * POST /api/transfers
 * Create a new transfer request
 */
async function createTransfer(req, res, next) {
    try {
        const { asset: assetId, toEmployee: toEmployeeId, reason } = req.body;
        const requestedBy = req.user?.userId;
        // 1. Fetch Asset
        const asset = await Asset_1.Asset.findById(assetId);
        if (!asset) {
            res.status(404).json({ message: 'Asset not found.' });
            return;
        }
        // 2. Find active allocation of this asset
        const activeAllocation = await AssetAllocation_1.AssetAllocation.findOne({
            asset: assetId,
            status: { $in: [AssetAllocation_1.AllocationStatus.ACTIVE, AssetAllocation_1.AllocationStatus.OVERDUE] }
        }).populate('employee');
        if (!activeAllocation) {
            res.status(400).json({ message: 'Asset has no active allocation and cannot be transferred.' });
            return;
        }
        const fromEmployeeId = activeAllocation.employee._id;
        // Verify if requester is the current holder or an Admin/Manager
        const isHolder = fromEmployeeId.toString() === requestedBy;
        const isManager = req.user?.role === User_1.UserRole.ADMIN || req.user?.role === User_1.UserRole.ASSET_MANAGER;
        if (!isHolder && !isManager) {
            res.status(403).json({ message: 'Only the current asset holder or an asset manager can request a transfer.' });
            return;
        }
        // 3. Fetch destination employee
        const toEmployee = await User_1.User.findById(toEmployeeId).populate('department');
        if (!toEmployee) {
            res.status(404).json({ message: 'Destination employee not found.' });
            return;
        }
        // Prevent transferring to oneself
        if (fromEmployeeId.toString() === toEmployeeId) {
            res.status(400).json({ message: 'Cannot transfer an asset to the current holder.' });
            return;
        }
        // 4. Create Transfer Request
        const transfer = new TransferRequest_1.TransferRequest({
            asset: assetId,
            requestedBy,
            fromEmployee: fromEmployeeId,
            toEmployee: toEmployeeId,
            toDepartment: toEmployee.department ? toEmployee.department._id : undefined,
            reason,
            approvalStatus: TransferRequest_1.TransferStatus.PENDING
        });
        await transfer.save();
        // 5. Timeline history logging
        await AssetHistory_1.AssetHistory.create({
            asset: assetId,
            action: 'TRANSFER_REQUESTED',
            performedBy: requestedBy,
            details: `Transfer requested from ${activeAllocation.employee.firstName} ${activeAllocation.employee.lastName} to ${toEmployee.firstName} ${toEmployee.lastName}. Reason: ${reason}`,
            transfer: transfer._id
        });
        // 6. Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: requestedBy,
            action: 'REQUEST_TRANSFER',
            module: 'TRANSFER',
            entityId: transfer._id.toString(),
            newData: {
                assetId,
                fromEmployeeId,
                toEmployeeId,
                reason
            }
        });
        // 7. Notify Department Head of the source department
        const sourceUser = await User_1.User.findById(fromEmployeeId).populate('department');
        if (sourceUser && sourceUser.department) {
            const dept = await Department_1.Department.findById(sourceUser.department).populate('departmentHead');
            if (dept && dept.departmentHead) {
                const deptHeadNotification = await Notification_1.Notification.create({
                    receiver: dept.departmentHead._id,
                    title: 'Transfer Approval Pending',
                    message: `Asset "${asset.name}" transfer request from ${sourceUser.firstName} ${sourceUser.lastName} is waiting for your department approval.`,
                    type: Notification_1.NotificationType.WARNING,
                    read: false
                });
                socketService_1.socketService.emitToUser(dept.departmentHead._id.toString(), 'notification', deptHeadNotification);
            }
        }
        // Also notify Asset Managers
        const managers = await User_1.User.find({ role: { $in: [User_1.UserRole.ASSET_MANAGER, User_1.UserRole.ADMIN] } });
        for (const manager of managers) {
            const managerNotification = await Notification_1.Notification.create({
                receiver: manager._id,
                title: 'New Transfer Request Submitted',
                message: `Asset "${asset.name}" (${asset.assetTag}) transfer requested by ${sourceUser?.firstName} ${sourceUser?.lastName}.`,
                type: Notification_1.NotificationType.INFO,
                read: false
            });
            socketService_1.socketService.emitToUser(manager._id.toString(), 'notification', managerNotification);
        }
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Transfer requested' });
        res.status(201).json({
            message: 'Transfer request submitted successfully.',
            data: transfer
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/transfers
 * List transfer requests
 */
async function getTransfers(req, res, next) {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const filter = {};
        // Enforce RBAC filtering
        if (userRole === User_1.UserRole.EMPLOYEE) {
            filter.$or = [{ fromEmployee: userId }, { toEmployee: userId }, { requestedBy: userId }];
        }
        else if (userRole === User_1.UserRole.DEPARTMENT_HEAD) {
            const user = await User_1.User.findById(userId);
            if (user && user.department) {
                // Department Heads approve transfers involving employees from their department
                const departmentEmployees = await User_1.User.find({ department: user.department }, { _id: 1 });
                const empIds = departmentEmployees.map(e => e._id);
                filter.$or = [
                    { fromEmployee: { $in: empIds } },
                    { toEmployee: { $in: empIds } }
                ];
            }
            else {
                res.status(200).json([]);
                return;
            }
        }
        const transfers = await TransferRequest_1.TransferRequest.find(filter)
            .populate('asset', 'name assetTag status')
            .populate('requestedBy', 'firstName lastName email employeeId')
            .populate('fromEmployee', 'firstName lastName email employeeId')
            .populate('toEmployee', 'firstName lastName email employeeId')
            .populate('toDepartment', 'name code')
            .populate('approvedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.status(200).json(transfers);
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/transfers/:id/approve
 * Approve a transfer request (Department Head or Asset Manager)
 */
async function approveTransfer(req, res, next) {
    try {
        const { id } = req.params;
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const transfer = await TransferRequest_1.TransferRequest.findById(id)
            .populate('asset')
            .populate('fromEmployee')
            .populate('toEmployee');
        if (!transfer) {
            res.status(404).json({ message: 'Transfer request not found.' });
            return;
        }
        if (transfer.approvalStatus === TransferRequest_1.TransferStatus.COMPLETED || transfer.approvalStatus === TransferRequest_1.TransferStatus.REJECTED || transfer.approvalStatus === TransferRequest_1.TransferStatus.CANCELLED) {
            res.status(400).json({ message: `Cannot approve a transfer request that is already ${transfer.approvalStatus.toLowerCase()}.` });
            return;
        }
        const oldStatus = transfer.approvalStatus;
        // 1. Department Head approval check
        if (userRole === User_1.UserRole.DEPARTMENT_HEAD) {
            const deptHeadUser = await User_1.User.findById(userId);
            const fromUser = await User_1.User.findById(transfer.fromEmployee._id);
            if (!deptHeadUser || !fromUser || fromUser.department?.toString() !== deptHeadUser.department?.toString()) {
                res.status(403).json({ message: 'Forbidden. You can only approve transfers for employees in your department.' });
                return;
            }
            if (transfer.approvalStatus !== TransferRequest_1.TransferStatus.PENDING) {
                res.status(400).json({ message: `Transfer request is already department approved. Status: ${transfer.approvalStatus}` });
                return;
            }
            transfer.approvalStatus = TransferRequest_1.TransferStatus.DEPARTMENT_APPROVED;
            transfer.remarks = req.body.remarks || 'Department approved';
            await transfer.save();
            // Timeline Log
            await AssetHistory_1.AssetHistory.create({
                asset: transfer.asset._id,
                action: 'TRANSFER_DEPT_APPROVED',
                performedBy: userId,
                details: `Transfer approved by Department Head ${deptHeadUser.firstName} ${deptHeadUser.lastName}`,
                transfer: transfer._id
            });
            // Notify Asset Managers
            const managers = await User_1.User.find({ role: { $in: [User_1.UserRole.ASSET_MANAGER, User_1.UserRole.ADMIN] } });
            for (const manager of managers) {
                const managerNotification = await Notification_1.Notification.create({
                    receiver: manager._id,
                    title: 'Transfer Needs Manager Review',
                    message: `Asset "${transfer.asset.name}" transfer from ${transfer.fromEmployee.firstName} ${transfer.fromEmployee.lastName} has department approval. Please review.`,
                    type: Notification_1.NotificationType.WARNING,
                    read: false
                });
                socketService_1.socketService.emitToUser(manager._id.toString(), 'notification', managerNotification);
            }
        }
        // 2. Asset Manager / Admin approval check
        else if (userRole === User_1.UserRole.ASSET_MANAGER || userRole === User_1.UserRole.ADMIN) {
            // Direct transition to manager approved
            transfer.approvalStatus = TransferRequest_1.TransferStatus.ASSET_MANAGER_APPROVED;
            transfer.approvedBy = userId;
            transfer.remarks = req.body.remarks || 'Asset manager approved';
            await transfer.save();
            // Timeline Log
            await AssetHistory_1.AssetHistory.create({
                asset: transfer.asset._id,
                action: 'TRANSFER_MANAGER_APPROVED',
                performedBy: userId,
                details: `Transfer approved by Asset Manager. Waiting for final reallocation.`,
                transfer: transfer._id
            });
            // Notify Requester and destination employee
            const requesterNotification = await Notification_1.Notification.create({
                receiver: transfer.requestedBy,
                title: 'Transfer Approved',
                message: `Your transfer request for "${transfer.asset.name}" has been approved by the Asset Manager.`,
                type: Notification_1.NotificationType.SUCCESS,
                read: false
            });
            socketService_1.socketService.emitToUser(transfer.requestedBy.toString(), 'notification', requesterNotification);
        }
        else {
            res.status(403).json({ message: 'Insufficient permission to approve transfers.' });
            return;
        }
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: userId,
            action: 'APPROVE_TRANSFER',
            module: 'TRANSFER',
            entityId: transfer._id.toString(),
            oldData: { approvalStatus: oldStatus },
            newData: { approvalStatus: transfer.approvalStatus, remarks: transfer.remarks }
        });
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Transfer approved' });
        res.status(200).json({
            message: `Transfer request status updated to ${transfer.approvalStatus}.`,
            data: transfer
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/transfers/:id/reject
 * Reject a transfer request
 */
async function rejectTransfer(req, res, next) {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!remarks) {
            res.status(400).json({ message: 'Rejection remarks are required.' });
            return;
        }
        const transfer = await TransferRequest_1.TransferRequest.findById(id)
            .populate('asset')
            .populate('fromEmployee')
            .populate('toEmployee');
        if (!transfer) {
            res.status(404).json({ message: 'Transfer request not found.' });
            return;
        }
        if (transfer.approvalStatus === TransferRequest_1.TransferStatus.COMPLETED || transfer.approvalStatus === TransferRequest_1.TransferStatus.REJECTED || transfer.approvalStatus === TransferRequest_1.TransferStatus.CANCELLED) {
            res.status(400).json({ message: 'Cannot reject an already processed transfer.' });
            return;
        }
        // Department Head check
        if (userRole === User_1.UserRole.DEPARTMENT_HEAD) {
            const deptHeadUser = await User_1.User.findById(userId);
            const fromUser = await User_1.User.findById(transfer.fromEmployee._id);
            if (!deptHeadUser || !fromUser || fromUser.department?.toString() !== deptHeadUser.department?.toString()) {
                res.status(403).json({ message: 'Forbidden. You can only reject transfers for your department employees.' });
                return;
            }
        }
        else if (userRole !== User_1.UserRole.ASSET_MANAGER && userRole !== User_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Insufficient permission to reject transfers.' });
            return;
        }
        const oldStatus = transfer.approvalStatus;
        transfer.approvalStatus = TransferRequest_1.TransferStatus.REJECTED;
        transfer.remarks = remarks;
        await transfer.save();
        // Timeline Log
        await AssetHistory_1.AssetHistory.create({
            asset: transfer.asset._id,
            action: 'TRANSFER_REJECTED',
            performedBy: userId,
            details: `Transfer request rejected. Remarks: ${remarks}`,
            transfer: transfer._id
        });
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: userId,
            action: 'REJECT_TRANSFER',
            module: 'TRANSFER',
            entityId: transfer._id.toString(),
            oldData: { approvalStatus: oldStatus },
            newData: { approvalStatus: TransferRequest_1.TransferStatus.REJECTED, remarks }
        });
        // Notify requester
        const notification = await Notification_1.Notification.create({
            receiver: transfer.requestedBy,
            title: 'Transfer Request Rejected',
            message: `Your transfer request for asset "${transfer.asset.name}" was rejected. Reason: ${remarks}`,
            type: Notification_1.NotificationType.ERROR,
            read: false
        });
        socketService_1.socketService.emitToUser(transfer.requestedBy.toString(), 'notification', notification);
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Transfer request rejected' });
        res.status(200).json({
            message: 'Transfer request rejected successfully.',
            data: transfer
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/transfers/:id/complete
 * Complete transfer reallocation (Asset Manager / Admin only)
 */
async function completeTransfer(req, res, next) {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { id } = req.params;
        const userId = req.user?.userId;
        const transfer = await TransferRequest_1.TransferRequest.findById(id)
            .populate('asset')
            .populate('fromEmployee')
            .populate('toEmployee')
            .session(session);
        if (!transfer) {
            res.status(404).json({ message: 'Transfer request not found.' });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        // Check if approved by Asset Manager first (unless Admin executes it directly)
        const isAdmin = req.user?.role === User_1.UserRole.ADMIN;
        const isApproved = transfer.approvalStatus === TransferRequest_1.TransferStatus.ASSET_MANAGER_APPROVED;
        if (!isAdmin && !isApproved) {
            res.status(400).json({ message: 'Transfer request must be approved by the Asset Manager before completion.' });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        if (transfer.approvalStatus === TransferRequest_1.TransferStatus.COMPLETED) {
            res.status(400).json({ message: 'Transfer request is already completed.' });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        const asset = transfer.asset;
        const toEmployee = transfer.toEmployee;
        const fromEmployee = transfer.fromEmployee;
        // 1. Close current active allocation
        const activeAllocation = await AssetAllocation_1.AssetAllocation.findOne({
            asset: asset._id,
            status: { $in: [AssetAllocation_1.AllocationStatus.ACTIVE, AssetAllocation_1.AllocationStatus.OVERDUE] }
        }).session(session);
        if (activeAllocation) {
            activeAllocation.status = AssetAllocation_1.AllocationStatus.RETURNED;
            activeAllocation.returnedDate = new Date();
            activeAllocation.notes = `Transferred to ${toEmployee.firstName} ${toEmployee.lastName} via Transfer ID ${transfer._id}`;
            await activeAllocation.save({ session });
        }
        // 2. Create new Allocation for destination employee
        const newAllocation = new AssetAllocation_1.AssetAllocation({
            asset: asset._id,
            employee: toEmployee._id,
            department: transfer.toDepartment || toEmployee.department,
            allocatedBy: userId,
            allocatedDate: new Date(),
            expectedReturn: activeAllocation ? activeAllocation.expectedReturn : undefined, // Inherit expected return
            purpose: transfer.reason,
            notes: `Allocated via Transfer Request. Old holder: ${fromEmployee.firstName} ${fromEmployee.lastName}.`,
            status: AssetAllocation_1.AllocationStatus.ACTIVE
        });
        await newAllocation.save({ session });
        // 3. Update Asset
        asset.currentHolder = toEmployee._id;
        asset.department = transfer.toDepartment || toEmployee.department;
        asset.status = Asset_1.AssetStatus.ALLOCATED; // Re-ensure it remains allocated
        await asset.save({ session });
        // 4. Update Transfer request status
        transfer.approvalStatus = TransferRequest_1.TransferStatus.COMPLETED;
        transfer.transferDate = new Date();
        await transfer.save({ session });
        // 5. Timeline history logs
        await AssetHistory_1.AssetHistory.create([{
                asset: asset._id,
                action: 'TRANSFERRED',
                performedBy: userId,
                details: `Asset transfer completed. Reallocated from ${fromEmployee.firstName} ${fromEmployee.lastName} to ${toEmployee.firstName} ${toEmployee.lastName}`,
                transfer: transfer._id,
                allocation: newAllocation._id
            }], { session });
        // 6. Log Activity
        await ActivityLog_1.ActivityLog.create([{
                user: userId,
                action: 'COMPLETE_TRANSFER',
                module: 'TRANSFER',
                entityId: transfer._id.toString(),
                newData: {
                    newAllocationId: newAllocation._id,
                    transferId: transfer._id
                }
            }], { session });
        // 7. Notify destination employee
        const toNotification = new Notification_1.Notification({
            receiver: toEmployee._id,
            title: 'Transferred Asset Assigned',
            message: `The asset "${asset.name}" (${asset.assetTag}) was successfully transferred to you.`,
            type: Notification_1.NotificationType.SUCCESS,
            read: false
        });
        await toNotification.save({ session });
        // 8. Notify old employee
        const fromNotification = new Notification_1.Notification({
            receiver: fromEmployee._id,
            title: 'Asset Transferred Out',
            message: `The asset "${asset.name}" (${asset.assetTag}) has been successfully transferred to ${toEmployee.firstName} ${toEmployee.lastName}.`,
            type: Notification_1.NotificationType.INFO,
            read: false
        });
        await fromNotification.save({ session });
        await session.commitTransaction();
        session.endSession();
        // Emits
        socketService_1.socketService.emitToUser(toEmployee._id.toString(), 'notification', toNotification);
        socketService_1.socketService.emitToUser(fromEmployee._id.toString(), 'notification', fromNotification);
        socketService_1.socketService.emitToAll('dashboard_update', { message: 'Transfer completed' });
        res.status(200).json({
            message: 'Asset transfer completed and reallocated successfully.',
            data: transfer
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}
