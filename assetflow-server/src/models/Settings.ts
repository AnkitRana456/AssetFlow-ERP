import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  orgName: string;
  brandLogoUrl?: string;
  theme: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  sessionTimeout: number; // in minutes
  language: string;
  timezone: string;
  passwordMinLength: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    orgName: { type: String, default: 'AssetFlow ERP', required: true, trim: true },
    brandLogoUrl: { type: String },
    theme: { type: String, default: 'INDIGO' },
    smtpHost: { type: String },
    smtpPort: { type: Number, default: 2525 },
    smtpUser: { type: String },
    smtpPass: { type: String },
    cloudinaryCloudName: { type: String },
    cloudinaryApiKey: { type: String },
    cloudinaryApiSecret: { type: String },
    sessionTimeout: { type: Number, default: 30 },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    passwordMinLength: { type: Number, default: 8 }
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', SettingsSchema);
export { SettingsSchema };
