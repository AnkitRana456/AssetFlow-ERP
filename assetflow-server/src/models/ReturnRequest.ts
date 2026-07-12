import { Schema, model, Document, Types } from 'mongoose';

export enum ReturnRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ReturnCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  MINOR_DAMAGE = 'MINOR_DAMAGE',
  MAJOR_DAMAGE = 'MAJOR_DAMAGE',
  LOST = 'LOST'
}

export interface IReturnRequestAttachment {
  name: string;
  url: string;
}

export interface IReturnRequest extends Document {
  asset: Types.ObjectId | any;
  employee: Types.ObjectId | any;
  allocation: Types.ObjectId | any;
  returnNotes?: string;
  condition: ReturnCondition;
  photos?: IReturnRequestAttachment[];
  status: ReturnRequestStatus;
  reviewedBy?: Types.ObjectId | any;
  reviewedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnRequestAttachmentSchema = new Schema<IReturnRequestAttachment>({
  name: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const ReturnRequestSchema = new Schema<IReturnRequest>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    allocation: { type: Schema.Types.ObjectId, ref: 'AssetAllocation', required: true, index: true },
    returnNotes: { type: String },
    condition: {
      type: String,
      enum: Object.values(ReturnCondition),
      required: true
    },
    photos: { type: [ReturnRequestAttachmentSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(ReturnRequestStatus),
      default: ReturnRequestStatus.PENDING,
      index: true
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    remarks: { type: String }
  },
  { timestamps: true }
);

export const ReturnRequest = model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
export { ReturnRequestSchema };
