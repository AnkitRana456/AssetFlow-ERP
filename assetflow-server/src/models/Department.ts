import { Schema, model, Document, Types } from 'mongoose';

export enum DepartmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  parentDepartment?: Types.ObjectId | IDepartment;
  departmentHead?: Types.ObjectId | any;
  status: DepartmentStatus;
  location?: string;
  createdBy?: Types.ObjectId | any;
  updatedBy?: Types.ObjectId | any;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | any;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String },
    parentDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
    departmentHead: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: Object.values(DepartmentStatus),
      default: DepartmentStatus.ACTIVE
    },
    location: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Soft Delete Middleware (Query hooks)
DepartmentSchema.pre(/^find/, function (this: any, next: any) {
  const query = this;
  if (query.getFilter().deletedAt === undefined) {
    query.where({ deletedAt: null });
  }
  next();
});

export const Department = model<IDepartment>('Department', DepartmentSchema);
