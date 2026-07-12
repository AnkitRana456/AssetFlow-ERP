import { Schema, model, Document, Types } from 'mongoose';

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export interface IMaintenanceRequest extends Document {
  asset: Types.ObjectId | any;
  raisedBy: Types.ObjectId | any;
  priority: MaintenancePriority;
  issue: string;
  attachments: string[];
  approvalStatus: MaintenanceStatus;
  technician?: Types.ObjectId | any;
  startedAt?: Date;
  completedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    priority: {
      type: String,
      enum: Object.values(MaintenancePriority),
      default: MaintenancePriority.MEDIUM,
      index: true
    },
    issue: { type: String, required: true, trim: true },
    attachments: [{ type: String }],
    approvalStatus: {
      type: String,
      enum: Object.values(MaintenanceStatus),
      default: MaintenanceStatus.PENDING,
      index: true
    },
    technician: { type: Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date },
    completedAt: { type: Date },
    remarks: { type: String }
  },
  { timestamps: true }
);

export const MaintenanceRequest = model<IMaintenanceRequest>('MaintenanceRequest', MaintenanceRequestSchema);
export { MaintenanceRequestSchema };
