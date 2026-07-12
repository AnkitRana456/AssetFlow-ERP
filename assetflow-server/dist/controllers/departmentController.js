"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartments = getDepartments;
exports.getDepartmentById = getDepartmentById;
exports.createDepartment = createDepartment;
exports.updateDepartment = updateDepartment;
exports.deleteDepartment = deleteDepartment;
const Department_1 = require("../models/Department");
const User_1 = require("../models/User");
const ActivityLog_1 = require("../models/ActivityLog");
/**
 * Helper to check if setting parentId for deptId introduces a circular hierarchy.
 * Returns true if setting parentId creates a loop (circular dependency).
 */
async function checkCircularHierarchy(deptId, parentId) {
    let currentParentId = parentId;
    while (currentParentId) {
        if (currentParentId.toString() === deptId.toString()) {
            return true;
        }
        const parentDept = await Department_1.Department.findById(currentParentId);
        if (!parentDept || !parentDept.parentDepartment) {
            break;
        }
        currentParentId = parentDept.parentDepartment.toString();
    }
    return false;
}
/**
 * GET /api/departments
 * Fetch departments with filters, search, pagination, and employee counts.
 */
async function getDepartments(req, res, next) {
    try {
        const search = req.query.search;
        const status = req.query.status;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const filter = { deletedAt: null };
        // Search by Name or Code
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }
        // Filter by Status
        if (status) {
            filter.status = status;
        }
        // Query Departments
        const departments = await Department_1.Department.find(filter)
            .populate('parentDepartment', 'name code')
            .populate('departmentHead', 'firstName lastName email employeeId')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Department_1.Department.countDocuments(filter);
        // Compute employee count for each department
        const departmentsWithCounts = await Promise.all(departments.map(async (dept) => {
            const employeeCount = await User_1.User.countDocuments({ department: dept._id, deletedAt: null });
            return {
                ...dept.toObject(),
                employeesCount: employeeCount
            };
        }));
        // Compute statistics for header cards
        const totalCount = await Department_1.Department.countDocuments({ deletedAt: null });
        const activeCount = await Department_1.Department.countDocuments({ status: Department_1.DepartmentStatus.ACTIVE, deletedAt: null });
        const inactiveCount = await Department_1.Department.countDocuments({ status: Department_1.DepartmentStatus.INACTIVE, deletedAt: null });
        const totalEmployeesAssigned = await User_1.User.countDocuments({ department: { $ne: null }, deletedAt: null });
        res.status(200).json({
            data: departmentsWithCounts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            stats: {
                totalDepartments: totalCount,
                activeDepartments: activeCount,
                inactiveDepartments: inactiveCount,
                employeesAssigned: totalEmployeesAssigned
            }
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/departments/:id
 * Retrieve single department detail
 */
async function getDepartmentById(req, res, next) {
    try {
        const id = req.params.id;
        const department = await Department_1.Department.findById(id)
            .populate('parentDepartment', 'name code')
            .populate('departmentHead', 'firstName lastName email employeeId');
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        const employeeCount = await User_1.User.countDocuments({ department: department._id, deletedAt: null });
        res.status(200).json({
            ...department.toObject(),
            employeesCount: employeeCount
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/departments
 * Create a new Department.
 */
async function createDepartment(req, res, next) {
    try {
        const { name, code, description, parentDepartment, departmentHead, location, status } = req.body;
        const adminId = req.user?.userId;
        // Check name duplicate
        const existingName = await Department_1.Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, deletedAt: null });
        if (existingName) {
            res.status(400).json({ message: `Department name '${name}' already exists.` });
            return;
        }
        // Check code duplicate
        const existingCode = await Department_1.Department.findOne({ code: code.toUpperCase(), deletedAt: null });
        if (existingCode) {
            res.status(400).json({ message: `Department code '${code}' already exists.` });
            return;
        }
        // Create Department
        const department = new Department_1.Department({
            name,
            code: code.toUpperCase(),
            description,
            parentDepartment: parentDepartment || undefined,
            departmentHead: departmentHead || undefined,
            location,
            status,
            createdBy: adminId
        });
        await department.save();
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: adminId,
            action: 'DEPARTMENT_CREATED',
            module: 'ORGANIZATION',
            entityId: department._id.toString(),
            newData: { name: department.name, code: department.code }
        });
        res.status(201).json({
            message: 'Department created successfully',
            data: department
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/departments/:id
 * Update department details.
 */
async function updateDepartment(req, res, next) {
    try {
        const id = req.params.id;
        const { name, code, description, parentDepartment, departmentHead, location, status } = req.body;
        const adminId = req.user?.userId;
        const department = await Department_1.Department.findById(id);
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        const oldData = { ...department.toObject() };
        // Check Name duplicate (excluding self)
        if (name && name !== department.name) {
            const existingName = await Department_1.Department.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: id },
                deletedAt: null
            });
            if (existingName) {
                res.status(400).json({ message: `Department name '${name}' already exists.` });
                return;
            }
            department.name = name;
        }
        // Check Code duplicate (excluding self)
        if (code && code.toUpperCase() !== department.code) {
            const existingCode = await Department_1.Department.findOne({
                code: code.toUpperCase(),
                _id: { $ne: id },
                deletedAt: null
            });
            if (existingCode) {
                res.status(400).json({ message: `Department code '${code}' already exists.` });
                return;
            }
            department.code = code.toUpperCase();
        }
        // Check Circular Hierarchy
        if (parentDepartment) {
            if (parentDepartment.toString() === id.toString()) {
                res.status(400).json({ message: 'A department cannot be its own parent.' });
                return;
            }
            const isCircular = await checkCircularHierarchy(id, parentDepartment);
            if (isCircular) {
                res.status(400).json({
                    message: 'Circular Hierarchy Error: Setting this parent department would introduce a loop.'
                });
                return;
            }
            department.parentDepartment = parentDepartment;
        }
        else if (parentDepartment === null) {
            department.parentDepartment = undefined;
        }
        if (description !== undefined)
            department.description = description;
        if (departmentHead !== undefined)
            department.departmentHead = departmentHead || undefined;
        if (location !== undefined)
            department.location = location;
        if (status !== undefined)
            department.status = status;
        department.updatedBy = adminId;
        await department.save();
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: adminId,
            action: 'DEPARTMENT_UPDATED',
            module: 'ORGANIZATION',
            entityId: department._id.toString(),
            oldData: { name: oldData.name, code: oldData.code, parentDepartment: oldData.parentDepartment },
            newData: { name: department.name, code: department.code, parentDepartment: department.parentDepartment }
        });
        res.status(200).json({
            message: 'Department updated successfully',
            data: department
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/departments/:id
 * Soft Delete a Department.
 */
async function deleteDepartment(req, res, next) {
    try {
        const id = req.params.id;
        const adminId = req.user?.userId;
        const department = await Department_1.Department.findById(id);
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        // Check if there are active employees inside
        const employeeCount = await User_1.User.countDocuments({ department: id, deletedAt: null });
        if (employeeCount > 0) {
            res.status(400).json({
                message: `Cannot delete department. There are ${employeeCount} active employees currently assigned to it.`
            });
            return;
        }
        // Soft delete
        department.deletedAt = new Date();
        department.deletedBy = adminId;
        await department.save();
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: adminId,
            action: 'DEPARTMENT_DELETED',
            module: 'ORGANIZATION',
            entityId: id,
            oldData: { name: department.name, code: department.code }
        });
        res.status(200).json({
            message: 'Department deleted successfully (soft delete)'
        });
    }
    catch (error) {
        next(error);
    }
}
