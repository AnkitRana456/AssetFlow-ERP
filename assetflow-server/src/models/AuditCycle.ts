import { Schema, model, Document, Types } from 'mongoose';

export enum AuditCycleStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface IAuditCycle extends Document {
  title: string;
  department?: Types.ObjectId | any;
  location?: string;
  auditors: Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  status: AuditCycleStatus;
  closedBy?: Types.ObjectId | any;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditCycleSchema = new Schema<IAuditCycle>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    location: { type: String },
    auditors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(AuditCycleStatus),
      default: AuditCycleStatus.DRAFT,
      index: true
    },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

export const AuditCycle = model<IAuditCycle>('AuditCycle', AuditCycleSchema);
export { AuditCycleSchema };
