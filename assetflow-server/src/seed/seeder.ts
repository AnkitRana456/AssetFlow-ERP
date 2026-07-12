import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, UserRole, UserStatus } from '../models/User';
import { Department, DepartmentStatus } from '../models/Department';
import { AssetCategory, CategoryStatus } from '../models/AssetCategory';
import { Asset, AssetCondition, AssetStatus } from '../models/Asset';
import { Booking, BookingStatus } from '../models/Booking';
import { MaintenanceRequest, MaintenancePriority, MaintenanceStatus } from '../models/MaintenanceRequest';
import { AuditCycle, AuditCycleStatus, AuditCycleType, AuditPriority } from '../models/AuditCycle';
import { AuditItem, AuditVerificationStatus } from '../models/AuditItem';
import { Notification, NotificationType } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { RefreshToken } from '../models/RefreshToken';
import { hashPassword } from '../utils/passwordUtil';


dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow';

async function seed() {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('Connected to database.');

    // Clear all collections
    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      AssetCategory.deleteMany({}),
      Asset.deleteMany({}),
      Booking.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      AuditCycle.deleteMany({}),
      AuditItem.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
      RefreshToken.deleteMany({})
    ]);
    console.log('Collections cleared.');

    const defaultPasswordHash = await hashPassword('Password@123');

    // 1. Seed Departments
    console.log('Seeding departments...');
    const itDept = await Department.create({
      name: 'Information Technology',
      code: 'IT',
      description: 'IT Systems and Infrastructure Support',
      status: DepartmentStatus.ACTIVE,
      location: 'Building A, 3rd Floor'
    });

    const hrDept = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      description: 'Employee relations and recruitment',
      status: DepartmentStatus.ACTIVE,
      location: 'Building B, 1st Floor'
    });

    const finDept = await Department.create({
      name: 'Finance',
      code: 'FIN',
      description: 'Accounts and corporate finances',
      status: DepartmentStatus.ACTIVE,
      location: 'Building A, 2nd Floor'
    });

    // 2. Seed Categories
    console.log('Seeding asset categories...');
    const laptopsCat = await AssetCategory.create({
      name: 'Laptops',
      description: 'Corporate workstation notebooks',
      icon: 'laptop',
      customFields: [
        { name: 'RAM', type: 'STRING', required: true },
        { name: 'Storage', type: 'STRING', required: true },
        { name: 'Processor', type: 'STRING', required: true }
      ],
      maintenanceInterval: 180, // 6 months
      status: CategoryStatus.ACTIVE
    });

    const furnitureCat = await AssetCategory.create({
      name: 'Office Furniture',
      description: 'Desks, chairs, and conference setups',
      icon: 'armchair',
      customFields: [
        { name: 'Material', type: 'STRING', required: false }
      ],
      maintenanceInterval: 360, // 1 year
      status: CategoryStatus.ACTIVE
    });

    // 3. Seed Users (Admin & Employees)
    console.log('Seeding users...');
    const adminUser = await User.create({
      employeeId: 'EMP-0001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@assetflow.com',
      password: defaultPasswordHash,
      phone: '+15550100',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true
    });

    const managerUser = await User.create({
      employeeId: 'EMP-0002',
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@assetflow.com',
      password: defaultPasswordHash,
      phone: '+15550101',
      department: itDept._id,
      role: UserRole.ASSET_MANAGER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      createdBy: adminUser._id
    });

    // Set manager as head of IT
    itDept.departmentHead = managerUser._id;
    await itDept.save();

    const employeeUser = await User.create({
      employeeId: 'EMP-0003',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@assetflow.com',
      password: defaultPasswordHash,
      phone: '+15550102',
      department: hrDept._id,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      createdBy: adminUser._id
    });

    // 4. Seed Assets
    console.log('Seeding assets...');
    const laptop1 = await Asset.create({
      assetTag: 'AST-LP-001',
      name: 'MacBook Pro 16"',
      serialNumber: 'C02F18X0MD6R',
      category: laptopsCat._id,
      department: itDept._id,
      currentHolder: managerUser._id,
      location: 'IT Lab desk 4',
      condition: AssetCondition.EXCELLENT,
      purchaseDate: new Date('2025-01-10'),
      warrantyExpiry: new Date('2028-01-10'),
      purchasePrice: 2499,
      vendor: 'Apple Business',
      bookable: true,
      status: AssetStatus.ALLOCATED,
      createdBy: adminUser._id
    });

    const laptop2 = await Asset.create({
      assetTag: 'AST-LP-002',
      name: 'ThinkPad X1 Carbon',
      serialNumber: 'L3N8Z1904',
      category: laptopsCat._id,
      department: hrDept._id,
      currentHolder: employeeUser._id,
      location: 'HR Office',
      condition: AssetCondition.GOOD,
      purchaseDate: new Date('2025-02-15'),
      warrantyExpiry: new Date('2027-02-15'),
      purchasePrice: 1699,
      vendor: 'Lenovo Enterprise',
      bookable: false,
      status: AssetStatus.ALLOCATED,
      createdBy: adminUser._id
    });

    const chair1 = await Asset.create({
      assetTag: 'AST-FN-001',
      name: 'Herman Miller Aeron Chair',
      serialNumber: 'HM-AERON-8821',
      category: furnitureCat._id,
      department: hrDept._id,
      condition: AssetCondition.EXCELLENT,
      purchaseDate: new Date('2025-03-01'),
      warrantyExpiry: new Date('2037-03-01'),
      purchasePrice: 1200,
      vendor: 'Herman Miller Shop',
      bookable: true,
      status: AssetStatus.AVAILABLE,
      createdBy: adminUser._id
    });

    // 5. Seed Bookings
    console.log('Seeding bookings...');
    const booking1 = await Booking.create({
      title: 'Customer demonstration deployment',
      resource: laptop1._id,
      bookedBy: employeeUser._id,
      department: hrDept._id,
      startTime: new Date(Date.now() + 3600000 * 2), // 2 hours from now
      endTime: new Date(Date.now() + 3600000 * 4), // 4 hours from now
      date: new Date(Date.now() + 3600000 * 2),
      status: BookingStatus.UPCOMING
    });


    // 6. Seed Maintenance Request
    console.log('Seeding maintenance requests...');
    await MaintenanceRequest.create({
      asset: laptop2._id,
      raisedBy: employeeUser._id,
      priority: MaintenancePriority.HIGH,
      issue: 'Keyboard keys stick and screen flicker under heavy CPU loads',
      approvalStatus: MaintenanceStatus.PENDING
    });

    // 7. Seed Audit
    console.log('Seeding audit cycle...');
    const auditCycle = await AuditCycle.create({
      title: 'Q2 2026 Hardware Audit',
      description: 'Audit campaign for IT equipment in Building A',
      type: AuditCycleType.DEPARTMENT,
      department: itDept._id,
      location: 'Building A',
      auditors: [adminUser._id],
      priority: AuditPriority.MEDIUM,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
      status: AuditCycleStatus.IN_PROGRESS
    });

    await AuditItem.create({
      auditCycle: auditCycle._id,
      asset: laptop1._id,
      auditor: adminUser._id,
      verificationStatus: AuditVerificationStatus.VERIFIED,
      auditorNotes: 'Verified asset condition EXCELLENT'
    });


    // 8. Seed Notification
    console.log('Seeding notifications...');
    await Notification.create({
      receiver: employeeUser._id,
      title: 'Welcome to AssetFlow',
      message: 'Your employee profile has been configured. Let your manager know if details are incorrect.',
      type: NotificationType.SUCCESS,
      read: false
    });

    // 9. Seed Activity Log
    console.log('Seeding activity logs...');
    await ActivityLog.create({
      user: adminUser._id,
      action: 'DATABASE_SEED',
      module: 'SYSTEM',
      newData: { message: 'Database initial values seeded successfully' },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) seeder-script'
    });

    console.log('🎉 Database seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

seed();
