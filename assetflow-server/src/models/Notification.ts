import { Schema, model, Document, Types } from 'mongoose';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface INotification extends Document {
  receiver: Types.ObjectId | any;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.INFO,
      index: true
    },
    read: { type: Boolean, default: false, index: true },
    link: { type: String }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const Notification = model<INotification>('Notification', NotificationSchema);
export { NotificationSchema };
