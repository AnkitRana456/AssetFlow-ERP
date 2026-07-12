import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const receiverId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = { receiver: receiverId };
    if (status === 'unread') {
      query.read = false;
    } else if (status === 'read') {
      query.read = true;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(query),
      Notification.countDocuments({ receiver: receiverId, read: false })
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
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const receiverId = req.user?.userId;
    const { ids } = req.body;

    const query: any = { receiver: receiverId };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      query._id = { $in: ids };
    }

    await Notification.updateMany(query, { $set: { read: true } });

    res.status(200).json({ message: 'Notifications marked as read successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const receiverId = req.user?.userId;
    const { id } = req.params;

    const result = await Notification.deleteOne({ _id: id, receiver: receiverId });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Notification not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAllNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const receiverId = req.user?.userId;

    await Notification.deleteMany({ receiver: receiverId });

    res.status(200).json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    next(error);
  }
}
