import { Request, Response, NextFunction } from 'express';
import { AssetCategory, CategoryStatus } from '../models/AssetCategory';
import { Asset } from '../models/Asset';
import { ActivityLog } from '../models/ActivityLog';

/**
 * GET /api/categories
 * List all categories with search, filters, pagination, and asset counts.
 */
export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { deletedAt: null };

    // Search by Name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Filter by Status
    if (status) {
      filter.status = status;
    }

    const categories = await AssetCategory.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AssetCategory.countDocuments(filter);

    // Compute asset count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const assetsCount = await Asset.countDocuments({ category: cat._id, deletedAt: null });
        return {
          ...cat.toObject(),
          assetsCount
        };
      })
    );

    res.status(200).json({
      data: categoriesWithCounts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/categories/:id
 * Retrieve single category by ID
 */
export async function getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const category = await AssetCategory.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const assetsCount = await Asset.countDocuments({ category: category._id, deletedAt: null });

    res.status(200).json({
      ...category.toObject(),
      assetsCount
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/categories
 * Create a new Asset Category.
 */
export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description, icon, customFields, maintenanceInterval, status } = req.body;
    const adminId = req.user?.userId as any;

    // Check duplicate name
    const existingName = await AssetCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      deletedAt: null
    });
    if (existingName) {
      res.status(400).json({ message: `Category name '${name}' already exists.` });
      return;
    }

    const category = new AssetCategory({
      name,
      description,
      icon: icon || 'package',
      customFields: customFields || [],
      maintenanceInterval,
      status,
      createdBy: adminId
    });

    await category.save();

    // Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'CATEGORY_CREATED',
      module: 'ORGANIZATION',
      entityId: category._id.toString(),
      newData: { name: category.name }
    });

    res.status(201).json({
      message: 'Asset Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/categories/:id
 * Update an existing Category.
 */
export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { name, description, icon, customFields, maintenanceInterval, status } = req.body;
    const adminId = req.user?.userId as any;

    const category = await AssetCategory.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const oldData = { ...category.toObject() };

    // Check name duplicate (excluding self)
    if (name && name !== category.name) {
      const existingName = await AssetCategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id },
        deletedAt: null
      });
      if (existingName) {
        res.status(400).json({ message: `Category name '${name}' already exists.` });
        return;
      }
      category.name = name;
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon || 'package';
    if (customFields !== undefined) category.customFields = customFields;
    if (maintenanceInterval !== undefined) category.maintenanceInterval = maintenanceInterval;
    if (status !== undefined) category.status = status;
    category.updatedBy = adminId;

    await category.save();

    // Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'CATEGORY_UPDATED',
      module: 'ORGANIZATION',
      entityId: category._id.toString(),
      oldData: { name: oldData.name },
      newData: { name: category.name }
    });

    res.status(200).json({
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/categories/:id
 * Soft Delete a category (only if no assets are linked to it).
 */
export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user?.userId as any;

    const category = await AssetCategory.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    // Check for existing assets in this category
    const assetsCount = await Asset.countDocuments({ category: id, deletedAt: null });
    if (assetsCount > 0) {
      res.status(400).json({
        message: `Cannot delete category. There are ${assetsCount} active assets currently categorized under it.`
      });
      return;
    }

    // Soft delete category
    category.deletedAt = new Date();
    category.deletedBy = adminId;
    await category.save();

    // Log Activity
    await ActivityLog.create({
      user: adminId,
      action: 'CATEGORY_DELETED',
      module: 'ORGANIZATION',
      entityId: id,
      oldData: { name: category.name }
    });

    res.status(200).json({
      message: 'Category deleted successfully (soft delete)'
    });
  } catch (error) {
    next(error);
  }
}
