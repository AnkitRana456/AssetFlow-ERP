import { Schema, model, Document, Types } from 'mongoose';

export enum BookingStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface IBooking extends Document {
  resource: Types.ObjectId | any; // References Asset
  bookedBy: Types.ObjectId | any; // References User
  department?: Types.ObjectId | any; // References Department
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    resource: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    startTime: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(this: any, value: Date) {
          return value < this.endTime;
        },
        message: 'Start time must be before end time.'
      }
    },
    endTime: { type: Date, required: true },
    purpose: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.UPCOMING,
      index: true
    }
  },
  { timestamps: true }
);

// Pre-save Validation Hook to prevent overlapping bookings
BookingSchema.pre('save', async function (this: any) {
  const self = this;

  // Skip validation if the booking is cancelled
  if (self.status === BookingStatus.CANCELLED) {
    return;
  }

  // Overlap condition: (new_start < existing_end) AND (new_end > existing_start)
  const overlappingBooking = await model('Booking').findOne({
    resource: self.resource,
    status: { $ne: BookingStatus.CANCELLED },
    _id: { $ne: self._id }, // Exclude self if updating
    $or: [
      {
        startTime: { $lt: self.endTime },
        endTime: { $gt: self.startTime }
      }
    ]
  });

  if (overlappingBooking) {
    throw new Error('Overlapping booking error: The selected resource is already booked during this time interval.');
  }
});

export const Booking = model<IBooking>('Booking', BookingSchema);
export { BookingSchema };
