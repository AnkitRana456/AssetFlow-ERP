import { Schema, model, Document, Types } from 'mongoose';
import { AssetCondition } from './Asset';

export enum AllocationStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE'
}

export interface IAssetAllocationAttachment {
  name: string;
  url: string;
}

export interface IAssetAllocation extends Document {
  asset: Types.ObjectId | any;
  employee: Types.ObjectId | any;
  department: Types.ObjectId | any;
  allocatedBy: Types.ObjectId | any;
  allocatedDate: Date;
  expectedReturn?: Date;
  returnedDate?: Date;
  returnCondition?: AssetCondition;
  purpose?: string;
  notes?: string;
  attachments?: IAssetAllocationAttachment[];
  status: AllocationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AssetAllocationAttachmentSchema = new Schema<IAssetAllocationAttachment>({
  name: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const AssetAllocationSchema = new Schema<IAssetAllocation>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    allocatedDate: { type: Date, default: Date.now },
    expectedReturn: { type: Date },
    returnedDate: { type: Date },
    returnCondition: {
      type: String,
      enum: Object.values(AssetCondition)
    },
    purpose: { type: String, trim: true },
    notes: { type: String },
    attachments: { type: [AssetAllocationAttachmentSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(AllocationStatus),
      default: AllocationStatus.ACTIVE,
      index: true
    }
  },
  { timestamps: true }
);

export const AssetAllocation = model<IAssetAllocation>('AssetAllocation', AssetAllocationSchema);
export { AssetAllocationSchema };

