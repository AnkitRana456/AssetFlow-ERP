"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.deleteNotification = deleteNotification;
exports.deleteAllNotifications = deleteAllNotifications;
const Notification_1 = require("../models/Notification");
async function getNotifications(req, res, next) {
    try {
        const receiverId = req.user?.userId;
        const { status, page = 1, limit = 20 } = req.query;
        const query = { receiver: receiverId };
        if (status === 'unread') {
            query.read = false;
        }
        else if (status === 'read') {
            query.read = true;
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [notifications, total, unreadCount] = await Promise.all([
            Notification_1.Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Notification_1.Notification.countDocuments(query),
            Notification_1.Notification.countDocuments({ receiver: receiverId, read: false })
        ]);
        res.status(200).json({
            notifications,
            unreadCount,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                totalNotifications: total
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function markAsRead(req, res, next) {
    try {
        const receiverId = req.user?.userId;
        const { ids } = req.body;
        const query = { receiver: receiverId };
        if (ids && Array.isArray(ids) && ids.length > 0) {
            query._id = { $in: ids };
        }
        await Notification_1.Notification.updateMany(query, { $set: { read: true } });
        res.status(200).json({ message: 'Notifications marked as read successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function deleteNotification(req, res, next) {
    try {
        const receiverId = req.user?.userId;
        const { id } = req.params;
        const result = await Notification_1.Notification.deleteOne({ _id: id, receiver: receiverId });
        if (result.deletedCount === 0) {
            res.status(404).json({ message: 'Notification not found or unauthorized' });
            return;
        }
        res.status(200).json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function deleteAllNotifications(req, res, next) {
    try {
        const receiverId = req.user?.userId;
        await Notification_1.Notification.deleteMany({ receiver: receiverId });
        res.status(200).json({ message: 'All notifications cleared successfully' });
    }
    catch (error) {
        next(error);
    }
}
