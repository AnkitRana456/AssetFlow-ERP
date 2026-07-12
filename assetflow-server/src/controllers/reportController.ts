import { Request, Response, NextFunction } from 'express';
import { Asset, AssetStatus, AssetCondition } from '../models/Asset';
import { AssetAllocation } from '../models/AssetAllocation';
import { MaintenanceRequest } from '../models/MaintenanceRequest';
import { Booking } from '../models/Booking';

export async function getReportData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, format } = req.query;
    const now = new Date();

    let data: any[] = [];
    let headers: string[] = [];

    // Resolve Report type
    switch (type) {
      case 'utilization':
        data = await Asset.find({ deletedAt: null }).populate('category department').lean();
        headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Status', 'Condition', 'Purchase Cost'];
        data = data.map((a: any) => [
          a.assetTag || 'N/A',
          a.name || 'N/A',
          a.category?.name || 'N/A',
          a.department?.code || 'N/A',
          a.status || 'N/A',
          a.condition || 'N/A',
          a.purchaseCost || 0
        ]);
        break;

      case 'maintenance':
        data = await MaintenanceRequest.find({}).populate('asset department').lean();
        headers = ['Request Title', 'Asset Tag', 'Asset Name', 'Status', 'Priority', 'Cost', 'Completed Date'];
        data = data.map((m: any) => [
          m.title || 'N/A',
          m.asset?.assetTag || 'N/A',
          m.asset?.name || 'N/A',
          m.status || 'N/A',
          m.priority || 'N/A',
          m.cost || 0,
          m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'N/A'
        ]);
        break;

      case 'lost':
        data = await Asset.find({ status: AssetStatus.LOST, deletedAt: null }).populate('category department').lean();
        headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Location', 'Purchase Cost'];
        data = data.map((a: any) => [
          a.assetTag || 'N/A',
          a.name || 'N/A',
          a.category?.name || 'N/A',
          a.department?.code || 'N/A',
          a.location || 'N/A',
          a.purchaseCost || 0
        ]);
        break;

      case 'retired':
        data = await Asset.find({ status: AssetStatus.RETIRED, deletedAt: null }).populate('category department').lean();
        headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Retirement Date', 'Reason'];
        data = data.map((a: any) => [
          a.assetTag || 'N/A',
          a.name || 'N/A',
          a.category?.name || 'N/A',
          a.department?.code || 'N/A',
          a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : 'N/A',
          a.condition || 'RETIRED'
        ]);
        break;

      case 'warranty':
        const thirtyDaysFromNow = new Date(Date.now() + 86400000 * 30);
        data = await Asset.find({
          warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow },
          deletedAt: null
        }).populate('category department').lean();
        headers = ['Asset Tag', 'Name', 'Category', 'Warranty Expiry', 'Supplier', 'Status'];
        data = data.map((a: any) => [
          a.assetTag || 'N/A',
          a.name || 'N/A',
          a.category?.name || 'N/A',
          a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString() : 'N/A',
          a.supplier || 'N/A',
          a.status || 'N/A'
        ]);
        break;

      case 'idle':
        const ninetyDaysAgo = new Date(Date.now() - 86400000 * 90);
        const assets = await Asset.find({ status: AssetStatus.AVAILABLE, deletedAt: null }).populate('category department').lean();
        
        // Filter those without allocation or booking in last 90 days
        const idleRows = [];
        for (const asset of assets as any[]) {
          const lastAlloc = await AssetAllocation.findOne({
            asset: asset._id,
            createdAt: { $gte: ninetyDaysAgo }
          });
          if (!lastAlloc) {
            idleRows.push([
              asset.assetTag || 'N/A',
              asset.name || 'N/A',
              asset.category?.name || 'N/A',
              asset.department?.code || 'N/A',
              asset.location || 'N/A',
              asset.condition || 'N/A'
            ]);
          }
        }
        data = idleRows;
        headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Location', 'Condition'];
        break;

      default:
        res.status(400).json({ message: 'Invalid or unsupported report type.' });
        return;
    }


    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Report_${type}_${Date.now()}.csv`);
      res.status(200).send(csvContent);
      return;
    }

    // Default return JSON
    res.status(200).json({
      headers,
      rows: data
    });
  } catch (error) {
    next(error);
  }
}
