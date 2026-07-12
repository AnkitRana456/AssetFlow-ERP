import { Schema, model, Document, Types } from 'mongoose';

export interface IAssetHistory extends Document {
  asset: Types.ObjectId | any;
  action: string;
  performedBy: Types.ObjectId | any;
  details: string;
  allocation?: Types.ObjectId | any;
  transfer?: Types.ObjectId | any;
  returnRequest?: Types.ObjectId | any;
  createdAt: Date;
}

const AssetHistorySchema = new Schema<IAssetHistory>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    details: { type: String, required: true },
    allocation: { type: Schema.Types.ObjectId, ref: 'AssetAllocation' },
    transfer: { type: Schema.Types.ObjectId, ref: 'TransferRequest' },
    returnRequest: { type: Schema.Types.ObjectId, ref: 'ReturnRequest' }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } 
  }
);

export const AssetHistory = model<IAssetHistory>('AssetHistory', AssetHistorySchema);
export { AssetHistorySchema };
