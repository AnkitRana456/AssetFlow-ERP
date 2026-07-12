import { Schema, model, Document, Types } from 'mongoose';

export enum BookingStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum BookingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum RecurrencePattern {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface IBooking extends Document {
  title: string;
  resource: Types.ObjectId | any; // References Asset
  bookedBy: Types.ObjectId | any; // References User
  department: Types.ObjectId | any; // References Department
  participants?: Types.ObjectId[] | any[]; // References User
  startTime: Date;
  endTime: Date;
  date: Date;
  priority: BookingPriority;
  remarks?: string;
  attachment?: string;
  status: BookingStatus;
  
  // Cancellation details
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId | any;
  cancelledAt?: Date;

  // Recurring details
  isRecurring: boolean;
  recurringGroupId?: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    title: { type: String, required: true, trim: true },
    resource: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startTime: { 
      type: Date, 
      required: true,
      index: true
    },
    endTime: { 
      type: Date, 
      required: true,
      index: true
    },
    date: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: Object.values(BookingPriority),
      default: BookingPriority.MEDIUM
    },
    remarks: { type: String, trim: true },
    attachment: { type: String },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.UPCOMING,
      index: true
    },
    cancellationReason: { type: String },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    isRecurring: { type: Boolean, default: false, index: true },
    recurringGroupId: { type: String, index: true },
    recurrencePattern: {
      type: String,
      enum: Object.values(RecurrencePattern),
      required: function(this: any) { return this.isRecurring; }
    },
    recurrenceUntil: { type: Date }
  },
  { timestamps: true }
);

// Optimize booking calendar query intervals and resource conflict validation
BookingSchema.index({ resource: 1, startTime: 1, endTime: 1, status: 1 });


export const Booking = model<IBooking>('Booking', BookingSchema);
export { BookingSchema };

