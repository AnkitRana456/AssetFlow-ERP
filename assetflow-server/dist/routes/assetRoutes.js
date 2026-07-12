"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assetController_1 = require("../controllers/assetController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const assetValidator_1 = require("../validators/assetValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Base checks for all asset interactions
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive);
// Reads: Open to all authenticated users (internal controller filters by user role scope)
router.get('/', assetController_1.getAssets);
router.get('/export', assetController_1.exportAssets);
router.get('/history/:id', assetController_1.getAssetHistory);
router.get('/:id', assetController_1.getAssetById);
// Writes: Limited to Admin and Asset Manager roles
router.post('/', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), uploadMiddleware_1.assetUpload, assetValidator_1.validateAsset, validationMiddleware_1.validateRequest, assetController_1.createAsset);
router.patch('/:id', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), uploadMiddleware_1.assetUpload, assetValidator_1.validateAsset, validationMiddleware_1.validateRequest, assetController_1.updateAsset);
router.delete('/:id', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), assetController_1.deleteAsset);
// Bulk Import: Admin and Asset Manager only
router.post('/import', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), uploadMiddleware_1.upload.single('file'), assetController_1.importAssets);
exports.default = router;
