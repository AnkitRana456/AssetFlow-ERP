"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimelineHistory = getTimelineHistory;
const AssetHistory_1 = require("../models/AssetHistory");
/**
 * GET /api/history/:assetId
 * Retrieve the lifecycle history/timeline events for a specific asset
 */
async function getTimelineHistory(req, res, next) {
    try {
        const { assetId } = req.params;
        const history = await AssetHistory_1.AssetHistory.find({ asset: assetId })
            .populate('performedBy', 'firstName lastName email role')
            .populate('allocation')
            .populate('transfer')
            .populate('returnRequest')
            .sort({ createdAt: 1 }); // Sorted ascending (oldest first) for timeline display
        res.status(200).json(history);
    }
    catch (error) {
        next(error);
    }
}
