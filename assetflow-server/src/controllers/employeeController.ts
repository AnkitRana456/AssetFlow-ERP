import { Request, Response, NextFunction } from 'express';
import { User, UserRole, UserStatus } from '../models/User';
import { Department, DepartmentStatus } from '../models/Department';
import { ActivityLog } from '../models/ActivityLog';
import { Notification, NotificationType } from '../models/Notification';

/**
 * GET /api/employees
 * List employees with paginated search, filter by department, role, or status.
 */
export async function getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const department = req.query.department as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { deletedAt: null };

    // Global Search: Name, Email, Employee ID
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by Department
    if (department) {
      filter.department = department;
    }

    // Filter by Role
    if (role) {
      filter.role = role;
    }

    // Filter by Status
    if (status) {
      filter.status = status;
    }

    const employees = await User.find(filter)
      .select('-password')
      .populate('department', 'name code')
      .sort({ employeeId: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      data: employees,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/employees/:id
 * Retrieve employee profile by ID (excluding password)
 */
export async function getEmployeeById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const employee = await User.findById(id)
      .select('-password')
      .populate('department', 'name code parentDepartment');

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.status(200).json(employee);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/employees/:id
 * Update general employee details (Name, Phone, Department change).
 */
export async function updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { firstName, lastName, phone, department } = req.body;
    const adminId = req.user?.userId as any;

    const employee = await User.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const oldData = { ...employee.toObject() };

    if (firstName !== undefined) employee.firstName = firstName;
    if (lastName !== undefined) employee.lastName = lastName;
    if (phone !== undefined) employee.phone = phone;

    // Handle Department Change with Inactive Check
    if (department !== undefined && department !== (employee.department ? employee.department.toString() : null)) {
      if (department) {
        const targetDept = await Department.findById(department);
        if (!targetDept) {
          res.status(404).json({ message: 'Target department not found' });
          return;
        }

        // Rule: Inactive departments cannot receive new employees
        if (targetDept.status !== DepartmentStatus.ACTIVE) {
          res.status(400).json({
            message: `Department assignment failed: The department '${targetDept.name}' is currently INACTIVE.`
          });
          return;
        }
        
        employee.department = department as any;
      } else {
        employee.department = undefined;
      }

      // Log department change activity
      await ActivityLog.create({
        user: adminId,
        action: 'EMPLOYEE_DEPARTMENT_CHANGED',
        module: 'ORGANIZATION',
        entityId: id,
        oldData: { department: oldData.department },
        newData: { department: employee.department }
      });

      // Notify the Employee
      const deptName = department ? (await Department.findById(department))?.name || 'New Department' : 'None';
      await Notification.create({
        receiver: id as any,
        title: 'Department Reassignment',
        message: `Your department has been changed to: ${deptName}`,
        type: NotificationType.INFO
      });
    }

    employee.updatedBy = adminId;
    await employee.save();

    res.status(200).json({
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/employees/promote/:id
 * Promote role (Employee -> Department Head -> Asset Manager -> Admin)
 */
export async function promoteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { role, department, reason } = req.body;
    const adminId = req.user?.userId as any;

    const employee = await User.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const previousRole = employee.role;

    if (previousRole === role && (!department || employee.department?.toString() === department.toString())) {
      res.status(400).json({ message: 'User already holds the requested role and department configuration.' });
      return;
    }

    // Update Role
    employee.role = role as UserRole;
    
    // If department is supplied, update it as well
    if (department) {
      const targetDept = await Department.findById(department);
      if (!targetDept) {
        res.status(404).json({ message: 'Target department not found' });
        return;
      }
      if (targetDept.status !== DepartmentStatus.ACTIVE) {
        res.status(400).json({ message: 'Target department is inactive and cannot receive users.' });
        return;
      }
      employee.department = department as any;
    }

    employee.updatedBy = adminId;
    await employee.save();

    // Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'EMPLOYEE_PROMOTED',
      module: 'ORGANIZATION',
      entityId: id,
      oldData: { role: previousRole },
      newData: { role, reason }
    });

    // Create Notification
    await Notification.create({
      receiver: id as any,
      title: 'Profile Role Promotion',
      message: `Congratulations! You have been promoted to ${role.replace('_', ' ')}. Reason: ${reason}`,
      type: NotificationType.SUCCESS
    });

    res.status(200).json({
      message: 'Employee promoted successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/employees/status/:id
 * Deactivate / Activate Employee.
 */
export async function updateEmployeeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const adminId = req.user?.userId as any;

    const employee = await User.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (employee.status === status) {
      res.status(400).json({ message: `Employee status is already ${status}` });
      return;
    }

    const previousStatus = employee.status;
    employee.status = status as UserStatus;
    employee.updatedBy = adminId;
    await employee.save();

    // Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'EMPLOYEE_STATUS_UPDATED',
      module: 'ORGANIZATION',
      entityId: id,
      oldData: { status: previousStatus },
      newData: { status }
    });

    // Send Alert Notification
    const isActive = status === UserStatus.ACTIVE;
    await Notification.create({
      receiver: id as any,
      title: isActive ? 'Account Activated' : 'Account Status Suspended',
      message: isActive 
        ? 'Your AssetFlow account has been activated. You can now log in.' 
        : `Your access to the ERP has been suspended (status: ${status}). Contact HR.`,
      type: isActive ? NotificationType.SUCCESS : NotificationType.WARNING
    });

    res.status(200).json({
      message: `Employee account status set to ${status} successfully`,
      data: employee
    });
  } catch (error) {
    next(error);
  }
}
