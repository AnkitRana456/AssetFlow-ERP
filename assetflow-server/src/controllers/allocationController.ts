import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Asset, AssetStatus } from '../models/Asset';
import { User, UserRole } from '../models/User';
import { AssetAllocation, AllocationStatus } from '../models/AssetAllocation';
import { AssetHistory } from '../models/AssetHistory';
import { Notification, NotificationType } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { socketService } from '../socket/socketService';

/**
 * POST /api/allocations
 * Allocate an asset to an employee
 */
export async function createAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { asset: assetId, employee: employeeId, department: departmentId, expectedReturn, purpose, notes, attachments } = req.body;
    const allocatedBy = req.user?.userId;

    // 1. Fetch Asset
    const asset = await Asset.findById(assetId).session(session);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // 2. Double Allocation Protection
    if (asset.status !== AssetStatus.AVAILABLE) {
      // Find the active allocation
      const activeAllocation = await AssetAllocation.findOne({
        asset: assetId,
        status: { $in: [AllocationStatus.ACTIVE, AllocationStatus.OVERDUE] }
      }).populate('employee department').session(session);

      if (activeAllocation) {
        const holderName = activeAllocation.employee 
          ? `${activeAllocation.employee.firstName} ${activeAllocation.employee.lastName}`
          : 'an employee';
        
        res.status(400).json({
          message: `This asset is currently assigned to ${holderName}.`,
          code: 'DOUBLE_ALLOCATION',
          details: {
            allocationId: activeAllocation._id,
            employee: activeAllocation.employee ? {
              _id: activeAllocation.employee._id,
              fullName: holderName,
              email: activeAllocation.employee.email
            } : null,
            expectedReturn: activeAllocation.expectedReturn,
            department: activeAllocation.department ? {
              _id: activeAllocation.department._id,
              name: activeAllocation.department.name
            } : null,
            purpose: activeAllocation.purpose
          }
        });
      } else {
        res.status(400).json({
          message: `Asset is not available for allocation. Current status: ${asset.status}`,
          code: 'ASSET_UNAVAILABLE'
        });
      }
      
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // 3. Fetch employee to ensure they exist
    const employee = await User.findById(employeeId).session(session);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // 4. Create Asset Allocation
    const allocation = new AssetAllocation({
      asset: assetId,
      employee: employeeId,
      department: departmentId,
      allocatedBy,
      expectedReturn,
      purpose,
      notes,
      attachments: attachments || [],
      status: AllocationStatus.ACTIVE
    });
    await allocation.save({ session });

    // 5. Update Asset Status and Holder
    asset.status = AssetStatus.ALLOCATED;
    asset.currentHolder = employeeId;
    asset.department = departmentId;
    await asset.save({ session });

    // 6. Record timeline history
    await AssetHistory.create([{
      asset: assetId,
      action: 'ALLOCATED',
      performedBy: allocatedBy,
      details: `Asset allocated to ${employee.firstName} ${employee.lastName}. Expected return: ${expectedReturn ? new Date(expectedReturn).toLocaleDateString() : 'N/A'}`,
      allocation: allocation._id
    }], { session });

    // 7. Log Activity
    await ActivityLog.create([{
      user: allocatedBy,
      action: 'ALLOCATE_ASSET',
      module: 'ALLOCATION',
      entityId: allocation._id.toString(),
      newData: {
        assetId,
        employeeId,
        departmentId,
        expectedReturn
      }
    }], { session });

    // 8. Create Notification for Employee
    const notification = new Notification({
      receiver: employeeId,
      title: 'Asset Assigned to You',
      message: `You have been allocated the asset "${asset.name}" (${asset.assetTag}). Expected return: ${expectedReturn ? new Date(expectedReturn).toLocaleDateString() : 'N/A'}.`,
      type: NotificationType.SUCCESS,
      read: false
    });
    await notification.save({ session });

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    // 9. Emit Real-time Socket Updates
    socketService.emitToUser(employeeId.toString(), 'notification', notification);
    
    // Notify all managers that a new allocation happened
    const managers = await User.find({ role: { $in: [UserRole.ASSET_MANAGER, UserRole.ADMIN] } });
    for (const manager of managers) {
      if (manager._id.toString() !== employeeId.toString()) {
        const managerNotification = await Notification.create({
          receiver: manager._id,
          title: 'New Allocation Logged',
          message: `Asset "${asset.name}" (${asset.assetTag}) was successfully allocated to ${employee.firstName} ${employee.lastName}.`,
          type: NotificationType.INFO,
          read: false
        });
        socketService.emitToUser(manager._id.toString(), 'notification', managerNotification);
      }
    }

    socketService.emitToAll('dashboard_update', { message: 'New allocation created' });

    res.status(201).json({
      message: 'Asset allocated successfully.',
      data: allocation
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

/**
 * GET /api/allocations
 * List asset allocations with advanced filtering and pagination.
 */
export async function getAllocations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      search, status, department, category, 
      page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' 
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const filter: any = {};

    // 1. Enforce RBAC filtering
    if (userRole === UserRole.EMPLOYEE) {
      filter.employee = userId;
    } else if (userRole === UserRole.DEPARTMENT_HEAD) {
      const user = await User.findById(userId);
      if (user && user.department) {
        filter.department = user.department;
      } else {
        res.status(200).json({ data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 }, stats: {} });
        return;
      }
    }

    // 2. Apply filters
    if (status) filter.status = status;
    if (department) filter.department = department;

    // Search query
    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      
      // Look up assets that match search
      const matchingAssets = await Asset.find({
        $or: [
          { name: searchRegex },
          { assetTag: searchRegex }
        ]
      }, { _id: 1 });
      const assetIds = matchingAssets.map(a => a._id);

      // Look up employees that match search
      const matchingEmployees = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      }, { _id: 1 });
      const employeeIds = matchingEmployees.map(e => e._id);

      filter.$or = [
        { asset: { $in: assetIds } },
        { employee: { $in: employeeIds } },
        { notes: searchRegex },
        { purpose: searchRegex }
      ];
    }

    // 3. Category filter requires matching against populated assets
    if (category) {
      const catAssets = await Asset.find({ category }, { _id: 1 });
      const catAssetIds = catAssets.map(a => a._id);
      if (filter.$or) {
        filter.asset = { $in: catAssetIds };
      } else {
        filter.asset = { $in: catAssetIds };
      }
    }

    // 4. Fetch Allocations
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery: any = {};
    sortQuery[sortBy as string] = sortOrder;

    const allocations = await AssetAllocation.find(filter)
      .populate({
        path: 'asset',
        populate: { path: 'category' }
      })
      .populate('employee', 'firstName lastName email employeeId')
      .populate('department', 'name code')
      .populate('allocatedBy', 'firstName lastName')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);

    const total = await AssetAllocation.countDocuments(filter);

    // 5. Generate Stats Summary
    const stats = {
      totalActive: await AssetAllocation.countDocuments({ ...filter, status: AllocationStatus.ACTIVE }),
      totalOverdue: await AssetAllocation.countDocuments({ ...filter, status: AllocationStatus.OVERDUE }),
      dueToday: await AssetAllocation.countDocuments({
        ...filter,
        status: AllocationStatus.ACTIVE,
        expectedReturn: {
          $gte: new Date(new Date().setHours(0,0,0,0)),
          $lte: new Date(new Date().setHours(23,59,59,999))
        }
      }),
      dueTomorrow: await AssetAllocation.countDocuments({
        ...filter,
        status: AllocationStatus.ACTIVE,
        expectedReturn: {
          $gte: new Date(new Date(Date.now() + 24*60*60*1000).setHours(0,0,0,0)),
          $lte: new Date(new Date(Date.now() + 24*60*60*1000).setHours(23,59,59,999))
        }
      })
    };

    res.status(200).json({
      data: allocations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/allocations/:id
 * Retrieve a specific allocation
 */
export async function getAllocationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const allocation = await AssetAllocation.findById(id)
      .populate({
        path: 'asset',
        populate: { path: 'category' }
      })
      .populate('employee', 'firstName lastName email employeeId')
      .populate('department', 'name code')
      .populate('allocatedBy', 'firstName lastName');

    if (!allocation) {
      res.status(404).json({ message: 'Allocation not found.' });
      return;
    }

    // Role-based scope enforcement
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    if (userRole === UserRole.EMPLOYEE && allocation.employee._id.toString() !== userId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    if (userRole === UserRole.DEPARTMENT_HEAD) {
      const user = await User.findById(userId);
      if (user && user.department.toString() !== allocation.department._id.toString()) {
        res.status(403).json({ message: 'Access denied. Allocation is in another department.' });
        return;
      }
    }

    res.status(200).json(allocation);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/allocations/:id
 * Update details (e.g. extending expected return date)
 */
export async function updateAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { expectedReturn, purpose, notes, status } = req.body;
    const userId = req.user?.userId;

    const allocation = await AssetAllocation.findById(id).populate('asset employee');
    if (!allocation) {
      res.status(404).json({ message: 'Allocation not found.' });
      return;
    }

    const oldData = {
      expectedReturn: allocation.expectedReturn,
      status: allocation.status,
      notes: allocation.notes,
      purpose: allocation.purpose
    };

    if (expectedReturn) {
      allocation.expectedReturn = new Date(expectedReturn);
      if (new Date(expectedReturn) > new Date() && allocation.status === AllocationStatus.OVERDUE) {
        allocation.status = AllocationStatus.ACTIVE;
      }
    }
    if (purpose) allocation.purpose = purpose;
    if (notes) allocation.notes = notes;
    if (status) allocation.status = status;

    await allocation.save();

    // Log Timeline History
    await AssetHistory.create({
      asset: allocation.asset._id,
      action: 'ALLOCATION_UPDATED',
      performedBy: userId,
      details: `Allocation updated. Expected return: ${allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'N/A'}. Status: ${allocation.status}`,
      allocation: allocation._id
    });

    // Log Activity
    await ActivityLog.create({
      user: userId,
      action: 'UPDATE_ALLOCATION',
      module: 'ALLOCATION',
      entityId: allocation._id.toString(),
      oldData,
      newData: {
        expectedReturn: allocation.expectedReturn,
        status: allocation.status,
        notes: allocation.notes,
        purpose: allocation.purpose
      }
    });

    // Notify employee if date extended
    if (expectedReturn && oldData.expectedReturn?.toString() !== new Date(expectedReturn).toString()) {
      const employeeNotification = await Notification.create({
        receiver: allocation.employee._id,
        title: 'Allocation Schedule Updated',
        message: `Your return date for asset "${allocation.asset.name}" has been updated to ${new Date(expectedReturn).toLocaleDateString()}.`,
        type: NotificationType.INFO,
        read: false
      });
      socketService.emitToUser(allocation.employee._id.toString(), 'notification', employeeNotification);
    }

    socketService.emitToAll('dashboard_update', { message: 'Allocation updated' });

    res.status(200).json({
      message: 'Allocation updated successfully.',
      data: allocation
    });
  } catch (error) {
    next(error);
  }
}
