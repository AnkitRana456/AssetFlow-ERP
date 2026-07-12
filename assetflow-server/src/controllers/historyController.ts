import { Request, Response, NextFunction } from 'express';
import { AssetHistory } from '../models/AssetHistory';

/**
 * GET /api/history/:assetId
 * Retrieve the lifecycle history/timeline events for a specific asset
 */
export async function getTimelineHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { assetId } = req.params;
    
    const history = await AssetHistory.find({ asset: assetId })
      .populate('performedBy', 'firstName lastName email role')
      .populate('allocation')
      .populate('transfer')
      .populate('returnRequest')
      .sort({ createdAt: 1 }); // Sorted ascending (oldest first) for timeline display

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
}

