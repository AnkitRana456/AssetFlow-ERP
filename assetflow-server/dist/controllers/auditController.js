"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudits = getAudits;
exports.getAuditById = getAuditById;
exports.createAudit = createAudit;
exports.startAudit = startAudit;
exports.verifyAssetItem = verifyAssetItem;
exports.bulkVerifyAssets = bulkVerifyAssets;
exports.getAuditReport = getAuditReport;
exports.closeAudit = closeAudit;
exports.getAuditDashboard = getAuditDashboard;
exports.getAuditAnalytics = getAuditAnalytics;
const AuditCycle_1 = require("../models/AuditCycle");
const AuditItem_1 = require("../models/AuditItem");
const Asset_1 = require("../models/Asset");
const User_1 = require("../models/User");
const Department_1 = require("../models/Department");
const ActivityLog_1 = require("../models/ActivityLog");
const Notification_1 = require("../models/Notification");
const qrVerificationService_1 = require("../services/qrVerificationService");
const auditReportGenerator_1 = require("../services/auditReportGenerator");
const socketService_1 = require("../socket/socketService");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Helper SMTP Email trigger
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@assetflow.com';
async function sendAuditNotificationEmail(email, subject, html) {
    try {
        const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
        const port = parseInt(process.env.EMAIL_PORT || '2525', 10);
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        let transporter;
        if (!user || !pass) {
            transporter = {
                sendMail: async (opts) => {
                    console.log(`✉️ [Audit Mail Simulation] To: ${opts.to} | Subject: ${opts.subject}`);
                }
            };
        }
        else {
            transporter = nodemailer_1.default.createTransport({ host, port, auth: { user, pass } });
        }
        await transporter.sendMail({
            from: EMAIL_FROM,
            to: email,
            subject,
            html
        });
    }
    catch (err) {
        console.error('Audit email failed:', err);
    }
}
/**
 * GET /api/audits
 * Retrieve list of audit campaigns
 */
