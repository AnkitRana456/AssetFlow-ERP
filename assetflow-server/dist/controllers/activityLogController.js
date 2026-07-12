"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = getActivityLogs;
const ActivityLog_1 = require("../models/ActivityLog");
async function getActivityLogs(req, res, next) {
    try {
        const { search, module: moduleFilter, action, user: userFilter, startDate, endDate, format, page = 1, limit = 20 } = req.query;
        const query = {};
        if (moduleFilter)
            query.module = moduleFilter;
        if (action)
            query.action = action;
        if (userFilter)
            query.user = userFilter;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        if (search) {
            query.$or = [
                { action: new RegExp(search, 'i') },
                { module: new RegExp(search, 'i') },
                { entityId: new RegExp(search, 'i') }
            ];
        }
        // CSV format trigger
        if (format === 'csv') {
            const logs = await ActivityLog_1.ActivityLog.find(query)
                .populate('user', 'firstName lastName email role')
                .sort({ createdAt: -1 });
            const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Entity ID', 'IP Address', 'User Agent'];
            const rows = logs.map((log) => {
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
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [logs, total] = await Promise.all([
            ActivityLog_1.ActivityLog.find(query)
                .populate('user', 'firstName lastName email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            ActivityLog_1.ActivityLog.countDocuments(query)
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
    }
    catch (error) {
        next(error);
    }
}
