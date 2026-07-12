"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../models/User");
const Department_1 = require("../models/Department");
const AssetCategory_1 = require("../models/AssetCategory");
const Asset_1 = require("../models/Asset");
const Booking_1 = require("../models/Booking");
const MaintenanceRequest_1 = require("../models/MaintenanceRequest");
const AuditCycle_1 = require("../models/AuditCycle");
const AuditItem_1 = require("../models/AuditItem");
const Notification_1 = require("../models/Notification");
const ActivityLog_1 = require("../models/ActivityLog");
const RefreshToken_1 = require("../models/RefreshToken");
const passwordUtil_1 = require("../utils/passwordUtil");
dotenv_1.default.config();
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow';
async function seed() {
    try {
        console.log('Connecting to database for seeding...');
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to database.');
        // Clear all collections
        console.log('Clearing existing database collections...');
        await Promise.all([
            User_1.User.deleteMany({}),
            Department_1.Department.deleteMany({}),
            AssetCategory_1.AssetCategory.deleteMany({}),
            Asset_1.Asset.deleteMany({}),
            Booking_1.Booking.deleteMany({}),
            MaintenanceRequest_1.MaintenanceRequest.deleteMany({}),
            AuditCycle_1.AuditCycle.deleteMany({}),
            AuditItem_1.AuditItem.deleteMany({}),
            Notification_1.Notification.deleteMany({}),
            ActivityLog_1.ActivityLog.deleteMany({}),
            RefreshToken_1.RefreshToken.deleteMany({})
        ]);
        console.log('Collections cleared.');
        const defaultPasswordHash = await (0, passwordUtil_1.hashPassword)('Password@123');
        // 1. Seed Departments
        console.log('Seeding departments...');
        const itDept = await Department_1.Department.create({
            name: 'Information Technology',
            code: 'IT',
            description: 'IT Systems and Infrastructure Support',
            status: Department_1.DepartmentStatus.ACTIVE,
            location: 'Building A, 3rd Floor'
        });
        const hrDept = await Department_1.Department.create({
            name: 'Human Resources',
            code: 'HR',
            description: 'Employee relations and recruitment',
            status: Department_1.DepartmentStatus.ACTIVE,
            location: 'Building B, 1st Floor'
        });
        const finDept = await Department_1.Department.create({
            name: 'Finance',
            code: 'FIN',
            description: 'Accounts and corporate finances',
            status: Department_1.DepartmentStatus.ACTIVE,
            location: 'Building A, 2nd Floor'
        });
        // 2. Seed Categories
        console.log('Seeding asset categories...');
        const laptopsCat = await AssetCategory_1.AssetCategory.create({
            name: 'Laptops',
            description: 'Corporate workstation notebooks',
            icon: 'laptop',
            customFields: [
                { name: 'RAM', type: 'STRING', required: true },
                { name: 'Storage', type: 'STRING', required: true },
                { name: 'Processor', type: 'STRING', required: true }
            ],
            maintenanceInterval: 180, // 6 months
            status: AssetCategory_1.CategoryStatus.ACTIVE
        });
        const furnitureCat = await AssetCategory_1.AssetCategory.create({
            name: 'Office Furniture',
            description: 'Desks, chairs, and conference setups',
            icon: 'armchair',
            customFields: [
                { name: 'Material', type: 'STRING', required: false }
            ],
            maintenanceInterval: 360, // 1 year
            status: AssetCategory_1.CategoryStatus.ACTIVE
        });
        // 3. Seed Users (Admin & Employees)
        console.log('Seeding users...');
        const adminUser = await User_1.User.create({
            employeeId: 'EMP-0001',
            firstName: 'System',
            lastName: 'Administrator',
            email: 'admin@assetflow.com',
            password: defaultPasswordHash,
            phone: '+15550100',
            role: User_1.UserRole.ADMIN,
            status: User_1.UserStatus.ACTIVE,
            isEmailVerified: true
        });
        const managerUser = await User_1.User.create({
            employeeId: 'EMP-0002',
            firstName: 'John',
            lastName: 'Manager',
            email: 'manager@assetflow.com',
            password: defaultPasswordHash,
            phone: '+15550101',
            department: itDept._id,
            role: User_1.UserRole.ASSET_MANAGER,
            status: User_1.UserStatus.ACTIVE,
            isEmailVerified: true,
            createdBy: adminUser._id
        });
        // Set manager as head of IT
        itDept.departmentHead = managerUser._id;
        await itDept.save();
        const employeeUser = await User_1.User.create({
            employeeId: 'EMP-0003',
            firstName: 'Sarah',
            lastName: 'Connor',
            email: 'sarah@assetflow.com',
            password: defaultPasswordHash,
            phone: '+15550102',
            department: hrDept._id,
            role: User_1.UserRole.EMPLOYEE,
            status: User_1.UserStatus.ACTIVE,
            isEmailVerified: true,
            createdBy: adminUser._id
        });
        // 4. Seed Assets
        console.log('Seeding assets...');
        const laptop1 = await Asset_1.Asset.create({
            assetTag: 'AST-LP-001',
            name: 'MacBook Pro 16"',
            serialNumber: 'C02F18X0MD6R',
            category: laptopsCat._id,
            department: itDept._id,
            currentHolder: managerUser._id,
            location: 'IT Lab desk 4',
            condition: Asset_1.AssetCondition.EXCELLENT,
            purchaseDate: new Date('2025-01-10'),
            warrantyExpiry: new Date('2028-01-10'),
            purchasePrice: 2499,
            vendor: 'Apple Business',
            bookable: true,
            status: Asset_1.AssetStatus.ALLOCATED,
            createdBy: adminUser._id
        });
        const laptop2 = await Asset_1.Asset.create({
            assetTag: 'AST-LP-002',
            name: 'ThinkPad X1 Carbon',
            serialNumber: 'L3N8Z1904',
            category: laptopsCat._id,
            department: hrDept._id,
            currentHolder: employeeUser._id,
            location: 'HR Office',
            condition: Asset_1.AssetCondition.GOOD,
            purchaseDate: new Date('2025-02-15'),
            warrantyExpiry: new Date('2027-02-15'),
            purchasePrice: 1699,
            vendor: 'Lenovo Enterprise',
            bookable: false,
            status: Asset_1.AssetStatus.ALLOCATED,
            createdBy: adminUser._id
        });
        const chair1 = await Asset_1.Asset.create({
            assetTag: 'AST-FN-001',
            name: 'Herman Miller Aeron Chair',
            serialNumber: 'HM-AERON-8821',
            category: furnitureCat._id,
            department: hrDept._id,
            condition: Asset_1.AssetCondition.EXCELLENT,
            purchaseDate: new Date('2025-03-01'),
            warrantyExpiry: new Date('2037-03-01'),
            purchasePrice: 1200,
            vendor: 'Herman Miller Shop',
            bookable: true,
            status: Asset_1.AssetStatus.AVAILABLE,
            createdBy: adminUser._id
        });
        // 5. Seed Bookings
        console.log('Seeding bookings...');
        const booking1 = await Booking_1.Booking.create({
            resource: laptop1._id,
            bookedBy: employeeUser._id,
            department: hrDept._id,
            startTime: new Date(Date.now() + 3600000 * 2), // 2 hours from now
            endTime: new Date(Date.now() + 3600000 * 4), // 4 hours from now
            purpose: 'Customer demonstration deployment',
            status: Booking_1.BookingStatus.UPCOMING
        });
        // 6. Seed Maintenance Request
        console.log('Seeding maintenance requests...');
        await MaintenanceRequest_1.MaintenanceRequest.create({
            asset: laptop2._id,
            raisedBy: employeeUser._id,
            priority: MaintenanceRequest_1.MaintenancePriority.HIGH,
            issue: 'Keyboard keys stick and screen flicker under heavy CPU loads',
            approvalStatus: MaintenanceRequest_1.MaintenanceStatus.PENDING
        });
        // 7. Seed Audit
        console.log('Seeding audit cycle...');
        const auditCycle = await AuditCycle_1.AuditCycle.create({
            title: 'Q2 2026 Hardware Audit',
            department: itDept._id,
            location: 'Building A',
            auditors: [adminUser._id],
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
            status: AuditCycle_1.AuditCycleStatus.IN_PROGRESS
        });
        await AuditItem_1.AuditItem.create({
            auditCycle: auditCycle._id,
            asset: laptop1._id,
            auditor: adminUser._id,
            verificationStatus: AuditItem_1.AuditVerificationStatus.VERIFIED,
            remarks: 'Verified asset condition EXCELLENT'
        });
        // 8. Seed Notification
        console.log('Seeding notifications...');
        await Notification_1.Notification.create({
            receiver: employeeUser._id,
            title: 'Welcome to AssetFlow',
            message: 'Your employee profile has been configured. Let your manager know if details are incorrect.',
            type: Notification_1.NotificationType.SUCCESS,
            read: false
        });
        // 9. Seed Activity Log
        console.log('Seeding activity logs...');
        await ActivityLog_1.ActivityLog.create({
            user: adminUser._id,
            action: 'DATABASE_SEED',
            module: 'SYSTEM',
            newData: { message: 'Database initial values seeded successfully' },
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) seeder-script'
        });
        console.log('🎉 Database seeding completed successfully.');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from database.');
    }
}
seed();
