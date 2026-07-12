import { body } from 'express-validator';
import { DepartmentStatus } from '../models/Department';
import { CategoryStatus } from '../models/AssetCategory';
import { UserRole, UserStatus } from '../models/User';

/**
 * Validation rules for Department Creation / Updates
 */
export const validateDepartment = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .isString()
    .withMessage('Department name must be a string')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Department code is required')
    .isString()
    .withMessage('Department code must be a string')
    .trim()
    .toUpperCase(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  body('parentDepartment')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Parent Department must be a valid ID'),
  body('departmentHead')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Department Head must be a valid ID'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim(),
  body('status')
    .optional()
    .isIn(Object.values(DepartmentStatus))
    .withMessage('Status must be ACTIVE or INACTIVE')
];

/**
 * Validation rules for Asset Category Creation / Updates
 */
export const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isString()
    .withMessage('Category name must be a string')
    .trim(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icon class/name must be a string')
    .trim(),
  body('maintenanceInterval')
    .notEmpty()
    .withMessage('Maintenance interval is required')
    .isInt({ min: 1 })
    .withMessage('Maintenance interval must be an integer greater than 0'),
  body('status')
    .optional()
    .isIn(Object.values(CategoryStatus))
    .withMessage('Status must be ACTIVE or INACTIVE'),
  body('customFields')
    .optional()
    .isArray()
    .withMessage('Custom fields must be an array'),
  body('customFields.*.name')
    .if(body('customFields').exists())
    .notEmpty()
    .withMessage('Custom field name is required')
    .isString()
    .withMessage('Custom field name must be a string'),
  body('customFields.*.type')
    .if(body('customFields').exists())
    .notEmpty()
    .withMessage('Custom field type is required')
    .isIn(['STRING', 'NUMBER', 'BOOLEAN', 'DATE'])
    .withMessage('Custom field type must be STRING, NUMBER, BOOLEAN, or DATE'),
  body('customFields.*.required')
    .if(body('customFields').exists())
    .optional()
    .isBoolean()
    .withMessage('Custom field required state must be a boolean')
];

/**
 * Validation rules for Employee Update (Admin)
 */
export const validateEmployeeUpdate = [
  body('firstName')
    .optional()
    .isString()
    .withMessage('First name must be a string')
    .trim(),
  body('lastName')
    .optional()
    .isString()
    .withMessage('Last name must be a string')
    .trim(),
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string')
    .trim(),
  body('department')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Department must be a valid ID')
];

/**
 * Validation rules for Employee Promotion
 */
export const validateEmployeePromotion = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(Object.values(UserRole))
    .withMessage('Role must be ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, or EMPLOYEE'),
  body('department')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Department must be a valid ID'),
  body('reason')
    .notEmpty()
    .withMessage('Reason for promotion is required')
    .isString()
    .withMessage('Reason must be a string')
    .trim()
];

/**
 * Validation rules for Employee Status Change
 */
export const validateEmployeeStatus = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(UserStatus))
    .withMessage('Status must be ACTIVE, INACTIVE, or SUSPENDED')
];
