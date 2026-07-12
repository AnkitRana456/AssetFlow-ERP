import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import { Asset, AssetStatus, AssetCondition } from '../models/Asset';
import { User, UserRole } from '../models/User';
import { Department } from '../models/Department';
import { AssetCategory } from '../models/AssetCategory';
import { ActivityLog } from '../models/ActivityLog';
import { Notification, NotificationType } from '../models/Notification';
import { AssetAllocation, AllocationStatus } from '../models/AssetAllocation';
import { uploadToCloudinary, deleteFromCloudinary, generateQRCodeDataURI } from '../utils';

/**
 * Helper: Generate next unique Asset Tag (AF-XXXXXX)
 */
async function generateNextAssetTag(): Promise<string> {
  const lastAsset = await Asset.findOne({}, { assetTag: 1 }, { sort: { assetTag: -1 } });
  let nextTag = 'AF-000001';
  
  if (lastAsset && lastAsset.assetTag) {
    const match = lastAsset.assetTag.match(/AF-(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10);
      nextTag = `AF-${String(index + 1).padStart(6, '0')}`;
    }
  }
  return nextTag;
}

/**
 * GET /api/assets
 * Paginated list, advanced filters, searches, and stats summary.
 */
export async function getAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      search, status, department, category, condition, location,
      shared, isBookable, warranty, page = 1, limit = 10, sortBy = 'assetTag', order = 'asc' 
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // 1. Enforce RBAC filtering
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const filter: any = { deletedAt: null };

    if (userRole === UserRole.EMPLOYEE) {
      // Employees only see assets allocated to them
      filter.currentHolder = userId;
    } else if (userRole === UserRole.DEPARTMENT_HEAD) {
      // Dept Heads see assets of their department
      const user = await User.findById(userId);
      if (user && user.department) {
        filter.department = user.department;
      } else {
        res.status(200).json({ data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 }, stats: {} });
        return;
      }
    }

    // 2. Apply UI Filters
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (location) filter.location = { $regex: location as string, $options: 'i' };
    if (shared) filter.bookable = shared === 'true';
    if (isBookable) filter.bookable = isBookable === 'true';

    // Warranty filter
    if (warranty === 'active') {
      filter.warrantyExpiry = { $gt: new Date() };
    } else if (warranty === 'expired') {
      filter.warrantyExpiry = { $lte: new Date() };
    }

    // 3. Apply Search
    if (search) {
      const searchRegex = { $regex: search as string, $options: 'i' };
      
      // We also look up users matching search to search by currentHolder
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      }, { _id: 1 });
      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { assetTag: searchRegex },
        { name: searchRegex },
        { serialNumber: searchRegex },
        { location: searchRegex },
        { vendor: searchRegex },
        { currentHolder: { $in: userIds } }
      ];
    }

    // 4. Determine Sorting
    const sortField = sortBy as string;
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sortField] = sortOrder;

    // 5. Query DB
    const assets = await Asset.find(filter)
      .populate('category', 'name icon')
      .populate('department', 'name code')
      .populate('currentHolder', 'firstName lastName email employeeId')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Asset.countDocuments(filter);

    // 6. Compute Stats (role scoped)
    const statsFilter: any = { deletedAt: null };
    if (userRole === UserRole.EMPLOYEE) {
      statsFilter.currentHolder = userId;
    } else if (userRole === UserRole.DEPARTMENT_HEAD) {
      const user = await User.findById(userId);
      if (user && user.department) {
        statsFilter.department = user.department;
      }
    }

    const totalCount = await Asset.countDocuments(statsFilter);
    const availableCount = await Asset.countDocuments({ ...statsFilter, status: AssetStatus.AVAILABLE });
    const allocatedCount = await Asset.countDocuments({ ...statsFilter, status: AssetStatus.ALLOCATED });
    const maintenanceCount = await Asset.countDocuments({ ...statsFilter, status: AssetStatus.UNDER_MAINTENANCE });
    const lostCount = await Asset.countDocuments({ ...statsFilter, status: AssetStatus.LOST });
    const retiredCount = await Asset.countDocuments({ ...statsFilter, status: AssetStatus.RETIRED });
    const disposedCount = await Asset.countDocuments({ ...statsFilter, status: AssetStatus.DISPOSED });

    res.status(200).json({
      data: assets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      stats: {
        total: totalCount,
        available: availableCount,
        allocated: allocatedCount,
        maintenance: maintenanceCount,
        lost: lostCount,
        retired: retiredCount,
        disposed: disposedCount
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/assets/:id
 * Retrieve single asset details. Enforces role scope.
 */
export async function getAssetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    const asset = await Asset.findById(id)
      .populate('category', 'name icon customFields')
      .populate('department', 'name code location')
      .populate('currentHolder', 'firstName lastName email employeeId phone avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    // Role verification
    if (userRole === UserRole.EMPLOYEE && asset.currentHolder?._id.toString() !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not have permission to view this asset.' });
      return;
    }
    if (userRole === UserRole.DEPARTMENT_HEAD) {
      const user = await User.findById(userId);
      if (user && asset.department && asset.department._id.toString() !== user.department?.toString()) {
        res.status(403).json({ message: 'Forbidden: This asset belongs to another department.' });
        return;
      }
    }

    res.status(200).json(asset);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/assets
 * Create a new Asset (Admin / Manager only). Supports image/document uploads.
 */
export async function createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      name, serialNumber, category, department, location, condition, 
      vendor, purchaseDate, warrantyExpiry, purchasePrice, bookable, description 
    } = req.body;
    const adminId = req.user?.userId as any;

    // Check duplicate serial number
    const existingSerial = await Asset.findOne({ serialNumber: serialNumber.toUpperCase(), deletedAt: null });
    if (existingSerial) {
      res.status(400).json({ message: `Serial number '${serialNumber}' is already registered.` });
      return;
    }

    // 1. Upload files if present
    let photoUrl = '';
    const docsList: any[] = [];
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (files) {
      if (files['photo'] && files['photo'].length > 0) {
        photoUrl = await uploadToCloudinary(files['photo'][0].path, 'assets/photos');
      }
      if (files['documents']) {
        for (const docFile of files['documents']) {
          const docUrl = await uploadToCloudinary(docFile.path, 'assets/documents');
          docsList.push({ name: docFile.originalname, url: docUrl });
        }
      }
    }

    // 2. Generate unique tag & QR/Barcode
    const assetTag = await generateNextAssetTag();
    const qrCode = await generateQRCodeDataURI(assetTag);

    // 3. Create document
    const asset = new Asset({
      assetTag,
      name,
      serialNumber: serialNumber.toUpperCase(),
      qrCode,
      barcode: assetTag, // In our ERP, barcode matches assetTag text
      category,
      department,
      location,
      condition,
      purchaseDate,
      warrantyExpiry,
      purchasePrice,
      vendor,
      bookable: bookable === 'true' || bookable === true,
      description,
      photo: photoUrl || undefined,
      documents: docsList,
      createdBy: adminId,
      status: AssetStatus.AVAILABLE
    });

    await asset.save();

    // 4. Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'ASSET_CREATED',
      module: 'ASSETS',
      entityId: asset._id.toString(),
      newData: { assetTag, name, serialNumber }
    });

    // 5. Send Notification to Manager & Dept Head
    const deptObj = await Department.findById(department);
    if (deptObj && deptObj.departmentHead) {
      await Notification.create({
        receiver: deptObj.departmentHead,
        title: 'New Asset Assigned',
        message: `Asset '${name}' (${assetTag}) has been added to your department.`,
        type: NotificationType.INFO,
        link: `/assets/${asset._id}`
      });
    }

    res.status(201).json({
      message: 'Asset registered successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/assets/:id
 * Update asset profile. Clean up old uploads on replacement.
 */
export async function updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user?.userId as any;
    const { 
      name, serialNumber, category, department, location, condition, 
      vendor, purchaseDate, warrantyExpiry, purchasePrice, bookable, description, status
    } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    const oldData = { ...asset.toObject() };

    // Check duplicate serial number (excluding self)
    if (serialNumber && serialNumber.toUpperCase() !== asset.serialNumber) {
      const existingSerial = await Asset.findOne({ 
        serialNumber: serialNumber.toUpperCase(), 
        _id: { $ne: id },
        deletedAt: null 
      });
      if (existingSerial) {
        res.status(400).json({ message: `Serial number '${serialNumber}' is already registered.` });
        return;
      }
      asset.serialNumber = serialNumber.toUpperCase();
    }

    // File Upload updates
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files['photo'] && files['photo'].length > 0) {
        // Delete old photo if it exists
        if (asset.photo) {
          await deleteFromCloudinary(asset.photo);
        }
        asset.photo = await uploadToCloudinary(files['photo'][0].path, 'assets/photos');
      }

      if (files['documents']) {
        for (const docFile of files['documents']) {
          const docUrl = await uploadToCloudinary(docFile.path, 'assets/documents');
          asset.documents.push({ name: docFile.originalname, url: docUrl });
        }
      }
    }

    if (name) asset.name = name;
    if (category) asset.category = category;
    if (location) asset.location = location;
    if (condition) asset.condition = condition;
    if (vendor !== undefined) asset.vendor = vendor;
    if (purchaseDate !== undefined) asset.purchaseDate = purchaseDate;
    if (warrantyExpiry !== undefined) asset.warrantyExpiry = warrantyExpiry;
    if (purchasePrice !== undefined) asset.purchasePrice = purchasePrice;
    if (bookable !== undefined) asset.bookable = bookable === 'true' || bookable === true;
    if (description !== undefined) asset.description = description as any;

    // Handle department change alert
    if (department && department.toString() !== asset.department?.toString()) {
      asset.department = department;
      const deptObj = await Department.findById(department);
      if (deptObj && deptObj.departmentHead) {
        await Notification.create({
          receiver: deptObj.departmentHead,
          title: 'Asset Department Transfer',
          message: `Asset '${asset.name}' has been transferred into your department.`,
          type: NotificationType.INFO,
          link: `/assets/${asset._id}`
        });
      }
    }

    // Handle status change
    if (status && status !== asset.status) {
      asset.status = status;
      // If status is retired or disposed, remove the current holder
      if (status === AssetStatus.RETIRED || status === AssetStatus.DISPOSED) {
        asset.currentHolder = undefined;
        asset.retirementDate = new Date();
      }
    }

    asset.updatedBy = adminId;
    await asset.save();

    // Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'ASSET_UPDATED',
      module: 'ASSETS',
      entityId: asset._id.toString(),
      oldData: { status: oldData.status, location: oldData.location, department: oldData.department },
      newData: { status: asset.status, location: asset.location, department: asset.department }
    });

    res.status(200).json({
      message: 'Asset updated successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/assets/:id
 * Soft delete an asset.
 */
export async function deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user?.userId as any;

    const asset = await Asset.findById(id);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    // Soft delete
    asset.deletedAt = new Date();
    asset.deletedBy = adminId;
    await asset.save();

    // Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'ASSET_DELETED',
      module: 'ASSETS',
      entityId: id,
      oldData: { name: asset.name, assetTag: asset.assetTag }
    });

    res.status(200).json({ message: 'Asset soft deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/assets/import
 * Bulk Import assets via CSV upload.
 */
export async function importAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.user?.userId as any;
    if (!req.file) {
      res.status(400).json({ message: 'CSV file is required for bulk import.' });
      return;
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Delete temp CSV file immediately
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const lines = fileContent.split(/\r?\n/);
    if (lines.length < 2) {
      res.status(400).json({ message: 'Empty or invalid CSV file.' });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // We expect headers: Name, SerialNumber, CategoryName, DepartmentCode, Location, Condition, PurchasePrice, Vendor
    const categoryCache = new Map<string, string>();
    const departmentCache = new Map<string, string>();

    const imported: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length < headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      // Map values to row object
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const { Name, SerialNumber, CategoryName, DepartmentCode, Location, Condition, PurchasePrice, Vendor } = row;

      if (!Name || !SerialNumber || !CategoryName || !DepartmentCode || !Location) {
        errors.push(`Row ${i + 1}: Missing required fields (Name, SerialNumber, CategoryName, DepartmentCode, Location)`);
        continue;
      }

      // Check serial uniqueness inside DB
      const existingSerial = await Asset.findOne({ serialNumber: SerialNumber.toUpperCase(), deletedAt: null });
      if (existingSerial) {
        errors.push(`Row ${i + 1}: Serial number '${SerialNumber}' is already registered.`);
        continue;
      }

      // Resolve Category ID
      let categoryId = categoryCache.get(CategoryName);
      if (!categoryId) {
        const cat = await AssetCategory.findOne({ name: { $regex: new RegExp(`^${CategoryName}$`, 'i') }, deletedAt: null });
        if (!cat) {
          errors.push(`Row ${i + 1}: Category '${CategoryName}' does not exist.`);
          continue;
        }
        categoryId = cat._id.toString();
        categoryCache.set(CategoryName, categoryId);
      }

      // Resolve Department ID
      let departmentId = departmentCache.get(DepartmentCode);
      if (!departmentId) {
        const dept = await Department.findOne({ code: DepartmentCode.toUpperCase(), deletedAt: null });
        if (!dept) {
          errors.push(`Row ${i + 1}: Department code '${DepartmentCode}' does not exist.`);
          continue;
        }
        departmentId = dept._id.toString();
        departmentCache.set(DepartmentCode, departmentId);
      }

      const assetTag = await generateNextAssetTag();
      const qrCode = await generateQRCodeDataURI(assetTag);

      // Create Asset record in bulk candidate
      const newAsset = {
        assetTag,
        name: Name,
        serialNumber: SerialNumber.toUpperCase(),
        qrCode,
        barcode: assetTag,
        category: new mongoose.Types.ObjectId(categoryId),
        department: new mongoose.Types.ObjectId(departmentId),
        location: Location,
        condition: (Condition || AssetCondition.NEW).toUpperCase(),
        purchasePrice: PurchasePrice ? parseFloat(PurchasePrice) : 0,
        vendor: Vendor || '',
        status: AssetStatus.AVAILABLE,
        createdBy: adminId
      };

      // We insert immediately or push to a list. For indexing tag updates atomically, doing it in order is safer:
      const doc = await Asset.create(newAsset);
      imported.push(doc);
    }

    // Log Activity if imports succeeded
    if (imported.length > 0) {
      await ActivityLog.create({
        user: adminId,
        action: 'ASSETS_BULK_IMPORTED',
        module: 'ASSETS',
        newData: { count: imported.length }
      });
    }

    res.status(200).json({
      message: `Bulk import completed. Successfully imported: ${imported.length}, Failures: ${errors.length}`,
      importedCount: imported.length,
      errors
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/assets/export
 * Export all assets matching filters as CSV string.
 */
export async function exportAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: any = { deletedAt: null };

    // Enforce role scope on export
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    if (userRole === UserRole.EMPLOYEE) {
      filter.currentHolder = userId;
    } else if (userRole === UserRole.DEPARTMENT_HEAD) {
      const user = await User.findById(userId);
      if (user && user.department) {
        filter.department = user.department;
      }
    }

    const assets = await Asset.find(filter)
      .populate('category', 'name')
      .populate('department', 'code')
      .populate('currentHolder', 'employeeId')
      .sort({ assetTag: 1 });

    // Build CSV Content
    let csv = 'Asset Tag,Name,Serial Number,Category,Department,Holder Employee ID,Status,Condition,Location,Purchase Price,Vendor\n';
    
    for (const asset of assets) {
      const holderId = asset.currentHolder ? asset.currentHolder.employeeId : 'N/A';
      const categoryName = asset.category ? asset.category.name : 'N/A';
      const departmentCode = asset.department ? asset.department.code : 'N/A';
      
      csv += `"${asset.assetTag}","${asset.name}","${asset.serialNumber}","${categoryName}","${departmentCode}","${holderId}","${asset.status}","${asset.condition}","${asset.location || ''}",${asset.purchasePrice || 0},"${asset.vendor || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assets-export.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/assets/history/:id
 * Retrieve chronological timeline events for a single asset.
 */
export async function getAssetHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = req.params.id as string;

    // Fetch allocations
    const allocations = await AssetAllocation.find({ asset: assetId })
      .populate('employee', 'firstName lastName employeeId')
      .populate('allocatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Fetch activity logs
    const logs = await ActivityLog.find({ entityId: assetId, module: 'ASSETS' })
      .populate('user', 'firstName lastName role')
      .sort({ createdAt: -1 });

    // Merge into structured timeline events
    const timeline: any[] = [];

    // Add Allocation events
    allocations.forEach(alloc => {
      timeline.push({
        event: 'Allocation',
        title: `Assigned to ${alloc.employee.firstName} ${alloc.employee.lastName} (${alloc.employee.employeeId})`,
        description: alloc.notes || 'Asset allocated to personnel',
        date: alloc.allocatedDate,
        user: `${alloc.allocatedBy.firstName} ${alloc.allocatedBy.lastName}`,
        status: alloc.status
      });

      if (alloc.returnedDate) {
        timeline.push({
          event: 'Return',
          title: `Returned by ${alloc.employee.firstName} ${alloc.employee.lastName}`,
          description: `Return condition: ${alloc.returnCondition}. Notes: ${alloc.notes || 'None'}`,
          date: alloc.returnedDate,
          user: 'System Processed',
          status: 'RETURNED'
        });
      }
    });

    // Add general activity logs (Created, Updated, Deleted)
    logs.forEach(log => {
      let title = '';
      if (log.action === 'ASSET_CREATED') title = 'Asset Registered in System';
      else if (log.action === 'ASSET_UPDATED') title = 'Asset Information Modified';
      else if (log.action === 'ASSET_DELETED') title = 'Asset Soft Deleted';
      else title = `Action: ${log.action.replace('_', ' ')}`;

      timeline.push({
        event: log.action,
        title,
        description: `Module tracking update. Data changed: ${JSON.stringify(log.newData || {})}`,
        date: log.createdAt,
        user: log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.role})` : 'System'
      });
    });

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.status(200).json(timeline);
  } catch (error) {
    next(error);
  }
}
