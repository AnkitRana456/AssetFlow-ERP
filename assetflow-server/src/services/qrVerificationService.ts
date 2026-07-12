import { Asset } from '../models/Asset';
import { AuditCycle, AuditCycleType } from '../models/AuditCycle';
import { DiscrepancyType } from '../models/AuditItem';

export interface IScanResult {
  asset: any;
  discrepancy: DiscrepancyType;
}

export class QrVerificationService {
  /**
   * Resolves a QR code, Barcode, or Asset Tag to an Asset and determines if it violates the Audit scope
   */
  static async verifyCode(
    scannedCode: string,
    auditCycleId: string
  ): Promise<IScanResult | null> {
    // 1. Find the Asset by QR Code, Barcode, or Asset Tag
    const asset = await Asset.findOne({
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
    const audit = await AuditCycle.findById(auditCycleId);
    if (!audit) {
      return { asset, discrepancy: DiscrepancyType.NONE };
    }

    let discrepancy = DiscrepancyType.NONE;

    // Check Department Mismatch
    if (audit.type === AuditCycleType.DEPARTMENT && audit.department) {
      const assetDeptId = asset.department?._id?.toString() || asset.department?.toString();
      const auditDeptId = audit.department?.toString();
      if (assetDeptId !== auditDeptId) {
        discrepancy = DiscrepancyType.WRONG_DEPARTMENT;
      }
    }

    // Check Location Mismatch
    if (audit.type === AuditCycleType.LOCATION && audit.location) {
      if (asset.location && asset.location.toLowerCase() !== audit.location.toLowerCase()) {
        discrepancy = DiscrepancyType.WRONG_LOCATION;
      }
    }

    return {
      asset,
      discrepancy
    };
  }
}
