import WasteCategory from "../models/wasteCategory.model.js";
import { errorHandler } from "../utils/error.js";
import WasteRequest from "../models/wasteRequest.model.js";

/**
 * Waste Category Controller
 * Handles CRUD operations for waste categories
 * @module controllers/wasteCategory.controller
 * @requires models/wasteCategory.model
 * @requires utils/error
 */

/**
 * Create a new waste category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {Object} req.body - Request body containing waste category data
 * @param {string} req.body.name - Name of the waste category
 * @param {string} req.body.description - Description of the waste category
 * @param {number} req.body.pricePerKg - Price per kg of the waste category
 * @param {string} req.body.image - Image URL of the waste category
 * @error {400} Name and price per kg are required
 * @error {400} Name should be at least 3 characters
 * @error {400} Description should be at least 10 characters
 * @error {400} Price per kg should be greater than 0
 * @error {500} Server error
 * @returns {JSON} New waste category data
 */
export const createWasteCategory = async (req, res, next) => {
  const { name, description, pricePerKg, image } = req.body;
  if (!name || !pricePerKg) {
    return next(errorHandler(400, "Name and price per kg are required"));
  }
  if (name.length < 3) {
    return next(errorHandler(400, "Name should be at least 3 characters"));
  }
  if (description.length < 10) {
    return next(
      errorHandler(400, "Description should be at least 10 characters")
    );
  }
  if (pricePerKg < 0) {
    return next(errorHandler(400, "Price per kg should be greater than 0"));
  }
  try {
    const wasteCategory = new WasteCategory({
      name,
      description,
      pricePerKg,
      image,
    });
    await wasteCategory.save();
    res.status(201).json(wasteCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all waste categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {500} Server error
 * @returns {JSON} List of all waste categories
 */
export const getWasteCategories = async (req, res, next) => {
  try {
    const wasteCategories = await WasteCategory.find();
    const total = wasteCategories.length;
    const active = wasteCategories.filter(
      (category) => category.isActive == true
    ).length;
    const inactive = wasteCategories.filter(
      (category) => category.isActive == false
    ).length;
    res.status(200).json({ total, active, inactive, wasteCategories });
  } catch (error) {
    next(error);
  }
};

/**
 * Update waste category details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {Object} req.body - Request body containing waste category data
 * @param {string} req.body.name - Name of the waste category
 * @param {string} req.body.description - Description of the waste category
 * @param {number} req.body.pricePerKg - Price per kg of the waste category
 * @param {string} req.body.image - Image URL of the waste category
 * @param {boolean} req.body.isActive - Active status of the waste category
 * @param {boolean} req.body.isUserPaymentRequired - User payment status of the waste category
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Waste category ID
 * @error {400} Name and price per kg are required
 * @error {400} Price per kg should be greater than 0
 * @error {400} isActive must be 'Active' or 'inactive'
 * @error {400} isActive must be a boolean
 * @error {404} Waste category not found
 * @error {500} Server error
 * @returns {JSON} Updated waste category data
 */
export const updateWasteCategory = async (req, res, next) => {
  const {
    name,
    description,
    pricePerKg,
    image,
    isActive,
    isUserPaymentRequired,
  } = req.body;
  if (!name || !pricePerKg) {
    return next(errorHandler(400, "Name and price per kg are required"));
  }
  if (pricePerKg < 0) {
    return next(errorHandler(400, "Price per kg should be greater than 0"));
  }
  try {
    const wasteCategory = await WasteCategory.findById(req.params.id);
    if (!wasteCategory) {
      return next(errorHandler(404, "Waste category not found"));
    }
    if (isActive !== undefined) {
      // Convert "Active" or "Deactive" to boolean
      if (typeof isActive === "string") {
        if (isActive.toLowerCase() === "active") {
          isActive = true;
        } else if (isActive.toLowerCase() === "inactive") {
          isActive = false;
        } else {
          return next(
            errorHandler(400, "isActive must be 'Active' or 'inactive'")
          );
        }
      }
      // Ensure it's now a boolean
      if (typeof isActive !== "boolean") {
        return next(errorHandler(400, "isActive must be a boolean"));
      }
      wasteCategory.isActive = isActive;
    }
    wasteCategory.isUserPaymentRequired = isUserPaymentRequired;
    wasteCategory.name = name;
    wasteCategory.description = description;
    wasteCategory.pricePerKg = pricePerKg;
    wasteCategory.image = image;
    await wasteCategory.save();
    res.status(200).json(wasteCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Waste category ID
 * @error {404} Waste category not found
 * @error {400} Delete Denied. Waste category is in use
 * @returns {JSON} Success message
 */
export const deleteWasteCategory = async (req, res, next) => {
  try {
    const wasteCategory = await WasteCategory.findById(req.params.id);

    // Check if waste category exists
    if (!wasteCategory) {
      return next(errorHandler(404, "Waste category not found"));
    }

    // Check if the waste category is in use
    const wasteRequest = await WasteRequest.findOne({
      wasteCategory: req.params.id,
    });

    if (wasteRequest) {
      return next(errorHandler(400, "Delete Denied. Waste category is in use"));
    }

    // Delete the waste category
    await WasteCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Waste category deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
