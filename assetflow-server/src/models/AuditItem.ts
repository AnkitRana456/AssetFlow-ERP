import { Schema, model, Document, Types } from 'mongoose';

export enum AuditVerificationStatus {
  VERIFIED = 'VERIFIED',
  MISSING = 'MISSING',
  DAMAGED = 'DAMAGED'
}

export interface IAuditItem extends Document {
  auditCycle: Types.ObjectId | any;
  asset: Types.ObjectId | any;
  auditor?: Types.ObjectId | any;
  verificationStatus: AuditVerificationStatus;
  remarks?: string;
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
      default: AuditVerificationStatus.VERIFIED,
      index: true
    },
    remarks: { type: String },
    verifiedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const AuditItem = model<IAuditItem>('AuditItem', AuditItemSchema);
export { AuditItemSchema };
