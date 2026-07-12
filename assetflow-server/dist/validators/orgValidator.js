"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmployeeStatus = exports.validateEmployeePromotion = exports.validateEmployeeUpdate = exports.validateCategory = exports.validateDepartment = void 0;
const express_validator_1 = require("express-validator");
const Department_1 = require("../models/Department");
const AssetCategory_1 = require("../models/AssetCategory");
const User_1 = require("../models/User");
/**
 * Validation rules for Department Creation / Updates
 */
exports.validateDepartment = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Department name is required')
        .isString()
        .withMessage('Department name must be a string')
        .trim(),
    (0, express_validator_1.body)('code')
        .notEmpty()
        .withMessage('Department code is required')
        .isString()
        .withMessage('Department code must be a string')
        .trim()
        .toUpperCase(),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),
    (0, express_validator_1.body)('parentDepartment')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('Parent Department must be a valid ID'),
    (0, express_validator_1.body)('departmentHead')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('Department Head must be a valid ID'),
    (0, express_validator_1.body)('location')
        .optional()
        .isString()
        .withMessage('Location must be a string')
        .trim(),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(Object.values(Department_1.DepartmentStatus))
        .withMessage('Status must be ACTIVE or INACTIVE')
];
/**
 * Validation rules for Asset Category Creation / Updates
 */
exports.validateCategory = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Category name is required')
        .isString()
        .withMessage('Category name must be a string')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),
    (0, express_validator_1.body)('icon')
        .optional()
        .isString()
        .withMessage('Icon class/name must be a string')
        .trim(),
    (0, express_validator_1.body)('maintenanceInterval')
        .notEmpty()
        .withMessage('Maintenance interval is required')
        .isInt({ min: 1 })
        .withMessage('Maintenance interval must be an integer greater than 0'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(Object.values(AssetCategory_1.CategoryStatus))
        .withMessage('Status must be ACTIVE or INACTIVE'),
    (0, express_validator_1.body)('customFields')
        .optional()
        .isArray()
        .withMessage('Custom fields must be an array'),
    (0, express_validator_1.body)('customFields.*.name')
        .if((0, express_validator_1.body)('customFields').exists())
        .notEmpty()
        .withMessage('Custom field name is required')
        .isString()
        .withMessage('Custom field name must be a string'),
    (0, express_validator_1.body)('customFields.*.type')
        .if((0, express_validator_1.body)('customFields').exists())
        .notEmpty()
        .withMessage('Custom field type is required')
        .isIn(['STRING', 'NUMBER', 'BOOLEAN', 'DATE'])
        .withMessage('Custom field type must be STRING, NUMBER, BOOLEAN, or DATE'),
    (0, express_validator_1.body)('customFields.*.required')
        .if((0, express_validator_1.body)('customFields').exists())
        .optional()
        .isBoolean()
        .withMessage('Custom field required state must be a boolean')
];
/**
 * Validation rules for Employee Update (Admin)
 */
exports.validateEmployeeUpdate = [
    (0, express_validator_1.body)('firstName')
        .optional()
        .isString()
        .withMessage('First name must be a string')
        .trim(),
    (0, express_validator_1.body)('lastName')
        .optional()
        .isString()
        .withMessage('Last name must be a string')
        .trim(),
    (0, express_validator_1.body)('phone')
        .optional()
        .isString()
        .withMessage('Phone must be a string')
        .trim(),
    (0, express_validator_1.body)('department')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('Department must be a valid ID')
];
/**
 * Validation rules for Employee Promotion
 */
exports.validateEmployeePromotion = [
    (0, express_validator_1.body)('role')
        .notEmpty()
        .withMessage('Role is required')
        .isIn(Object.values(User_1.UserRole))
        .withMessage('Role must be ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, or EMPLOYEE'),
    (0, express_validator_1.body)('department')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('Department must be a valid ID'),
    (0, express_validator_1.body)('reason')
        .notEmpty()
        .withMessage('Reason for promotion is required')
        .isString()
        .withMessage('Reason must be a string')
        .trim()
];
/**
 * Validation rules for Employee Status Change
 */
exports.validateEmployeeStatus = [
    (0, express_validator_1.body)('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(Object.values(User_1.UserStatus))
        .withMessage('Status must be ACTIVE, INACTIVE, or SUSPENDED')
];
