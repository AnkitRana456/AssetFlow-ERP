import { Schema, model, Document, Types } from 'mongoose';

export enum AssetCondition {
  NEW = 'NEW',
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR'
}

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  ALLOCATED = 'ALLOCATED',
  RESERVED = 'RESERVED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  LOST = 'LOST',
  RETIRED = 'RETIRED',
  DISPOSED = 'DISPOSED'
}

export interface IAssetDocument {
  name: string;
  url: string;
}

export interface IAsset extends Document {
  assetTag: string;
  name: string;
  serialNumber: string;
  qrCode?: string;
  barcode?: string;
  category: Types.ObjectId | any;
  department?: Types.ObjectId | any;
  currentHolder?: Types.ObjectId | any;
  location?: string;
  condition: AssetCondition;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  purchasePrice?: number;
  vendor?: string;
  bookable: boolean;
  description?: string;
  status: AssetStatus;
  photo?: string;
  documents: IAssetDocument[];
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  retirementDate?: Date;
  createdBy?: Types.ObjectId | any;
  updatedBy?: Types.ObjectId | any;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | any;
  createdAt: Date;
  updatedAt: Date;
}

const AssetDocumentSchema = new Schema<IAssetDocument>({
  name: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const AssetSchema = new Schema<IAsset>(
  {
    assetTag: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    serialNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    qrCode: { type: String },
    barcode: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'AssetCategory', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    currentHolder: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    location: { type: String },
    condition: {
      type: String,
      enum: Object.values(AssetCondition),
      default: AssetCondition.NEW
    },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    vendor: { type: String },
    bookable: { type: Boolean, default: false },
    description: { type: String },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.AVAILABLE,
      index: true
    },
    photo: { type: String },
    documents: [AssetDocumentSchema],
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    retirementDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Soft Delete Middleware (Query hooks)
AssetSchema.pre(/^find/, function (this: any, next: any) {
  const query = this;
  if (query.getFilter().deletedAt === undefined) {
    query.where({ deletedAt: null });
  }
  next();
});

export const Asset = model<IAsset>('Asset', AssetSchema);
export { AssetSchema };