async function getAudits(req, res, next) {
    try {
        const { search, status, department, auditor, priority, page = 1, limit = 10 } = req.query;
        const query = {};
        // Role filters
        if (req.user?.role === User_1.UserRole.DEPARTMENT_HEAD) {
            // Dept heads only see their department's audits
            const user = await User_1.User.findById(req.user.userId);
            if (user && user.department) {
                query.department = user.department;
            }
        }
        else if (req.user?.role === User_1.UserRole.EMPLOYEE) {
            // Employees can only see audits where they are assigned as auditor
            query.auditors = req.user.userId;
        }
        // Apply Filter Parameters
        if (status)
            query.status = status;
        if (department)
            query.department = department;
        if (auditor)
            query.auditors = auditor;
        if (priority)
            query.priority = priority;
        if (search) {
            query.title = new RegExp(search, 'i');
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [audits, total] = await Promise.all([
            AuditCycle_1.AuditCycle.find(query)
                .populate('department', 'name code')
                .populate('auditors', 'firstName lastName email role employeeId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            AuditCycle_1.AuditCycle.countDocuments(query)
        ]);
        res.status(200).json({
            audits,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                totalAudits: total
            }
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/audits/:id
 * Get details of a specific audit, including its checklist item counts
 */
async function getAuditById(req, res, next) {
    try {
        const { id } = req.params;
        const audit = await AuditCycle_1.AuditCycle.findById(id)
            .populate('department', 'name code')
            .populate('auditors', 'firstName lastName email employeeId avatar')
            .populate('closedBy', 'firstName lastName email');
        if (!audit) {
            res.status(404).json({ message: 'Audit cycle not found' });
            return;
        }
        // Load checklists items
        const items = await AuditItem_1.AuditItem.find({ auditCycle: id })
            .populate({
            path: 'asset',
            populate: { path: 'category department currentHolder' }
        })
            .populate('auditor', 'firstName lastName email employeeId');
        res.status(200).json({
            audit,
            items
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/audits
 * Create new Audit Campaign and dynamically map assets to check
 */
async function createAudit(req, res, next) {
    try {
        const { title, description, type, department, location, categories = [], assets = [], auditors, priority, startDate, endDate } = req.body;
        // Create Audit Cycle Record
        const auditCycle = await AuditCycle_1.AuditCycle.create({
            title,
            description,
            type,
            department: department || undefined,
            location: location || undefined,
            categories: categories.length > 0 ? categories : undefined,
            assets: assets.length > 0 ? assets : undefined,
            auditors,
            priority: priority || AuditCycle_1.AuditPriority.MEDIUM,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: AuditCycle_1.AuditCycleStatus.DRAFT
        });
        // Resolve Target Assets in Scope
        const assetQuery = { deletedAt: null };
        switch (type) {
            case AuditCycle_1.AuditCycleType.DEPARTMENT:
                assetQuery.department = department;
                break;
            case AuditCycle_1.AuditCycleType.LOCATION:
                assetQuery.location = new RegExp(location, 'i');
                break;
            case AuditCycle_1.AuditCycleType.CATEGORY:
                assetQuery.category = { $in: categories };
                break;
            case AuditCycle_1.AuditCycleType.RANDOM_SAMPLING:
                // Query all and random slice later
                break;
            case AuditCycle_1.AuditCycleType.FULL_ORG:
            default:
                // No extra filters
                break;
        }
        // Fetch Matching Assets
        let targetAssets = await Asset_1.Asset.find(assetQuery).select('_id');
        if (type === AuditCycle_1.AuditCycleType.RANDOM_SAMPLING) {
            // Randomly select 20% of items, min 5 (or total available if less)
            const sampleSize = Math.max(5, Math.round(targetAssets.length * 0.2));
            const shuffled = [...targetAssets].sort(() => 0.5 - Math.random());
            targetAssets = shuffled.slice(0, sampleSize);
        }
        // Populate AuditItems list as PENDING
        const auditItemsPayload = targetAssets.map(asset => ({
            auditCycle: auditCycle._id,
            asset: asset._id,
            verificationStatus: AuditItem_1.AuditVerificationStatus.PENDING,
            discrepancyType: AuditItem_1.DiscrepancyType.NONE,
            isUnexpected: false
        }));
        if (auditItemsPayload.length > 0) {
            await AuditItem_1.AuditItem.insertMany(auditItemsPayload);
        }
        // Logs & Notifications
        await ActivityLog_1.ActivityLog.create({
            user: req.user?.userId,
            action: 'AUDIT_CREATE',
            module: 'AUDITING',
            entityId: auditCycle._id.toString(),
            newData: { title, type, itemsCount: auditItemsPayload.length },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        // Notify assigned auditors
        for (const auditorId of auditors) {
            const auditor = await User_1.User.findById(auditorId);
            if (!auditor)
                continue;
            const notif = await Notification_1.Notification.create({
                receiver: auditor._id,
                title: 'New Audit Assigned',
                message: `You have been assigned as an auditor for campaign: "${title}".`,
                type: Notification_1.NotificationType.INFO,
                link: `/audit/${auditCycle._id}`
            });
            socketService_1.socketService.emitToUser(auditor._id.toString(), 'notification', notif);
            if (auditor.email) {
                await sendAuditNotificationEmail(auditor.email, `AssetFlow - Audit Assigned: ${title}`, `<p>Hello ${auditor.firstName},</p>
           <p>You have been assigned to perform physical verification audits for: <strong>${title}</strong>.</p>
           <p>Start Date: ${new Date(startDate).toLocaleDateString()}</p>
           <p>Please log in to the ERP workspace to review the checklist.</p>`);
            }
        }
        socketService_1.socketService.emitToAll('audit_update', { message: 'New audit cycle created' });
        res.status(201).json(auditCycle);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/audits/:id/start
 * Transition audit campaign status to IN_PROGRESS
 */
async function startAudit(req, res, next) {
    try {
        const { id } = req.params;
        const audit = await AuditCycle_1.AuditCycle.findById(id);
        if (!audit) {
            res.status(404).json({ message: 'Audit cycle not found' });
            return;
        }
        if (audit.status !== AuditCycle_1.AuditCycleStatus.DRAFT && audit.status !== AuditCycle_1.AuditCycleStatus.SCHEDULED) {
            res.status(400).json({ message: `Audit cannot be started. Current status: ${audit.status}` });
            return;
        }
        audit.status = AuditCycle_1.AuditCycleStatus.IN_PROGRESS;
        await audit.save();
        await ActivityLog_1.ActivityLog.create({
            user: req.user?.userId,
            action: 'AUDIT_START',
            module: 'AUDITING',
            entityId: audit._id.toString(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        socketService_1.socketService.emitToAll('audit_update', { message: 'Audit started', auditId: audit._id });
        res.status(200).json(audit);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/audits/:id/verify
 * Auditor verifies a single asset in the checklist
 */
async function verifyAssetItem(req, res, next) {
    try {
        const { id: auditCycleId } = req.params;
        const { assetId, scannedCode, verificationStatus, auditorNotes } = req.body;
        const audit = await AuditCycle_1.AuditCycle.findById(auditCycleId);
        if (!audit) {
            res.status(404).json({ message: 'Audit cycle not found' });
            return;
        }
        if (audit.status !== AuditCycle_1.AuditCycleStatus.IN_PROGRESS) {
            res.status(400).json({ message: 'Verification rejected. Audit is not currently IN_PROGRESS.' });
            return;
        }
        // Verify Auditor authorization
        const isAssigned = audit.auditors.some(a => a.toString() === req.user?.userId);
        if (req.user?.role !== User_1.UserRole.ADMIN && req.user?.role !== User_1.UserRole.ASSET_MANAGER && !isAssigned) {
            res.status(403).json({ message: 'Forbidden. You are not assigned to perform verifications for this audit.' });
            return;
        }
        let resolvedAsset = null;
        let computedDiscrepancy = AuditItem_1.DiscrepancyType.NONE;
        let isUnexpectedScan = false;
        // 1. Resolve Code scanning or direct item click
        if (scannedCode) {
            const scan = await qrVerificationService_1.QrVerificationService.verifyCode(scannedCode, auditCycleId);
            if (!scan) {
                res.status(404).json({ message: 'Scan Error: Scanned code does not match any registered asset.' });
                return;
            }
            resolvedAsset = scan.asset;
            computedDiscrepancy = scan.discrepancy;
        }
        else if (assetId) {
            resolvedAsset = await Asset_1.Asset.findById(assetId).populate('department category currentHolder');
            if (!resolvedAsset) {
                res.status(404).json({ message: 'Asset not found' });
                return;
            }
            // Compute manually selected item discrepancy
            if (audit.type === AuditCycle_1.AuditCycleType.DEPARTMENT && audit.department) {
                const assetDeptId = resolvedAsset.department?._id?.toString() || resolvedAsset.department?.toString();
                if (assetDeptId !== audit.department.toString()) {
                    computedDiscrepancy = AuditItem_1.DiscrepancyType.WRONG_DEPARTMENT;
                }
            }
            if (audit.type === AuditCycle_1.AuditCycleType.LOCATION && audit.location) {
                if (resolvedAsset.location && resolvedAsset.location.toLowerCase() !== audit.location.toLowerCase()) {
                    computedDiscrepancy = AuditItem_1.DiscrepancyType.WRONG_LOCATION;
                }
            }
        }
        // 2. Find if this asset is already part of the campaign scope
        let auditItem = await AuditItem_1.AuditItem.findOne({ auditCycle: auditCycleId, asset: resolvedAsset._id });
        if (!auditItem) {
            // Scanned an UNEXPECTED asset not originally scoped
            isUnexpectedScan = true;
            auditItem = new AuditItem_1.AuditItem({
                auditCycle: auditCycleId,
                asset: resolvedAsset._id,
                verificationStatus,
                discrepancyType: computedDiscrepancy,
                isUnexpected: true,
                auditor: req.user?.userId,
                auditorNotes: auditorNotes || 'Unexpected asset detected in scope during audit scanning.',
                verifiedAt: new Date()
            });
            await auditItem.save();
        }
        else {
            // Update existing checklist item
            auditItem.verificationStatus = verificationStatus;
            auditItem.discrepancyType = computedDiscrepancy;
            auditItem.auditor = req.user?.userId;
            auditItem.auditorNotes = auditorNotes;
            auditItem.verifiedAt = new Date();
            await auditItem.save();
        }
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: req.user?.userId,
            action: isUnexpectedScan ? 'AUDIT_VERIFY_UNEXPECTED' : 'AUDIT_VERIFY_ITEM',
            module: 'AUDITING',
            entityId: auditItem._id.toString(),
            newData: { assetTag: resolvedAsset.assetTag, status: verificationStatus, discrepancy: computedDiscrepancy },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        // Notify managers on discrepancies
        if (verificationStatus === AuditItem_1.AuditVerificationStatus.MISSING || verificationStatus === AuditItem_1.AuditVerificationStatus.DAMAGED) {
            const managers = await User_1.User.find({ role: { $in: [User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER] } });
            for (const mgr of managers) {
                const notif = await Notification_1.Notification.create({
                    receiver: mgr._id,
                    title: `Audit Alert: Asset ${verificationStatus}`,
                    message: `Asset "${resolvedAsset.name}" (${resolvedAsset.assetTag}) was marked as ${verificationStatus} during "${audit.title}".`,
                    type: Notification_1.NotificationType.WARNING,
                    link: `/audit/${auditCycleId}`
                });
                socketService_1.socketService.emitToUser(mgr._id.toString(), 'notification', notif);
            }
        }
        // Retrieve updated metrics counts for live updates
        const counts = await AuditItem_1.AuditItem.aggregate([
            { $match: { auditCycle: audit._id } },
            { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
        ]);
        socketService_1.socketService.emitToAll('verification_progress', {
            auditId: auditCycleId,
            counts,
            message: `Asset tag ${resolvedAsset.assetTag} verified.`
        });
        res.status(200).json(auditItem);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/audits/:id/bulk-verify
 * Perform bulk verifications on check lists
 */
async function bulkVerifyAssets(req, res, next) {
    try {
        const { id: auditCycleId } = req.params;
        const { itemIds, verificationStatus, auditorNotes } = req.body;
        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            res.status(400).json({ message: 'Array of item IDs is required.' });
            return;
        }
        const audit = await AuditCycle_1.AuditCycle.findById(auditCycleId);
        if (!audit) {
            res.status(404).json({ message: 'Audit cycle not found' });
            return;
        }
        if (audit.status !== AuditCycle_1.AuditCycleStatus.IN_PROGRESS) {
            res.status(400).json({ message: 'Audit must be IN_PROGRESS to perform verification.' });
            return;
        }
        // Update AuditItems
        await AuditItem_1.AuditItem.updateMany({ _id: { $in: itemIds }, auditCycle: auditCycleId }, {
            $set: {
                verificationStatus,
                auditor: req.user?.userId,
                auditorNotes: auditorNotes || 'Bulk verified by auditor.',
                verifiedAt: new Date()
            }
        });
        // Logging
        await ActivityLog_1.ActivityLog.create({
            user: req.user?.userId,
            action: 'AUDIT_BULK_VERIFY',
            module: 'AUDITING',
            entityId: auditCycleId,
            newData: { count: itemIds.length, status: verificationStatus },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        socketService_1.socketService.emitToAll('audit_update', { message: 'Bulk verifications registered', auditId: auditCycleId });
        res.status(200).json({ message: `Successfully verified ${itemIds.length} items.` });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/audits/:id/report
 * Retrieve discrepancy report breakdown JSON or CSV download streams
 */
async function getAuditReport(req, res, next) {
    try {
        const { id } = req.params;
        const { format } = req.query;
        if (format === 'csv') {
            const csv = await auditReportGenerator_1.AuditReportGenerator.generateCSV(id);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=Audit_Report_${id}.csv`);
            res.status(200).send(csv);
            return;
        }
        const report = await auditReportGenerator_1.AuditReportGenerator.generateReport(id);
        if (!report) {
            res.status(404).json({ message: 'Audit campaign not found' });
            return;
        }
        res.status(200).json(report);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/audits/:id/close
 * Close Audit and auto update matching asset records
 */
async function closeAudit(req, res, next) {
    try {
        const { id } = req.params;
        const { resolutionNotes } = req.body;
        const audit = await AuditCycle_1.AuditCycle.findById(id);
        if (!audit) {
            res.status(404).json({ message: 'Audit cycle not found' });
            return;
        }
        if (audit.status !== AuditCycle_1.AuditCycleStatus.IN_PROGRESS && audit.status !== AuditCycle_1.AuditCycleStatus.COMPLETED) {
            res.status(400).json({ message: `Audit cannot be closed. Current status: ${audit.status}` });
            return;
        }
        // Access control
        if (req.user?.role !== User_1.UserRole.ADMIN && req.user?.role !== User_1.UserRole.ASSET_MANAGER) {
            res.status(403).json({ message: 'Forbidden. Only administrators or asset managers can close audits.' });
            return;
        }
        // Transition Campaign Status
        audit.status = AuditCycle_1.AuditCycleStatus.CLOSED;
        audit.resolutionNotes = resolutionNotes;
        audit.closedBy = req.user?.userId;
        audit.closedAt = new Date();
        await audit.save();
        // 1. Fetch all items in campaign
        const items = await AuditItem_1.AuditItem.find({ auditCycle: id }).populate('asset');
        // 2. Propagate Status changes to core Assets
        let lostCount = 0;
        let damagedCount = 0;
        for (const item of items) {
            const asset = item.asset;
            if (!asset)
                continue;
            let changed = false;
            // Missing -> Lost
            if (item.verificationStatus === AuditItem_1.AuditVerificationStatus.MISSING) {
                asset.status = Asset_1.AssetStatus.LOST;
                changed = true;
                lostCount++;
            }
            // Damaged -> poor condition and under maintenance
            if (item.verificationStatus === AuditItem_1.AuditVerificationStatus.DAMAGED) {
                asset.condition = Asset_1.AssetCondition.POOR;
                asset.status = Asset_1.AssetStatus.UNDER_MAINTENANCE;
                changed = true;
                damagedCount++;
            }
            // Disposed -> disposed status
            if (item.verificationStatus === AuditItem_1.AuditVerificationStatus.DISPOSED) {
                asset.status = Asset_1.AssetStatus.DISPOSED;
                changed = true;
            }
            if (changed) {
                await asset.save();
            }
        }
        // Log Activity
        await ActivityLog_1.ActivityLog.create({
            user: req.user?.userId,
            action: 'AUDIT_CLOSE',
            module: 'AUDITING',
            entityId: audit._id.toString(),
            newData: { lostAssetsUpdated: lostCount, damagedAssetsUpdated: damagedCount, resolutionNotes },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        // Notify participants and stakeholders
        const managersAndAuditors = new Set();
        audit.auditors.forEach(a => managersAndAuditors.add(a.toString()));
        // Add admins
        const admins = await User_1.User.find({ role: User_1.UserRole.ADMIN });
        admins.forEach(adm => managersAndAuditors.add(adm._id.toString()));
        for (const uId of managersAndAuditors) {
            const user = await User_1.User.findById(uId);
            if (!user)
                continue;
            const notif = await Notification_1.Notification.create({
                receiver: user._id,
                title: 'Audit Closed',
                message: `Audit Campaign "${audit.title}" has been reviewed and closed.`,
                type: Notification_1.NotificationType.SUCCESS,
                link: `/audit/${id}`
            });
            socketService_1.socketService.emitToUser(user._id.toString(), 'notification', notif);
            if (user.email) {
                await sendAuditNotificationEmail(user.email, `AssetFlow - Audit Closed: ${audit.title}`, `<p>Hello ${user.firstName},</p>
           <p>The audit campaign: <strong>${audit.title}</strong> has been closed.</p>
           <p>Resolution details: ${resolutionNotes}</p>`);
            }
        }
        socketService_1.socketService.emitToAll('audit_update', { message: 'Audit closed', auditId: audit._id });
        res.status(200).json({
            message: `Audit closed successfully. Updated ${lostCount} lost items and ${damagedCount} damaged items.`,
            audit
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/audits/dashboard
 * Return KPI block counters
 */
async function getAuditDashboard(req, res, next) {
    try {
        const totalAudits = await AuditCycle_1.AuditCycle.countDocuments({});
        const running = await AuditCycle_1.AuditCycle.countDocuments({ status: AuditCycle_1.AuditCycleStatus.IN_PROGRESS });
        const completed = await AuditCycle_1.AuditCycle.countDocuments({ status: AuditCycle_1.AuditCycleStatus.COMPLETED });
        const verifiedAssets = await AuditItem_1.AuditItem.countDocuments({ verificationStatus: AuditItem_1.AuditVerificationStatus.VERIFIED });
        const missingAssets = await AuditItem_1.AuditItem.countDocuments({ verificationStatus: AuditItem_1.AuditVerificationStatus.MISSING });
        const damagedAssets = await AuditItem_1.AuditItem.countDocuments({ verificationStatus: AuditItem_1.AuditVerificationStatus.DAMAGED });
        const pendingVerification = await AuditItem_1.AuditItem.countDocuments({ verificationStatus: AuditItem_1.AuditVerificationStatus.PENDING });
        res.status(200).json({
            totalAudits,
            running,
            completed,
            verifiedAssets,
            missingAssets,
            damagedAssets,
            pendingVerification
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/audits/analytics
 * Return aggregated structures formatted for Recharts
 */
async function getAuditAnalytics(req, res, next) {
    try {
        // 1. Compliance rates by department
        const depts = await Department_1.Department.find({ deletedAt: null });
        const complianceByDept = [];
        for (const dept of depts) {
            // Find audits in this department
            const cycles = await AuditCycle_1.AuditCycle.find({ department: dept._id });
            if (cycles.length === 0)
                continue;
            const cycleIds = cycles.map(c => c._id);
            const [totalItems, verifiedItems] = await Promise.all([
                AuditItem_1.AuditItem.countDocuments({ auditCycle: { $in: cycleIds }, isUnexpected: false }),
                AuditItem_1.AuditItem.countDocuments({ auditCycle: { $in: cycleIds }, verificationStatus: AuditItem_1.AuditVerificationStatus.VERIFIED })
            ]);
            const complianceRate = totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 100;
            complianceByDept.push({
                department: dept.code,
                Compliance: complianceRate
            });
        }
        // 2. Verified vs Missing vs Damaged Totals
        const missing = await AuditItem_1.AuditItem.countDocuments({ verificationStatus: AuditItem_1.AuditVerificationStatus.MISSING });
        const damaged = await AuditItem_1.AuditItem.countDocuments({ verificationStatus: AuditItem_1.AuditVerificationStatus.DAMAGED });
        const verified = await AuditItem_1.AuditItem.countDocuments({ verificationStatus: AuditItem_1.AuditVerificationStatus.VERIFIED });
        const statusTotals = [
            { name: 'Verified', value: verified, color: '#10b981' },
            { name: 'Missing', value: missing, color: '#ef4444' },
            { name: 'Damaged', value: damaged, color: '#f59e0b' }
        ];
        // 3. Last 6 Monthly audits count
        const monthlyAudits = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const count = await AuditCycle_1.AuditCycle.countDocuments({
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });
            monthlyAudits.push({
                month: monthStart.toLocaleString('default', { month: 'short' }),
                Audits: count
            });
        }
        res.status(200).json({
            complianceByDept,
            statusTotals,
            monthlyAudits
        });
    }
    catch (error) {
        next(error);
    }
}
