import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import bcryptjs from "bcryptjs";

/**
 * User Management Controller
 * Handles CRUD operations for user accounts and user data management
 * @module controllers/user.controller
 * @requires models/user.model
 * @requires utils/error
 * @requires bcryptjs
 */

/**
 * Configuration Constants
 */
const SALT_ROUNDS = 10;
const USERNAME_MIN_LENGTH = 7;
const USERNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 6;
const PHONE_LENGTH = 10;
const NIC_LENGTH = 12;
const DEFAULT_LIMIT = 9;

/**
 * Input Validation Rules
 */
const ValidationRules = {
  username: {
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
    pattern: /^[a-zA-Z0-9]+$/,
    lowercase: true,
    noSpaces: true,
  },
  password: {
    minLength: PASSWORD_MIN_LENGTH,
  },
  phone: {
    exactLength: PHONE_LENGTH,
  },
  nic: {
    exactLength: NIC_LENGTH,
  },
};

/**
 * API Health Check Endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const test = (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "API is working",
    timestamp: new Date().toISOString(),
  });
};

/**
 * User Sign Out Controller
 * Clears authentication cookie
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {JSON} Sign out message
 * @error {500} Internal server error
 */
export const signout = (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Sign out successful" });
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Profile
 * Updates user information with validation
 *
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing fields to update
 * @param {string} req.params.userId - User ID to update
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {403} Validation error
 * @error {404} User not found
 * @error {500} Internal server error
 * @returns {JSON} Updated user data
 */
export const updateUser = async (req, res, next) => {
  try {
    // Validate input fields
    const validationError = validateUpdateFields(req.body);
    if (validationError) {
      return next(errorHandler(403, validationError));
    }

    // Hash password if provided
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, SALT_ROUNDS);
    }

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          profilePicture: req.body.profilePicture,
          password: req.body.password,
          phone: req.body.phone,
          nic: req.body.nic,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return next(errorHandler(404, "User not found"));
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser._doc;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User Account
 * Permanently removes user account
 *
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.userId - User ID to delete
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {404} User not found
 * @error {500} Internal server error
 */
export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userId);
    if (!deletedUser) {
      return next(errorHandler(404, "User not found"));
    }
    res.status(200).json({
      message: "Account deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Users with Pagination
 * Retrieves paginated list of users with sorting and analytics
 *
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for pagination and sorting
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {500} Internal server error
 * @returns {JSON} Paginated list of users with analytics
 */
export const getusers = async (req, res, next) => {
  try {
    // Parse pagination and sorting parameters
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const sortDirection = req.query.sortDirection === "asc" ? 1 : -1;

    // Fetch users with pagination
    const users = await User.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    // Remove passwords from user data
    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user._doc;
      return rest;
    });

    // Get user statistics
    const [totalUsers, lastMonthUsers] = await Promise.all([
      User.countDocuments(),
      getLastMonthUsers(),
    ]);

    res.status(200).json({
      users: usersWithoutPassword,
      totalUsers,
      lastMonthUsers,
      pagination: {
        currentPage: Math.floor(startIndex / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single User
 * Retrieves detailed information for a specific user
 *
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.userId - User ID to retrieve
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {404} User not found
 * @error {500} Internal server error
 * @returns {JSON} Detailed user information
 */
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const { password, ...userWithoutPassword } = user._doc;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper Functions
 */

/**
 * Validates user update fields
 * @param {Object} updateFields - Fields to validate
 * @returns {string|null} Error message or null if valid
 */
const validateUpdateFields = (updateFields) => {
  if (
    updateFields.password &&
    updateFields.password.length < ValidationRules.password.minLength
  ) {
    return `Password must be at least ${ValidationRules.password.minLength} characters long`;
  }

  if (updateFields.username) {
    if (
      updateFields.username.length < ValidationRules.username.minLength ||
      updateFields.username.length > ValidationRules.username.maxLength
    ) {
      return `Username must be between ${ValidationRules.username.minLength} and ${ValidationRules.username.maxLength} characters long`;
    }
    if (updateFields.username.includes(" ")) {
      return "Username must not contain spaces";
    }
    if (updateFields.username !== updateFields.username.toLowerCase()) {
      return "Username must be in lowercase";
    }
    if (!ValidationRules.username.pattern.test(updateFields.username)) {
      return "Username must contain only letters and numbers";
    }
  }

  if (updateFields.email && !updateFields.email.includes("@")) {
    return "Invalid email format";
  }

  if (
    updateFields.phone &&
    updateFields.phone.length !== ValidationRules.phone.exactLength
  ) {
    return `Phone number must be ${ValidationRules.phone.exactLength} digits long`;
  }

  if (
    updateFields.nic &&
    updateFields.nic.length !== ValidationRules.nic.exactLength
  ) {
    return `NIC number must be ${ValidationRules.nic.exactLength} digits long`;
  }

  return null;
};

/**
 * Calculates users registered in the last month
 * @async
 * @returns {Promise<number>} Number of users registered in last month
 */
const getLastMonthUsers = async () => {
  const now = new Date();
  const oneMonthAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate()
  );

  return await User.countDocuments({
    createdAt: { $gte: oneMonthAgo },
  });
};
