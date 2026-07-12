import cron from 'node-cron';
import { Asset, AssetStatus } from '../models/Asset';
import { AssetAllocation } from '../models/AssetAllocation';
import { MaintenanceRequest } from '../models/MaintenanceRequest';
import { Notification, NotificationType } from '../models/Notification';
import { User, UserRole } from '../models/User';
import { socketService } from '../socket/socketService';
import nodemailer from 'nodemailer';

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@assetflow.com';

async function sendAlertEmail(email: string, subject: string, html: string) {
  try {
    const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
    const port = parseInt(process.env.EMAIL_PORT || '2525', 10);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.log(`✉️ [Smart Alert Mail Simulation] To: ${email} | Subject: ${subject}`);
      return;
    }

    const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject,
      html
    });
  } catch (err) {
    console.error('Smart Alert email failed:', err);
  }
}

export const startSmartAlertsJob = () => {
  // Run daily at midnight: 0 0 * * *
  // For demonstration/testing purposes, we can also run every hour: 0 * * * *
  // Let's set it to run daily.
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running Daily Smart Alerts & Compliance Scanner Job...');
    try {
      const now = new Date();

      // Find Admins & Managers for notifications
      const managers = await User.find({ role: { $in: [UserRole.ADMIN, UserRole.ASSET_MANAGER] } });

      // ----------------------------------------------------
      // 1. Scan for Overdue Custody Assets
      // ----------------------------------------------------
      const overdueAllocations = await AssetAllocation.find({
        status: 'ACTIVE',
        expectedReturn: { $lt: now }
      } as any).populate('asset employee');


      for (const alloc of overdueAllocations as any[]) {
        const employee = alloc.employee;
        const asset = alloc.asset;
        if (!employee || !asset) continue;

        // Prevent duplicate spam - check if already sent in last 24h
        const title = 'Asset Return Overdue Alert';
        const message = `Your assigned asset "${asset.name}" (${asset.assetTag}) was scheduled for return on ${new Date(alloc.expectedReturn).toLocaleDateString()}. Please return it to inventory.`;
        
        const existingNotif = await Notification.findOne({
          receiver: employee._id,
          title,
          createdAt: { $gte: new Date(Date.now() - 86400000) }
        });

        if (!existingNotif) {
          // Notify Employee
          const empNotif = await Notification.create({
            receiver: employee._id,
            title,
            message,
            type: NotificationType.WARNING,
            link: `/assets/${asset._id}`
          });
          socketService.emitToUser(employee._id.toString(), 'notification', empNotif);

          // Email Employee
          if (employee.email) {
            await sendAlertEmail(
              employee.email,
              `AssetFlow Alert: Overdue Return - ${asset.name}`,
              `<p>Hello ${employee.firstName},</p>
               <p>This is an automated system reminder that the following asset assigned to you is overdue for return:</p>
               <ul>
                 <li><strong>Asset:</strong> ${asset.name} (${asset.assetTag})</li>
                 <li><strong>Due Date:</strong> ${new Date(alloc.expectedReturn).toLocaleDateString()}</li>
               </ul>
               <p>Please return the equipment to your department coordinator as soon as possible.</p>`
            );
          }

          // Notify Managers
          for (const mgr of managers) {
            const mgrNotif = await Notification.create({
              receiver: mgr._id,
              title: `Overdue Return Alert: ${employee.firstName} ${employee.lastName}`,
              message: `Employee ${employee.firstName} ${employee.lastName} is overdue returning "${asset.name}" (Due: ${new Date(alloc.expectedReturn).toLocaleDateString()}).`,
              type: NotificationType.WARNING,
              link: `/allocations/${alloc._id}`
            });
            socketService.emitToUser(mgr._id.toString(), 'notification', mgrNotif);
          }
        }
      }

      // ----------------------------------------------------
      // 2. Scan for Expiring Warranties (In next 30 days)
      // ----------------------------------------------------
      const thirtyDaysFromNow = new Date(Date.now() + 86400000 * 30);
      const expiringAssets = await Asset.find({
        deletedAt: null,
        warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow }
      });

      for (const asset of expiringAssets as any[]) {
        const title = 'Warranty Expiring Soon';
        const message = `Asset "${asset.name}" (${asset.assetTag}) warranty expires on ${new Date(asset.warrantyExpiry).toLocaleDateString()}.`;

        const existingNotif = await Notification.findOne({
          receiver: managers[0]?._id,
          title,
          message,
          createdAt: { $gte: new Date(Date.now() - 86400000 * 7) } // Check last 7 days
        });

        if (!existingNotif) {
          for (const mgr of managers) {
            const mgrNotif = await Notification.create({
              receiver: mgr._id,
              title,
              message,
              type: NotificationType.INFO,
              link: `/assets/${asset._id}`
            });
            socketService.emitToUser(mgr._id.toString(), 'notification', mgrNotif);
          }
        }
      }

      // ----------------------------------------------------
      // 3. Scan for Idle Assets (Available but unused > 90 days)
      // ----------------------------------------------------
      const ninetyDaysAgo = new Date(Date.now() - 86400000 * 90);
      const idleAssets = await Asset.find({
        status: AssetStatus.AVAILABLE,
        createdAt: { $lt: ninetyDaysAgo },
        deletedAt: null
      });

      for (const asset of idleAssets as any[]) {
        // Check if there was any allocation or booking in last 90 days
        const lastAlloc = await AssetAllocation.findOne({
          asset: asset._id,
          createdAt: { $gte: ninetyDaysAgo }
        } as any);



        if (!lastAlloc) {
          const title = 'Idle Asset Alert';
          const message = `Asset "${asset.name}" (${asset.assetTag}) has been available but completely idle/unallocated for over 90 days.`;

          const existingNotif = await Notification.findOne({
            receiver: managers[0]?._id,
            title,
            createdAt: { $gte: new Date(Date.now() - 86400000 * 30) } // Check monthly
          });

          if (!existingNotif) {
            for (const mgr of managers) {
              const mgrNotif = await Notification.create({
                receiver: mgr._id,
                title,
                message,
                type: NotificationType.INFO,
                link: `/assets/${asset._id}`
              });
              socketService.emitToUser(mgr._id.toString(), 'notification', mgrNotif);
            }
          }
        }
      }

      // ----------------------------------------------------
      // 4. Scan for Frequent Repairs (>3 maintenance requests in last 6 months)
      // ----------------------------------------------------
      const sixMonthsAgo = new Date(Date.now() - 86400000 * 180);
      const repairFreq = await MaintenanceRequest.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: '$asset', count: { $sum: 1 } } },
        { $match: { count: { $gt: 3 } } }
      ]);

      for (const record of repairFreq) {
        const asset = await Asset.findById(record._id);
        if (!asset) continue;

        const title = 'Frequent Repair Warning';
        const message = `Asset "${asset.name}" (${asset.assetTag}) has required ${record.count} repairs in the last 6 months. Consider inspection or decommissioning.`;

        const existingNotif = await Notification.findOne({
          receiver: managers[0]?._id,
          title,
          createdAt: { $gte: new Date(Date.now() - 86400000 * 30) }
        });

        if (!existingNotif) {
          for (const mgr of managers) {
            const mgrNotif = await Notification.create({
              receiver: mgr._id,
              title,
              message,
              type: NotificationType.WARNING,
              link: `/assets/${asset._id}`
            });
            socketService.emitToUser(mgr._id.toString(), 'notification', mgrNotif);
          }
        }
      }

      console.log('✅ Daily Smart Alerts Scan completed successfully.');
    } catch (err) {
      console.error('❌ Smart Alerts Job Error:', err);
    }
  });
};
