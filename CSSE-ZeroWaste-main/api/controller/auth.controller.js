import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/error.js";

/**
 * Authentication Controller
 * Handles user authentication operations including signup, signin, and Google OAuth
 * @module controllers/auth.controller
 * @requires models/user.model
 * @requires utils/error
 * @requires bcryptjs
 * @requires jsonwebtoken
 */

/**
 * Configuration Constants
 * These could be moved to a separate config file in a production environment
 */
const SALT_ROUNDS = 10;
const JWT_SECRET = "zeroWaste890"; // TODO: Move to environment variables

/**
 * User Registration Controller
 * Handles new user registration with username, email, and password
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user registration data
 * @param {string} req.body.username - User's chosen username
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (plain text)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {400} All fields are required
 * @returns {Promise<void>}
 */
export const signup = async (req, res, next) => {
  try {
    // Extract user registration data from request body
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return next(errorHandler(400, "All fields are required"));
    }

    // Hash password before storing
    const hashPassword = bcryptjs.hashSync(password, SALT_ROUNDS);

    // Create new user instance
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashPassword
    });

    // Save user to database
    await newUser.save();

    // Send success response
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    // Pass any errors to error handling middleware
    next(error);
  }
};

/**
 * User Sign-in Controller
 * Authenticates user credentials and issues JWT token
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing login credentials
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {400} Email and password are required
 * @error {404} User not registered
 * @returns {Promise<void>}
 */
export const signin = async (req, res, next) => {
  try {
    // Extract login credentials
    const { email, password } = req.body;

    // Validate required fields
    if (!email?.trim() || !password?.trim()) {
      return next(errorHandler(400, "Email and password are required"));
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return next(errorHandler(404, "User not registered"));
    }

    // Verify password
    const isPasswordValid = bcryptjs.compareSync(password, user.password);
    if (!isPasswordValid) {
      return next(errorHandler(401, "Invalid credentials"));
    }

    // Generate JWT token
    const token = generateAuthToken(user);

    // Remove password from user object before sending response
    const { password: _, ...userWithoutPassword } = user._doc;

    // Send response with token in cookie and user data
    res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
      })
      .json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth Authentication Controller
 * Handles user authentication through Google OAuth
 * Creates new user account if email doesn't exist
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing Google OAuth data
 * @param {string} req.body.email - User's Google email
 * @param {string} req.body.name - User's Google profile name
 * @param {string} req.body.googlePhotoURL - User's Google profile picture URL
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @error {500} Internal server error
 * @returns {Promise<void>}
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, googlePhotoURL } = req.body;

    // Find existing user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Handle existing user login
      handleExistingUserLogin(user, res);
    } else {
      // Create new user account
      const newUser = await createGoogleUser(email, name, googlePhotoURL);
      handleExistingUserLogin(newUser, res);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Test endpoint for API health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const test = (req, res) => {
  res.json({ 
    status: "healthy",
    message: "API is working",
    timestamp: new Date().toISOString()
  });
};

/**
 * Helper Functions
 */

/**
 * Generates a random password for OAuth users
 * @returns {string} Generated password
 */
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8) + 
         Math.random().toString(36).slice(-8);
};

/**
 * Generates JWT authentication token
 * @param {Object} user - User document from database
 * @returns {string} JWT token
 */
const generateAuthToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      isAdmin: user.isAdmin 
    },
    process.env.JWT_SECRET || JWT_SECRET,
    { 
      expiresIn: '24h' // Token expires in 24 hours
    }
  );
};

/**
 * Creates new user account for Google OAuth users
 * @async
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} photoURL - User's profile picture URL
 * @returns {Promise<Object>} Created user document
 */
const createGoogleUser = async (email, name, photoURL) => {
  const password = generateRandomPassword();
  const hashPassword = bcryptjs.hashSync(password, SALT_ROUNDS);
  
  const newUser = new User({
    username: generateUsername(name),
    email: email.toLowerCase().trim(),
    password: hashPassword,
    profilePicture: photoURL,
  });

  return await newUser.save();
};

/**
 * Generates username from Google profile name
 * @param {string} name - User's full name
 * @returns {string} Generated username
 */
const generateUsername = (name) => {
  return name.toLowerCase()
    .split(" ")
    .join("") + 
    Math.random().toString(36).slice(-4);
};

/**
 * Handles login response for existing users
 * @param {Object} user - User document from database
 * @param {Object} res - Express response object
 */
const handleExistingUserLogin = (user, res) => {
  const token = generateAuthToken(user);
  const { password, ...userWithoutPassword } = user._doc;
  
  res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
    })
    .json(userWithoutPassword);
};