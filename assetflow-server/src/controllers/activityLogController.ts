import { Request, Response, NextFunction } from 'express';
import { ActivityLog } from '../models/ActivityLog';

export async function getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, module: moduleFilter, action, user: userFilter, startDate, endDate, format, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (moduleFilter) query.module = moduleFilter;
    if (action) query.action = action;
    if (userFilter) query.user = userFilter;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    if (search) {
      query.$or = [
        { action: new RegExp(search as string, 'i') },
        { module: new RegExp(search as string, 'i') },
        { entityId: new RegExp(search as string, 'i') }
      ];
    }

    // CSV format trigger
    if (format === 'csv') {
      const logs = await ActivityLog.find(query)
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: -1 });

      const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Entity ID', 'IP Address', 'User Agent'];
      const rows = logs.map((log: any) => {
        const u = log.user || {};
        return [
          new Date(log.createdAt).toLocaleString(),
          u.firstName ? `${u.firstName} ${u.lastName}` : 'System',
          u.role || 'SYSTEM',
          log.action,
          log.module,
          log.entityId || 'N/A',
          log.ipAddress || 'N/A',
          `"${(log.userAgent || '').replace(/"/g, '""')}"`
        ];
      });

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Audit_Trail_${Date.now()}.csv`);
      res.status(200).send(csv);
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ActivityLog.countDocuments(query)
    ]);

    res.status(200).json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalLogs: total
      }
    });
  } catch (error) {
    next(error);
  }
}
