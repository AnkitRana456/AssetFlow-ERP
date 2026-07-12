import { Schema, model, Document, Types } from 'mongoose';

export enum AuditCycleStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum AuditCycleType {
  FULL_ORG = 'FULL_ORG',
  DEPARTMENT = 'DEPARTMENT',
  LOCATION = 'LOCATION',
  CATEGORY = 'CATEGORY',
  RANDOM_SAMPLING = 'RANDOM_SAMPLING'
}

export enum AuditPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface IAuditCycle extends Document {
  title: string;
  description?: string;
  type: AuditCycleType;
  department?: Types.ObjectId | any;
  location?: string;
  categories?: Types.ObjectId[] | any[];
  assets?: Types.ObjectId[] | any[];
  auditors: Types.ObjectId[];
  priority: AuditPriority;
  startDate: Date;
  endDate: Date;
  status: AuditCycleStatus;
  resolutionNotes?: string;
  closedBy?: Types.ObjectId | any;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditCycleSchema = new Schema<IAuditCycle>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: Object.values(AuditCycleType),
      default: AuditCycleType.FULL_ORG,
      required: true,
      index: true
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    location: { type: String },
    categories: [{ type: Schema.Types.ObjectId, ref: 'AssetCategory' }],
    assets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
    auditors: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    priority: {
      type: String,
      enum: Object.values(AuditPriority),
      default: AuditPriority.MEDIUM
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(AuditCycleStatus),
      default: AuditCycleStatus.DRAFT,
      index: true
    },
    resolutionNotes: { type: String },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

export const AuditCycle = model<IAuditCycle>('AuditCycle', AuditCycleSchema);
export { AuditCycleSchema };

