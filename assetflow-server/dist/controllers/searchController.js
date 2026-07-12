"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = globalSearch;
const Asset_1 = require("../models/Asset");
const Department_1 = require("../models/Department");
const User_1 = require("../models/User");
const Booking_1 = require("../models/Booking");
const MaintenanceRequest_1 = require("../models/MaintenanceRequest");
const AuditCycle_1 = require("../models/AuditCycle");
async function globalSearch(req, res, next) {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.trim() === '') {
            res.status(200).json({ assets: [], departments: [], employees: [], bookings: [], maintenance: [], audits: [] });
            return;
        }
        const regex = new RegExp(q.trim(), 'i');
        const [assets, departments, employees, bookings, maintenance, audits] = await Promise.all([
            Asset_1.Asset.find({
                $or: [
                    { name: regex },
                    { assetTag: regex },
                    { serialNumber: regex },
                    { location: regex }
                ],
                deletedAt: null
            }).limit(5),
            Department_1.Department.find({
                $or: [
                    { name: regex },
                    { code: regex }
                ],
                deletedAt: null
            }).limit(5),
            User_1.User.find({
                $or: [
                    { firstName: regex },
                    { lastName: regex },
                    { email: regex },
                    { employeeId: regex }
                ]
            }).select('-password').limit(5),
            Booking_1.Booking.find({ title: regex }).limit(5),
            MaintenanceRequest_1.MaintenanceRequest.find({ title: regex }).limit(5),
            AuditCycle_1.AuditCycle.find({ title: regex }).limit(5)
        ]);
        res.status(200).json({
            assets,
            departments,
            employees,
            bookings,
            maintenance,
            audits
        });
    }
    catch (error) {
        next(error);
    }
}
