import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user?: Types.ObjectId | any;
  action: string;
  module: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true, index: true },
    entityId: { type: String },
    oldData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Optimize audit log dashboard historical queries and sort orders
ActivityLogSchema.index({ module: 1, action: 1, createdAt: -1 });


export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
export { ActivityLogSchema };
