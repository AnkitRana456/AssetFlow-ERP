import { Schema, model, Document, Types } from 'mongoose';

export enum AuditVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  MISSING = 'MISSING',
  DAMAGED = 'DAMAGED',
  DISPOSED = 'DISPOSED',
  DUPLICATE = 'DUPLICATE'
}

export enum DiscrepancyType {
  WRONG_LOCATION = 'WRONG_LOCATION',
  WRONG_DEPARTMENT = 'WRONG_DEPARTMENT',
  WRONG_HOLDER = 'WRONG_HOLDER',
  NONE = 'NONE'
}

export interface IAuditItem extends Document {
  auditCycle: Types.ObjectId | any;
  asset: Types.ObjectId | any;
  auditor?: Types.ObjectId | any;
  verificationStatus: AuditVerificationStatus;
  discrepancyType: DiscrepancyType;
  isUnexpected: boolean;
  auditorNotes?: string;
  managerNotes?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditItemSchema = new Schema<IAuditItem>(
  {
    auditCycle: { type: Schema.Types.ObjectId, ref: 'AuditCycle', required: true, index: true },
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    auditor: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: {
      type: String,
      enum: Object.values(AuditVerificationStatus),
      default: AuditVerificationStatus.PENDING,
      index: true
    },
    discrepancyType: {
      type: String,
      enum: Object.values(DiscrepancyType),
      default: DiscrepancyType.NONE,
      index: true
    },
    isUnexpected: { type: Boolean, default: false, index: true },
    auditorNotes: { type: String, trim: true },
    managerNotes: { type: String, trim: true },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

export const AuditItem = model<IAuditItem>('AuditItem', AuditItemSchema);
export { AuditItemSchema };

