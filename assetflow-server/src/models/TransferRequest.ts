import { Schema, model, Document, Types } from 'mongoose';

export enum TransferStatus {
  PENDING = 'PENDING',
  DEPARTMENT_APPROVED = 'DEPARTMENT_APPROVED',
  ASSET_MANAGER_APPROVED = 'ASSET_MANAGER_APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ITransferRequest extends Document {
  asset: Types.ObjectId | any;
  requestedBy: Types.ObjectId | any;
  fromEmployee?: Types.ObjectId | any;
  toEmployee: Types.ObjectId | any;
  toDepartment?: Types.ObjectId | any;
  reason: string;
  approvalStatus: TransferStatus;
  approvedBy?: Types.ObjectId | any;
  transferDate?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferRequestSchema = new Schema<ITransferRequest>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromEmployee: { type: Schema.Types.ObjectId, ref: 'User' },
    toEmployee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
    reason: { type: String, required: true },
    approvalStatus: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
      index: true
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    transferDate: { type: Date },
    remarks: { type: String }
  },
  { timestamps: true }
);

export const TransferRequest = model<ITransferRequest>('TransferRequest', TransferRequestSchema);
export { TransferRequestSchema };

