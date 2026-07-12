import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/Asset';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { MaintenanceRequest } from '../models/MaintenanceRequest';
import { AuditCycle } from '../models/AuditCycle';

export async function globalSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') {
      res.status(200).json({ assets: [], departments: [], employees: [], bookings: [], maintenance: [], audits: [] });
      return;
    }

    const regex = new RegExp(q.trim(), 'i');

    const [assets, departments, employees, bookings, maintenance, audits] = await Promise.all([
      Asset.find({ 
        $or: [
          { name: regex }, 
          { assetTag: regex }, 
          { serialNumber: regex }, 
          { location: regex }
        ], 
        deletedAt: null 
      }).limit(5),
      Department.find({ 
        $or: [
          { name: regex }, 
          { code: regex }
        ], 
        deletedAt: null 
      }).limit(5),
      User.find({ 
        $or: [
          { firstName: regex }, 
          { lastName: regex }, 
          { email: regex }, 
          { employeeId: regex }
        ] 
      }).select('-password').limit(5),
      Booking.find({ title: regex }).limit(5),
      MaintenanceRequest.find({ title: regex }).limit(5),
      AuditCycle.find({ title: regex }).limit(5)
    ]);

    res.status(200).json({
      assets,
      departments,
      employees,
      bookings,
      maintenance,
      audits
    });
  } catch (error) {
    next(error);
  }
}
