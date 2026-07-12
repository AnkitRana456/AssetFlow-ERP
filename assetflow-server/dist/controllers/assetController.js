"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssets = getAssets;
exports.getAssetById = getAssetById;
exports.createAsset = createAsset;
exports.updateAsset = updateAsset;
exports.deleteAsset = deleteAsset;
exports.importAssets = importAssets;
exports.exportAssets = exportAssets;
exports.getAssetHistory = getAssetHistory;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const Asset_1 = require("../models/Asset");
const User_1 = require("../models/User");
const Department_1 = require("../models/Department");
const AssetCategory_1 = require("../models/AssetCategory");
const ActivityLog_1 = require("../models/ActivityLog");
const Notification_1 = require("../models/Notification");
const AssetAllocation_1 = require("../models/AssetAllocation");
const utils_1 = require("../utils");
/**
 * Helper: Generate next unique Asset Tag (AF-XXXXXX)
 */
async function generateNextAssetTag() {
    const lastAsset = await Asset_1.Asset.findOne({}, { assetTag: 1 }, { sort: { assetTag: -1 } });
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
async function getAssets(req, res, next) {
    try {
        const { search, status, department, category, condition, location, shared, isBookable, warranty, page = 1, limit = 10, sortBy = 'assetTag', order = 'asc' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // 1. Enforce RBAC filtering
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const filter = { deletedAt: null };
        if (userRole === User_1.UserRole.EMPLOYEE) {
            // Employees only see assets allocated to them
            filter.currentHolder = userId;
        }
        else if (userRole === User_1.UserRole.DEPARTMENT_HEAD) {
            // Dept Heads see assets of their department
            const user = await User_1.User.findById(userId);
            if (user && user.department) {
                filter.department = user.department;
            }
            else {
                res.status(200).json({ data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 }, stats: {} });
                return;
            }
        }
        // 2. Apply UI Filters
        if (status)
            filter.status = status;
        if (department)
            filter.department = department;
        if (category)
            filter.category = category;
        if (condition)
            filter.condition = condition;
        if (location)
            filter.location = { $regex: location, $options: 'i' };
        if (shared)
            filter.bookable = shared === 'true';
        if (isBookable)
            filter.bookable = isBookable === 'true';
        // Warranty filter
        if (warranty === 'active') {
            filter.warrantyExpiry = { $gt: new Date() };
        }
        else if (warranty === 'expired') {
            filter.warrantyExpiry = { $lte: new Date() };
        }
        // 3. Apply Search
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            // We also look up users matching search to search by currentHolder
            const matchingUsers = await User_1.User.find({
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
        const sortField = sortBy;
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = {};
        sortObj[sortField] = sortOrder;
        // 5. Query DB
        const assets = await Asset_1.Asset.find(filter)
            .populate('category', 'name icon')
            .populate('department', 'name code')
            .populate('currentHolder', 'firstName lastName email employeeId')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);
        const total = await Asset_1.Asset.countDocuments(filter);
        // 6. Compute Stats (role scoped)
        const statsFilter = { deletedAt: null };
        if (userRole === User_1.UserRole.EMPLOYEE) {
            statsFilter.currentHolder = userId;
        }
        else if (userRole === User_1.UserRole.DEPARTMENT_HEAD) {
            const user = await User_1.User.findById(userId);
            if (user && user.department) {
                statsFilter.department = user.department;
            }
        }
        const totalCount = await Asset_1.Asset.countDocuments(statsFilter);
        const availableCount = await Asset_1.Asset.countDocuments({ ...statsFilter, status: Asset_1.AssetStatus.AVAILABLE });
        const allocatedCount = await Asset_1.Asset.countDocuments({ ...statsFilter, status: Asset_1.AssetStatus.ALLOCATED });
        const maintenanceCount = await Asset_1.Asset.countDocuments({ ...statsFilter, status: Asset_1.AssetStatus.UNDER_MAINTENANCE });
        const lostCount = await Asset_1.Asset.countDocuments({ ...statsFilter, status: Asset_1.AssetStatus.LOST });
        const retiredCount = await Asset_1.Asset.countDocuments({ ...statsFilter, status: Asset_1.AssetStatus.RETIRED });
        const disposedCount = await Asset_1.Asset.countDocuments({ ...statsFilter, status: Asset_1.AssetStatus.DISPOSED });
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/assets/:id
 * Retrieve single asset details. Enforces role scope.
 */
async function getAssetById(req, res, next) {
    try {
        const id = req.params.id;
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const asset = await Asset_1.Asset.findById(id)
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
        if (userRole === User_1.UserRole.EMPLOYEE && asset.currentHolder?._id.toString() !== userId) {
            res.status(403).json({ message: 'Forbidden: You do not have permission to view this asset.' });
            return;
        }
        if (userRole === User_1.UserRole.DEPARTMENT_HEAD) {
            const user = await User_1.User.findById(userId);
            if (user && asset.department && asset.department._id.toString() !== user.department?.toString()) {
                res.status(403).json({ message: 'Forbidden: This asset belongs to another department.' });
                return;
            }
        }
        res.status(200).json(asset);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/assets
 * Create a new Asset (Admin / Manager only). Supports image/document uploads.
 */
async function createAsset(req, res, next) {
    try {
        const { name, serialNumber, category, department, location, condition, vendor, purchaseDate, warrantyExpiry, purchasePrice, bookable, description } = req.body;
        const adminId = req.user?.userId;
        // Check duplicate serial number
        const existingSerial = await Asset_1.Asset.findOne({ serialNumber: serialNumber.toUpperCase(), deletedAt: null });
        if (existingSerial) {
            res.status(400).json({ message: `Serial number '${serialNumber}' is already registered.` });
            return;
        }
        // 1. Upload files if present
        let photoUrl = '';
        const docsList = [];
        const files = req.files;
        if (files) {
            if (files['photo'] && files['photo'].length > 0) {
                photoUrl = await (0, utils_1.uploadToCloudinary)(files['photo'][0].path, 'assets/photos');
            }
            if (files['documents']) {
                for (const docFile of files['documents']) {
                    const docUrl = await (0, utils_1.uploadToCloudinary)(docFile.path, 'assets/documents');
                    docsList.push({ name: docFile.originalname, url: docUrl });
                }
            }
        }
        // 2. Generate unique tag & QR/Barcode
        const assetTag = await generateNextAssetTag();
        const qrCode = await (0, utils_1.generateQRCodeDataURI)(assetTag);
        // 3. Create document
        const asset = new Asset_1.Asset({
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
            status: Asset_1.AssetStatus.AVAILABLE
        });
        await asset.save();
        // 4. Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: adminId,
            action: 'ASSET_CREATED',
            module: 'ASSETS',
            entityId: asset._id.toString(),
            newData: { assetTag, name, serialNumber }
        });
        // 5. Send Notification to Manager & Dept Head
        const deptObj = await Department_1.Department.findById(department);
        if (deptObj && deptObj.departmentHead) {
            await Notification_1.Notification.create({
                receiver: deptObj.departmentHead,
                title: 'New Asset Assigned',
                message: `Asset '${name}' (${assetTag}) has been added to your department.`,
                type: Notification_1.NotificationType.INFO,
                link: `/assets/${asset._id}`
            });
        }
        res.status(201).json({
            message: 'Asset registered successfully',
            data: asset
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/assets/:id
 * Update asset profile. Clean up old uploads on replacement.
 */
async function updateAsset(req, res, next) {
    try {
        const id = req.params.id;
        const adminId = req.user?.userId;
        const { name, serialNumber, category, department, location, condition, vendor, purchaseDate, warrantyExpiry, purchasePrice, bookable, description, status } = req.body;
        const asset = await Asset_1.Asset.findById(id);
        if (!asset) {
            res.status(404).json({ message: 'Asset not found' });
            return;
        }
        const oldData = { ...asset.toObject() };
        // Check duplicate serial number (excluding self)
        if (serialNumber && serialNumber.toUpperCase() !== asset.serialNumber) {
            const existingSerial = await Asset_1.Asset.findOne({
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
        const files = req.files;
        if (files) {
            if (files['photo'] && files['photo'].length > 0) {
                // Delete old photo if it exists
                if (asset.photo) {
                    await (0, utils_1.deleteFromCloudinary)(asset.photo);
                }
                asset.photo = await (0, utils_1.uploadToCloudinary)(files['photo'][0].path, 'assets/photos');
            }
            if (files['documents']) {
                for (const docFile of files['documents']) {
                    const docUrl = await (0, utils_1.uploadToCloudinary)(docFile.path, 'assets/documents');
                    asset.documents.push({ name: docFile.originalname, url: docUrl });
                }
            }
        }
        if (name)
            asset.name = name;
        if (category)
            asset.category = category;
        if (location)
            asset.location = location;
        if (condition)
            asset.condition = condition;
        if (vendor !== undefined)
            asset.vendor = vendor;
        if (purchaseDate !== undefined)
            asset.purchaseDate = purchaseDate;
        if (warrantyExpiry !== undefined)
            asset.warrantyExpiry = warrantyExpiry;
        if (purchasePrice !== undefined)
            asset.purchasePrice = purchasePrice;
        if (bookable !== undefined)
            asset.bookable = bookable === 'true' || bookable === true;
        if (description !== undefined)
            asset.description = description;
        // Handle department change alert
        if (department && department.toString() !== asset.department?.toString()) {
            asset.department = department;
            const deptObj = await Department_1.Department.findById(department);
            if (deptObj && deptObj.departmentHead) {
                await Notification_1.Notification.create({
                    receiver: deptObj.departmentHead,
                    title: 'Asset Department Transfer',
                    message: `Asset '${asset.name}' has been transferred into your department.`,
                    type: Notification_1.NotificationType.INFO,
                    link: `/assets/${asset._id}`
                });
            }
        }
        // Handle status change
        if (status && status !== asset.status) {
            asset.status = status;
            // If status is retired or disposed, remove the current holder
            if (status === Asset_1.AssetStatus.RETIRED || status === Asset_1.AssetStatus.DISPOSED) {
                asset.currentHolder = undefined;
                asset.retirementDate = new Date();
            }
        }
        asset.updatedBy = adminId;
        await asset.save();
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/assets/:id
 * Soft delete an asset.
 */
async function deleteAsset(req, res, next) {
    try {
        const id = req.params.id;
        const adminId = req.user?.userId;
        const asset = await Asset_1.Asset.findById(id);
        if (!asset) {
            res.status(404).json({ message: 'Asset not found' });
            return;
        }
        // Soft delete
        asset.deletedAt = new Date();
        asset.deletedBy = adminId;
        await asset.save();
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: adminId,
            action: 'ASSET_DELETED',
            module: 'ASSETS',
            entityId: id,
            oldData: { name: asset.name, assetTag: asset.assetTag }
        });
        res.status(200).json({ message: 'Asset soft deleted successfully.' });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/assets/import
 * Bulk Import assets via CSV upload.
 */
async function importAssets(req, res, next) {
    try {
        const adminId = req.user?.userId;
        if (!req.file) {
            res.status(400).json({ message: 'CSV file is required for bulk import.' });
            return;
        }
        const filePath = req.file.path;
        const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
        // Delete temp CSV file immediately
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        const lines = fileContent.split(/\r?\n/);
        if (lines.length < 2) {
            res.status(400).json({ message: 'Empty or invalid CSV file.' });
            return;
        }
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        // We expect headers: Name, SerialNumber, CategoryName, DepartmentCode, Location, Condition, PurchasePrice, Vendor
        const categoryCache = new Map();
        const departmentCache = new Map();
        const imported = [];
        const errors = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            if (values.length < headers.length) {
                errors.push(`Row ${i + 1}: Column count mismatch`);
                continue;
            }
            // Map values to row object
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            const { Name, SerialNumber, CategoryName, DepartmentCode, Location, Condition, PurchasePrice, Vendor } = row;
            if (!Name || !SerialNumber || !CategoryName || !DepartmentCode || !Location) {
                errors.push(`Row ${i + 1}: Missing required fields (Name, SerialNumber, CategoryName, DepartmentCode, Location)`);
                continue;
            }
            // Check serial uniqueness inside DB
            const existingSerial = await Asset_1.Asset.findOne({ serialNumber: SerialNumber.toUpperCase(), deletedAt: null });
            if (existingSerial) {
                errors.push(`Row ${i + 1}: Serial number '${SerialNumber}' is already registered.`);
                continue;
            }
            // Resolve Category ID
            let categoryId = categoryCache.get(CategoryName);
            if (!categoryId) {
                const cat = await AssetCategory_1.AssetCategory.findOne({ name: { $regex: new RegExp(`^${CategoryName}$`, 'i') }, deletedAt: null });
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
                const dept = await Department_1.Department.findOne({ code: DepartmentCode.toUpperCase(), deletedAt: null });
                if (!dept) {
                    errors.push(`Row ${i + 1}: Department code '${DepartmentCode}' does not exist.`);
                    continue;
                }
                departmentId = dept._id.toString();
                departmentCache.set(DepartmentCode, departmentId);
            }
            const assetTag = await generateNextAssetTag();
            const qrCode = await (0, utils_1.generateQRCodeDataURI)(assetTag);
            // Create Asset record in bulk candidate
            const newAsset = {
                assetTag,
                name: Name,
                serialNumber: SerialNumber.toUpperCase(),
                qrCode,
                barcode: assetTag,
                category: new mongoose_1.default.Types.ObjectId(categoryId),
                department: new mongoose_1.default.Types.ObjectId(departmentId),
                location: Location,
                condition: (Condition || Asset_1.AssetCondition.NEW).toUpperCase(),
                purchasePrice: PurchasePrice ? parseFloat(PurchasePrice) : 0,
                vendor: Vendor || '',
                status: Asset_1.AssetStatus.AVAILABLE,
                createdBy: adminId
            };
            // We insert immediately or push to a list. For indexing tag updates atomically, doing it in order is safer:
            const doc = await Asset_1.Asset.create(newAsset);
            imported.push(doc);
        }
        // Log Activity if imports succeeded
        if (imported.length > 0) {
            await ActivityLog_1.ActivityLog.create({
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/assets/export
 * Export all assets matching filters as CSV string.
 */
async function exportAssets(req, res, next) {
    try {
        const filter = { deletedAt: null };
        // Enforce role scope on export
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        if (userRole === User_1.UserRole.EMPLOYEE) {
            filter.currentHolder = userId;
        }
        else if (userRole === User_1.UserRole.DEPARTMENT_HEAD) {
            const user = await User_1.User.findById(userId);
            if (user && user.department) {
                filter.department = user.department;
            }
        }
        const assets = await Asset_1.Asset.find(filter)
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/assets/history/:id
 * Retrieve chronological timeline events for a single asset.
 */
async function getAssetHistory(req, res, next) {
    try {
        const assetId = req.params.id;
        // Fetch allocations
        const allocations = await AssetAllocation_1.AssetAllocation.find({ asset: assetId })
            .populate('employee', 'firstName lastName employeeId')
            .populate('allocatedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
        // Fetch activity logs
        const logs = await ActivityLog_1.ActivityLog.find({ entityId: assetId, module: 'ASSETS' })
            .populate('user', 'firstName lastName role')
            .sort({ createdAt: -1 });
        // Merge into structured timeline events
        const timeline = [];
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
            if (log.action === 'ASSET_CREATED')
                title = 'Asset Registered in System';
            else if (log.action === 'ASSET_UPDATED')
                title = 'Asset Information Modified';
            else if (log.action === 'ASSET_DELETED')
                title = 'Asset Soft Deleted';
            else
                title = `Action: ${log.action.replace('_', ' ')}`;
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
    }
    catch (error) {
        next(error);
    }
}
