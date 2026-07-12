import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Asset, AssetStatus, AssetCondition } from '../models/Asset';
import { User, UserRole } from '../models/User';
import { AssetAllocation, AllocationStatus } from '../models/AssetAllocation';
import { ReturnRequest, ReturnRequestStatus, ReturnCondition } from '../models/ReturnRequest';
import { AssetHistory } from '../models/AssetHistory';
import { Notification, NotificationType } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { socketService } from '../socket/socketService';

/**
 * POST /api/returns
 * Create a new return request (Employee or Manager)
 */
export async function createReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { asset: assetId, returnNotes, condition, photos } = req.body;
    const employeeId = req.user?.userId;

    // 1. Fetch Asset
    const asset = await Asset.findById(assetId);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found.' });
      return;
    }

    // 2. Fetch Active Allocation
    const activeAllocation = await AssetAllocation.findOne({
      asset: assetId,
      status: { $in: [AllocationStatus.ACTIVE, AllocationStatus.OVERDUE] }
    }).populate('employee');

    if (!activeAllocation) {
      res.status(400).json({ message: 'Asset has no active allocation and cannot be returned.' });
      return;
    }

    // Enforce authorization
    const isHolder = activeAllocation.employee._id.toString() === employeeId;
    const isManager = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.ASSET_MANAGER;
    if (!isHolder && !isManager) {
      res.status(403).json({ message: 'Only the current holder or an asset manager can submit a return request.' });
      return;
    }

    // 3. Create Return Request
    const returnRequest = new ReturnRequest({
      asset: assetId,
      employee: activeAllocation.employee._id,
      allocation: activeAllocation._id,
      returnNotes,
      condition,
      photos: photos || [],
      status: ReturnRequestStatus.PENDING
    });
    await returnRequest.save();

    // 4. Log timeline history
    await AssetHistory.create({
      asset: assetId,
      action: 'RETURN_REQUESTED',
      performedBy: employeeId,
      details: `Return requested by employee. Reported condition: ${condition}`,
      returnRequest: returnRequest._id
    });

    // 5. Log Activity
    await ActivityLog.create({
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
    const managers = await User.find({ role: { $in: [UserRole.ASSET_MANAGER, UserRole.ADMIN] } });
    for (const manager of managers) {
      const managerNotification = await Notification.create({
        receiver: manager._id,
        title: 'New Return Review Pending',
        message: `Asset "${asset.name}" return request by ${activeAllocation.employee.firstName} ${activeAllocation.employee.lastName} requires inspection.`,
        type: NotificationType.WARNING,
        read: false
      });
      socketService.emitToUser(manager._id.toString(), 'notification', managerNotification);
    }

    socketService.emitToAll('dashboard_update', { message: 'Return requested' });

    res.status(201).json({
      message: 'Return request submitted successfully.',
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/returns
 * List return requests
 */
export async function getReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const filter: any = {};

    if (userRole === UserRole.EMPLOYEE) {
      filter.employee = userId;
    }

    const returns = await ReturnRequest.find(filter)
      .populate('asset', 'name assetTag status')
      .populate('employee', 'firstName lastName email employeeId')
      .populate('allocation', 'allocatedDate expectedReturn')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json(returns);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/returns/:id/approve
 * Approve asset return request (Asset Manager / Admin)
 */
export async function approveReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user?.userId;

    const returnRequest = await ReturnRequest.findById(id)
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

    if (returnRequest.status !== ReturnRequestStatus.PENDING) {
      res.status(400).json({ message: `Cannot approve a return request that is already ${returnRequest.status.toLowerCase()}.` });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const asset = returnRequest.asset;
    const allocation = returnRequest.allocation;

    // 1. Close active allocation
    const assetAllocation = await AssetAllocation.findById(allocation._id).session(session);
    if (assetAllocation) {
      assetAllocation.status = AllocationStatus.RETURNED;
      assetAllocation.returnedDate = new Date();
      // Map return request condition to asset condition
      assetAllocation.returnCondition = returnRequest.condition as unknown as AssetCondition;
      await assetAllocation.save({ session });
    }

    // 2. Update Asset status, holder, and condition
    asset.currentHolder = null;
    asset.condition = returnRequest.condition as unknown as AssetCondition;

    // Business Rules for asset status updates based on return condition
    if (returnRequest.condition === ReturnCondition.LOST) {
      asset.status = AssetStatus.LOST;
    } else if (returnRequest.condition === ReturnCondition.MAJOR_DAMAGE) {
      asset.status = AssetStatus.UNDER_MAINTENANCE;
    } else {
      asset.status = AssetStatus.AVAILABLE;
    }
    await asset.save({ session });

    // 3. Approve return request
    returnRequest.status = ReturnRequestStatus.APPROVED;
    returnRequest.reviewedBy = userId;
    returnRequest.reviewedAt = new Date();
    returnRequest.remarks = remarks || 'Return inspected and approved.';
    await returnRequest.save({ session });

    // 4. Create History
    let historyAction = 'RETURNED';
    let historyDetails = `Asset return approved. Physical condition reported: ${returnRequest.condition}.`;
    
    if (returnRequest.condition === ReturnCondition.LOST) {
      historyAction = 'LOST';
      historyDetails = `Asset reported LOST by employee and approved. Status marked as LOST.`;
    } else if (returnRequest.condition === ReturnCondition.MAJOR_DAMAGE) {
      historyAction = 'DAMAGED';
      historyDetails = `Asset reported DAMAGED (Major Damage) and approved. Sent to maintenance.`;
    }

    await AssetHistory.create([{
      asset: asset._id,
      action: historyAction,
      performedBy: userId,
      details: historyDetails,
      returnRequest: returnRequest._id,
      allocation: allocation._id
    }], { session });

    // 5. Log Activity
    await ActivityLog.create([{
      user: userId,
      action: 'APPROVE_RETURN',
      module: 'RETURN',
      entityId: returnRequest._id.toString(),
      newData: {
        status: ReturnRequestStatus.APPROVED,
        condition: returnRequest.condition,
        remarks
      }
    }], { session });

    // 6. Notify Employee
    const notification = new Notification({
      receiver: returnRequest.employee._id,
      title: 'Return Request Approved',
      message: `Your return request for asset "${asset.name}" has been approved. The asset status is now ${asset.status.replace('_', ' ')}.`,
      type: NotificationType.SUCCESS,
      read: false
    });
    await notification.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Emits
    socketService.emitToUser(returnRequest.employee._id.toString(), 'notification', notification);
    socketService.emitToAll('dashboard_update', { message: 'Return approved' });

    res.status(200).json({
      message: 'Return request approved successfully.',
      data: returnRequest
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

/**
 * PATCH /api/returns/:id/reject
 * Reject asset return request (Asset Manager / Admin)
 */
export async function rejectReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user?.userId;

    if (!remarks) {
      res.status(400).json({ message: 'Remarks are required to reject a return request.' });
      return;
    }

    const returnRequest = await ReturnRequest.findById(id).populate('asset').populate('employee');
    if (!returnRequest) {
      res.status(404).json({ message: 'Return request not found.' });
      return;
    }

    if (returnRequest.status !== ReturnRequestStatus.PENDING) {
      res.status(400).json({ message: `Cannot reject a return request that is already ${returnRequest.status.toLowerCase()}.` });
      return;
    }

    const oldStatus = returnRequest.status;
    returnRequest.status = ReturnRequestStatus.REJECTED;
    returnRequest.reviewedBy = userId;
    returnRequest.reviewedAt = new Date();
    returnRequest.remarks = remarks;
    await returnRequest.save();

    // Timeline Log
    await AssetHistory.create({
      asset: returnRequest.asset._id,
      action: 'RETURN_REJECTED',
      performedBy: userId,
      details: `Return request rejected by Asset Manager. Remarks: ${remarks}`,
      returnRequest: returnRequest._id
    });

    // Log Activity
    await ActivityLog.create({
      user: userId,
      action: 'REJECT_RETURN',
      module: 'RETURN',
      entityId: returnRequest._id.toString(),
      oldData: { status: oldStatus },
      newData: { status: ReturnRequestStatus.REJECTED, remarks }
    });

    // Notify Employee
    const notification = await Notification.create({
      receiver: returnRequest.employee._id,
      title: 'Return Request Rejected',
      message: `Your return request for asset "${returnRequest.asset.name}" has been rejected. Reason: ${remarks}`,
      type: NotificationType.ERROR,
      read: false
    });
    socketService.emitToUser(returnRequest.employee._id.toString(), 'notification', notification);

    socketService.emitToAll('dashboard_update', { message: 'Return rejected' });

    res.status(200).json({
      message: 'Return request rejected successfully.',
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
}
