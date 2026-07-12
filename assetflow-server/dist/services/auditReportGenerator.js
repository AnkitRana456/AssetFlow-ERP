"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditReportGenerator = void 0;
const AuditItem_1 = require("../models/AuditItem");
const AuditCycle_1 = require("../models/AuditCycle");
class AuditReportGenerator {
    /**
     * Generates a structural breakdown of the audit cycle metrics and discrepancies
     */
    static async generateReport(auditCycleId) {
        const audit = await AuditCycle_1.AuditCycle.findById(auditCycleId)
            .populate('department')
            .populate('auditors', 'firstName lastName email');
        if (!audit)
            return null;
        const items = await AuditItem_1.AuditItem.find({ auditCycle: auditCycleId })
            .populate({
            path: 'asset',
            populate: { path: 'category department currentHolder' }
        })
            .populate('auditor', 'firstName lastName email');
        let totalInScope = 0;
        let verified = 0;
        let missing = 0;
        let damaged = 0;
        let duplicate = 0;
        let disposed = 0;
        let pending = 0;
        let unexpected = 0;
        const missingAssets = [];
        const damagedAssets = [];
        const unexpectedAssets = [];
        const wrongLocation = [];
        const wrongDepartment = [];
        const wrongHolder = [];
        items.forEach((item) => {
            // Exclude unexpected items from core scope count if they weren't in scope
            if (!item.isUnexpected) {
                totalInScope++;
            }
            else {
                unexpected++;
                unexpectedAssets.push(item);
            }
            switch (item.verificationStatus) {
                case AuditItem_1.AuditVerificationStatus.PENDING:
                    pending++;
                    break;
                case AuditItem_1.AuditVerificationStatus.VERIFIED:
                    verified++;
                    break;
                case AuditItem_1.AuditVerificationStatus.MISSING:
                    missing++;
                    missingAssets.push(item);
                    break;
                case AuditItem_1.AuditVerificationStatus.DAMAGED:
                    damaged++;
                    damagedAssets.push(item);
                    break;
                case AuditItem_1.AuditVerificationStatus.DUPLICATE:
                    duplicate++;
                    break;
                case AuditItem_1.AuditVerificationStatus.DISPOSED:
                    disposed++;
                    break;
            }
            // Track discrepancy classifications
            if (item.discrepancyType === AuditItem_1.DiscrepancyType.WRONG_LOCATION) {
                wrongLocation.push(item);
            }
            else if (item.discrepancyType === AuditItem_1.DiscrepancyType.WRONG_DEPARTMENT) {
                wrongDepartment.push(item);
            }
            else if (item.discrepancyType === AuditItem_1.DiscrepancyType.WRONG_HOLDER) {
                wrongHolder.push(item);
            }
        });
        const complianceRate = totalInScope > 0
            ? Math.round(((verified + damaged) / totalInScope) * 100)
            : 0;
        return {
            auditCycle: audit,
            totals: {
                totalInScope,
                verified,
                missing,
                damaged,
                duplicate,
                disposed,
                pending,
                unexpected,
                complianceRate
            },
            discrepancies: {
                missingAssets,
                damagedAssets,
                unexpectedAssets,
                wrongLocation,
                wrongDepartment,
                wrongHolder
            }
        };
    }
    /**
     * Generates a CSV formatted string of the audit items
     */
    static async generateCSV(auditCycleId) {
        const items = await AuditItem_1.AuditItem.find({ auditCycle: auditCycleId })
            .populate({
            path: 'asset',
            populate: { path: 'category department' }
        })
            .populate('auditor', 'firstName lastName');
        const headers = [
            'Asset Tag',
            'Asset Name',
            'Serial Number',
            'Category',
            'Status',
            'Discrepancy',
            'Audited By',
            'Audited Date',
            'Unexpected Scan',
            'Auditor Notes'
        ];
        const rows = items.map((item) => {
            const asset = item.asset || {};
            const auditor = item.auditor ? `${item.auditor.firstName} ${item.auditor.lastName}` : 'System';
            const date = item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : 'N/A';
            return [
                asset.assetTag || 'N/A',
                `"${(asset.name || 'Unknown').replace(/"/g, '""')}"`,
                asset.serialNumber || 'N/A',
                asset.category?.name || 'N/A',
                item.verificationStatus,
                item.discrepancyType,
                auditor,
                date,
                item.isUnexpected ? 'YES' : 'NO',
                `"${(item.auditorNotes || '').replace(/"/g, '""')}"`
            ];
        });
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        return csvContent;
    }
}
exports.AuditReportGenerator = AuditReportGenerator;
