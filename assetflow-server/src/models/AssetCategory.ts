import { Schema, model, Document, Types } from 'mongoose';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface ICustomFieldDef {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  required: boolean;
}

export interface IAssetCategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  customFields: ICustomFieldDef[];
  maintenanceInterval: number; // in days, e.g. 90 days
  status: CategoryStatus;
  createdBy?: Types.ObjectId | any;
  updatedBy?: Types.ObjectId | any;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | any;
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldDefSchema = new Schema<ICustomFieldDef>({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'],
    required: true
  },
  required: { type: Boolean, default: false }
}, { _id: false });

const AssetCategorySchema = new Schema<IAssetCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String },
    icon: { type: String, default: 'package' },
    customFields: [CustomFieldDefSchema],
    maintenanceInterval: { type: Number, default: 90 },
    status: {
      type: String,
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.ACTIVE
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Soft Delete Middleware (Query hooks)
AssetCategorySchema.pre(/^find/, function (this: any, next: any) {
  const query = this;
  if (query.getFilter().deletedAt === undefined) {
    query.where({ deletedAt: null });
  }
  next();
});

export const AssetCategory = model<IAssetCategory>('AssetCategory', AssetCategorySchema);
export { AssetCategorySchema };
