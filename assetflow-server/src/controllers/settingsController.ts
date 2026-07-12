import { Request, Response, NextFunction } from 'express';
import { Settings } from '../models/Settings';
import { ActivityLog } from '../models/ActivityLog';
import { socketService } from '../socket/socketService';

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let settings = await Settings.findOne({});
    
    if (!settings) {
      // Upsert a default settings record if it doesn't exist
      settings = await Settings.create({
        orgName: 'AssetFlow ERP',
        theme: 'INDIGO',
        sessionTimeout: 30,
        language: 'en',
        timezone: 'UTC',
        passwordMinLength: 8
      });
    }

    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      orgName, 
      brandLogoUrl, 
      theme, 
      smtpHost, 
      smtpPort, 
      smtpUser, 
      smtpPass, 
      cloudinaryCloudName, 
      cloudinaryApiKey, 
      cloudinaryApiSecret, 
      sessionTimeout, 
      language, 
      timezone, 
      passwordMinLength 
    } = req.body;

    let settings = await Settings.findOne({});
    const oldData = settings ? settings.toObject() : {};

    if (!settings) {
      settings = new Settings({});
    }

    // Apply values
    settings.orgName = orgName ?? settings.orgName;
    settings.brandLogoUrl = brandLogoUrl ?? settings.brandLogoUrl;
    settings.theme = theme ?? settings.theme;
    settings.smtpHost = smtpHost ?? settings.smtpHost;
    settings.smtpPort = smtpPort ?? settings.smtpPort;
    settings.smtpUser = smtpUser ?? settings.smtpUser;
    settings.smtpPass = smtpPass ?? settings.smtpPass;
    settings.cloudinaryCloudName = cloudinaryCloudName ?? settings.cloudinaryCloudName;
    settings.cloudinaryApiKey = cloudinaryApiKey ?? settings.cloudinaryApiKey;
    settings.cloudinaryApiSecret = cloudinaryApiSecret ?? settings.cloudinaryApiSecret;
    settings.sessionTimeout = sessionTimeout ?? settings.sessionTimeout;
    settings.language = language ?? settings.language;
    settings.timezone = timezone ?? settings.timezone;
    settings.passwordMinLength = passwordMinLength ?? settings.passwordMinLength;

    await settings.save();

    // Log Activity
    await ActivityLog.create({
      user: req.user?.userId,
      action: 'SETTINGS_UPDATE',
      module: 'SETTINGS',
      oldData,
      newData: settings.toObject(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    socketService.emitToAll('settings_update', settings);

    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
}
