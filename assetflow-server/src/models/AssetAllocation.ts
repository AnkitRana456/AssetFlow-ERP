import { Schema, model, Document, Types } from 'mongoose';
import { AssetCondition } from './Asset';

export enum AllocationStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE'
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
  notes?: string;
  status: AllocationStatus;
  createdAt: Date;
  updatedAt: Date;
}

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
    notes: { type: String },
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
