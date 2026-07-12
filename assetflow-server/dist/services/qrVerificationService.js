"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrVerificationService = void 0;
const Asset_1 = require("../models/Asset");
const AuditCycle_1 = require("../models/AuditCycle");
const AuditItem_1 = require("../models/AuditItem");
class QrVerificationService {
    /**
     * Resolves a QR code, Barcode, or Asset Tag to an Asset and determines if it violates the Audit scope
     */
    static async verifyCode(scannedCode, auditCycleId) {
        // 1. Find the Asset by QR Code, Barcode, or Asset Tag
        const asset = await Asset_1.Asset.findOne({
            $or: [
                { qrCode: scannedCode },
                { barcode: scannedCode },
                { assetTag: scannedCode.toUpperCase() }
            ],
            deletedAt: null
        }).populate('department category currentHolder');
        if (!asset) {
            return null;
        }
        // 2. Fetch the Audit Cycle to compare scopes
        const audit = await AuditCycle_1.AuditCycle.findById(auditCycleId);
        if (!audit) {
            return { asset, discrepancy: AuditItem_1.DiscrepancyType.NONE };
        }
        let discrepancy = AuditItem_1.DiscrepancyType.NONE;
        // Check Department Mismatch
        if (audit.type === AuditCycle_1.AuditCycleType.DEPARTMENT && audit.department) {
            const assetDeptId = asset.department?._id?.toString() || asset.department?.toString();
            const auditDeptId = audit.department?.toString();
            if (assetDeptId !== auditDeptId) {
                discrepancy = AuditItem_1.DiscrepancyType.WRONG_DEPARTMENT;
            }
        }
        // Check Location Mismatch
        if (audit.type === AuditCycle_1.AuditCycleType.LOCATION && audit.location) {
            if (asset.location && asset.location.toLowerCase() !== audit.location.toLowerCase()) {
                discrepancy = AuditItem_1.DiscrepancyType.WRONG_LOCATION;
            }
        }
        return {
            asset,
            discrepancy
        };
    }
}
exports.QrVerificationService = QrVerificationService;
