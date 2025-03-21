import WasteTruck from "../models/driver.model.js";
import District from "../models/district.model.js";
import { errorHandler } from "../utils/error.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import bdcrpytjs from "bcryptjs";
import GoogleSendMail from "../utils/sendEmail.js";
import generatePDFFromHtml from "../utils/pdfGenerator.js";

/**
 * Driver Management Controller
 * Handles CRUD operations for waste truck drivers
 * @module controllers/driver.controller
 * @requires models/driver.model
 * @requires models/district.model
 * @requires models/user.model
 * @requires utils/error
 * @requires utils/sendEmail
 * @requires utils/pdfGenerator
 * @requires bcryptjs
 * @requires crypto
 */

/**
 * Create a new driver
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @param {string} req.body.name - Driver's name
 * @param {string} req.body.email - Driver's email
 * @param {string} req.body.phone - Driver's phone number
 * @param {string} req.body.NIC - Driver's NIC number
 * @param {string} req.body.vehicleNumber - Driver's vehicle number
 * @param {string} req.body.DriverImage - Driver's image URL
 * @param {string} req.body.vehicleImage - Vehicle image URL
 * @param {string} req.body.district - District ID
 * @param {string} req.body.city - Driver's city
 * @error {400} Bad Request error
 * @error {404} Not Found error
 * @error {500} Internal server error
 * @returns {JSON} - Returns a JSON object with the driver details
 */
export const createDriver = async (req, res, next) => {
  const {
    name,
    email,
    phone,
    NIC,
    vehicleNumber,
    DriverImage,
    vehicleImage,
    district,
    city,
  } = req.body;

  const foundDriver = await WasteTruck.findOne({ NIC });
  if (foundDriver) {
    const error = new Error("NIC already exists");
    error.statusCode = 400;
    return next(error);
  }
  const foundVehicle = await WasteTruck.findOne({ vehicleNumber });
  if (foundVehicle) {
    const error = new Error("Vehicle number already exists");
    error.statusCode = 400;
    return next(error);
  }
  const foundEmail = await WasteTruck.findOne({ email });
  if (foundEmail) {
    const error = new Error("Email already exists");
    error.statusCode = 400;
    return next(error);
  }
  if (
    !name ||
    !email ||
    !phone ||
    !NIC ||
    !vehicleNumber ||
    !DriverImage ||
    !vehicleImage ||
    !district ||
    !city
  ) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    return next(error);
  }
  if (NIC.length !== 12) {
    const error = new Error("NIC should be 10 characters");
    error.statusCode = 400;
    return next(error);
  }
  if (phone.length !== 10) {
    const error = new Error("Phone number should be 10 characters");
    error.statusCode = 400;
    return next(error);
  }
  if (vehicleNumber.length !== 7) {
    const error = new Error("Vehicle number should be 7 characters");
    error.statusCode = 400;
    return next(error);
  }
  const driver = new WasteTruck({
    name,
    email,
    phone,
    NIC,
    vehicleNumber,
    DriverImage,
    vehicleImage,
    district,
    city,
  });
  try {
    // Example usage in your driver creation function
    const password = generatePassword(); // Auto-generate password
    const hashedPassword = bdcrpytjs.hashSync(password, 10); // Hash the password

    // Generate a unique username
    const username = generateUsername(name);
    const user = new User({
      username: username,
      email,
      isDriver: true,
      password: hashedPassword, // Save hashed password
    });
    await user.save();
    driver.userId = user._id;
    await driver.save();
    const foundDistrict = await District.findById(district);
    if (!foundDistrict) {
      const error = new Error("District not found");
      error.statusCode = 404;
      return next(error);
    }
    foundDistrict.TruckDrivers.push(driver._id);
    await foundDistrict.save();
    // Send email to the driver
    // Assuming you have driver data and their credentials
    const emailData = {
      name: driver.name,
      email: driver.email,
      password: password, // The auto-generated password for the driver
    };
    await GoogleSendMail({
      email: driver.email,
      subject: "Driver Registration Successful - Waste Zero",
      template: "driverRegistration.ejs", // Path to the template in the mails folder
      data: emailData,
    });
    res.status(201).json({
      success: true,
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all the drivers
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @error {500} Internal server error
 * @returns {JSON} - Returns a JSON object with the drivers details
 */
export const getDrivers = async (req, res, next) => {
  try {
    const drivers = await WasteTruck.find()
      .populate("district")
      .populate("userId")
      .populate({
        path: "wasteRequests", // First level population (wasteRequests)
        populate: {
          path: "wasteCategory", // Nested population (wasteCategory within wasteRequests)
        },
      });
    const totalDrivers = drivers.length;
    const totalActiveDrivers = drivers.filter(
      (driver) => driver.isActive === true
    ).length;
    const totalInactiveDrivers = drivers.filter(
      (driver) => driver.isActive === false
    ).length;
    res.json({
      drivers,
      totalDrivers,
      totalActiveDrivers,
      totalInactiveDrivers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update driver details
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @param {string} req.params.id - Driver ID
 * @param {string} req.body.name - Driver's name
 * @param {string} req.body.email - Driver's email
 * @param {string} req.body.phone - Driver's phone number
 * @param {string} req.body.NIC - Driver's NIC number
 * @param {string} req.body.vehicleNumber - Driver's vehicle number
 * @param {string} req.body.DriverImage - Driver's image URL
 * @param {string} req.body.vehicleImage - Vehicle image URL
 * @param {string} req.body.district - District ID
 * @param {string} req.body.city - Driver's city
 * @param {string} req.body.isActive - Driver's status
 * @error {400} Bad Request error
 * @error {404} Not Found error
 * @error {500} Internal server error
 * @returns {JSON} - Returns a JSON object with the updated driver details
 */
export const updateDriver = async (req, res, next) => {
  const { id } = req.params;
  let {
    name,
    email,
    phone,
    NIC,
    vehicleNumber,
    DriverImage,
    vehicleImage,
    district,
    city,
    isActive,
  } = req.body;
  try {
    const driver = await WasteTruck.findById(id);
    if (!driver) {
      const error = new Error("Driver not found");
      error.statusCode = 404;
      return next(error);
    }
    if (name) {
      if (name.length < 3) {
        const error = new Error("Name should be at least 3 characters");
        error.statusCode = 400;
        return next(error);
      }
      driver.name = name;
    }
    if (email) {
      if (email.contains("@")) {
        const error = new Error("Invalid email address");
        error.statusCode = 400;
        return next(error);
      }
      if (email.length < 3) {
        const error = new Error("Email should be at least 3 characters");
        error.statusCode = 400;
        return next(error);
      }
      driver.email = email;
    }
    if (phone) {
      if (phone.length !== 10) {
        const error = new Error("Phone number should be 10 characters");
        error.statusCode = 400;
        return next(error);
      }
      driver.phone = phone;
    }
    if (NIC) {
      if (NIC.length !== 12) {
        const error = new Error("NIC should be 10 characters");
        error.statusCode = 400;
        return next(error);
      }
      driver.NIC = NIC;
    }
    if (vehicleNumber) {
      if (vehicleNumber.length !== 7) {
        const error = new Error("Vehicle number should be 7 characters");
        error.statusCode = 400;
        return next(error);
      }
      driver.vehicleNumber = vehicleNumber;
    }
    if (DriverImage) driver.DriverImage = DriverImage;
    if (vehicleImage) driver.vehicleImage = vehicleImage;
    if (district) {
      const oldDistrict = driver.district;
      const foundOldDistrict = await District.findById(oldDistrict);
      const foundDistrict = await District.findById(district);
      if (!foundDistrict) {
        const error = new Error("District not found");
        error.statusCode = 404;
        return next(error);
      }
      // Pull the truck driver ID from the district's TruckDrivers array
      foundOldDistrict.TruckDrivers.pull(driver._id);
      // Save the updated district document
      await foundOldDistrict.save();
      driver.district = district;
      // Push the truck driver ID to the new district's TruckDrivers array
      foundDistrict.TruckDrivers.push(driver._id);
      // Save the updated district document
      await foundDistrict.save();
    }
    if (city) driver.city = city;
    if (isActive !== undefined) {
      // Convert "Active" or "Deactive" to boolean
      if (typeof isActive === "string") {
        if (isActive.toLowerCase() === "active") {
          isActive = true;
        } else if (isActive.toLowerCase() === "deactive") {
          isActive = false;
        } else {
          return next(
            errorHandler(400, "isActive must be 'Active' or 'Deactive'")
          );
        }
      }
      // Ensure it's now a boolean
      if (typeof isActive !== "boolean") {
        return next(errorHandler(400, "isActive must be a boolean"));
      }
      driver.isActive = isActive;
    }
    await driver.save();
    res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      driver,
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @param {string} req.params.id - Driver ID
 * @error {404} Not Found error
 * @error {500} Internal server error
 * @returns {JSON} - Returns a JSON object with the driver details
 */
export const deleteDriver = async (req, res, next) => {
  const { id } = req.params;
  try {
    const driver = await WasteTruck.findById(id);
    if (!driver) {
      const error = new Error("Driver not found");
      error.statusCode = 404;
      return next(error);
    }
    if (driver.isActive) {
      const error = new Error(
        "Driver is still active. Deactivate the driver first"
      );
      error.statusCode = 400;
      return next(error);
    }
    if (driver.wasteRequests.length > 0) {
      const error = new Error(
        "Driver has pending requests. Complete or cancel the requests first"
      );
      error.statusCode = 400;
      return next(error);
    }
    const emailData = {
      name: driver.name, // Replace with the actual name of the driver
    };

    await GoogleSendMail({
      email: driver.email, // Driver's email address
      subject: "Account Cancellation - Waste Zero",
      template: "drivercancellation.ejs", // Path to the cancellation template in the mails folder
      data: emailData,
    });
    const user = await User.findById(driver.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }
    await User.findByIdAndDelete(driver.userId);
    await WasteTruck.findByIdAndDelete(id);
    // Find the district where this driver is associated
    const foundDistrict = await District.findById(driver.district);
    if (!foundDistrict) {
      const error = new Error("District not found");
      error.statusCode = 404;
      return next(error);
    }
    // Pull the truck driver ID from the district's TruckDrivers array
    foundDistrict.TruckDrivers.pull(driver._id);
    // Save the updated district document
    await foundDistrict.save();
    res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @param {string} req.body.id - District
 * @param {string} req.body.city - City
 * @error {404} Not Found error
 * @error {500} Internal server error
 * @returns  - Returns a PDF report with the driver details
 */
export const generateDistrictReport = async (req, res, next) => {
  const { id, city } = req.body;
  try {
    // Determine whether to filter by district or city
    let filter = {};

    if (id) {
      // If a district ID is provided, filter by district
      filter.district = id;
    }

    if (city) {
      // If a city is provided, filter by city as well
      filter.city = city;
    }

    // Fetch drivers based on the filter (either district or city or both)
    const drivers = await WasteTruck.find(filter)
      .populate("district")
      .populate({
        path: "wasteRequests",
        populate: {
          path: "wasteCategory", // Populate wasteCategory within wasteRequests
        },
      });

    if (!drivers || drivers.length === 0) {
      return res
        .status(404)
        .json({ message: "No drivers found for the selected criteria." });
    }

    // Start building the HTML content for the report
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Driver Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>${getStyles()}</style>
      </head>
      <body>
        <div class="header">
          <h1>Driver Report</h1>
          <p>Generated on ${new Date().toLocaleDateString("en-GB")}</p>
        </div>
        ${drivers
          .map(
            (driver) => `
              ${generateDriverInfo(driver)}
              ${generateWasteRequests(driver.wasteRequests)}
            `
          )
          .join("")}
      </body>
      </html>
    `;

    const pdfBuffer = await generatePDFFromHtml(htmlContent);

    // Set response headers and send the PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper Functions
 * @module controllers/driver.controller
 */

// Constants for styling
const COLORS = {
  primary: "#1a73e8",
  secondary: "#5f6368",
  success: "#34a853",
  warning: "#fbbc04",
  error: "#ea4335",
  border: "#dadce0",
};

// CSS styles as a template literal
const getStyles = () => `
  body {
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
    color: ${COLORS.secondary};
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .header {
    background-color: ${COLORS.primary};
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
  }
  
  .driver-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
    overflow: hidden;
  }
  
  .driver-header {
    background: #f8f9fa;
    padding: 20px;
    border-bottom: 1px solid ${COLORS.border};
    display: flex;
    align-items: center;
  }
  
  .driver-info {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .driver-images {
    display: flex;
    gap: 20px;
    margin-top: 20px;
  }
  
  .info-item {
    margin-bottom: 10px;
  }
  
  .label {
    font-weight: 500;
    color: ${COLORS.secondary};
  }
  
  .value {
    color: #202124;
  }
  
  .status-badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-weight: 500;
    font-size: 14px;
  }
  
  .status-active { background: #e6f4ea; color: ${COLORS.success}; }
  .status-inactive { background: #fce8e6; color: ${COLORS.error}; }
  .status-pending { background: #fef7e0; color: ${COLORS.warning}; }
  
  .waste-requests {
    margin-top: 20px;
  }
  
  .waste-request-card {
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .driver-img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
  }
`;

// Helper function to generate status badge HTML
const getStatusBadge = (status, isActive) => {
  const statusMap = {
    ACTIVE: { class: "status-active", text: "Active" },
    INACTIVE: { class: "status-inactive", text: "Inactive" },
    PENDING: { class: "status-pending", text: "Pending" },
    ACCEPTED: { class: "status-active", text: "Accepted" },
    REJECTED: { class: "status-inactive", text: "Rejected" },
  };

  const statusKey =
    isActive !== undefined ? (isActive ? "ACTIVE" : "INACTIVE") : status;

  const { class: className, text } = statusMap[statusKey] || statusMap.PENDING;

  return `<span class="status-badge ${className}">${text}</span>`;
};

// Helper function to generate driver info HTML
const generateDriverInfo = (driver) => {
  const infoItems = [
    { label: "Email", value: driver.email },
    { label: "Phone", value: driver.phone },
    { label: "NIC", value: driver.NIC },
    { label: "Vehicle Number", value: driver.vehicleNumber },
    { label: "City", value: driver.city },
  ];

  return `
    <div class="driver-card">
      <div class="driver-header">
        <h2>${driver.name}</h2>
        ${getStatusBadge(null, driver.isActive)}
      </div>
      <div class="driver-info">
        ${infoItems
          .map(
            (item) => `
          <div class="info-item">
            <div class="label">${item.label}</div>
            <div class="value">${item.value}</div>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="driver-images">
        <img class="driver-img" src="${
          driver.DriverImage
        }" alt="Driver Image" />
        <img class="driver-img" src="${
          driver.vehicleImage
        }" alt="Vehicle Image" />
      </div>
    </div>
  `;
};

// Helper function to generate waste request HTML
const generateWasteRequests = (requests) => {
  if (!requests || requests.length === 0) {
    return "<p>No waste requests associated with this driver.</p>";
  }

  return `
    <div class="waste-requests">
      <h3>Waste Requests</h3>
      ${requests
        .map(
          (request) => `
        <div class="waste-request-card">
          <div class="info-item">
            <div class="label">Waste Category</div>
            <div class="value">${request.wasteCategory?.name || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="label">Quantity</div>
            <div class="value">${request.quantity} kg</div>
          </div>
          <div class="info-item">
            <div class="label">Estimated Price</div>
            <div class="value">LKR ${request.estimatedPrice}</div>
          </div>
          <div class="info-item">
            <div class="label">Address</div>
            <div class="value">${request.address}</div>
          </div>
          <div class="info-item">
            <div class="label">City</div>
            <div class="value">${request.city}</div>
          </div>
          <div class="info-item">
            <div class="label">Pick-Up Date</div>
            <div class="value">${new Date(
              request.pickUpDate
            ).toLocaleDateString("en-GB", {
              weekday: "long", // Shows the full name of the weekday (e.g., "Monday")
              year: "numeric", // Shows the full year (e.g., "2023")
              month: "long", // Shows the full name of the month (e.g., "October")
              day: "numeric", // Shows the numeric day of the month (e.g., "3")
            })}, ${new Date(request.pickUpDate).toLocaleTimeString("en-GB", {
            hour: "2-digit", // Shows the hour in 2-digit format (e.g., "09")
            minute: "2-digit", // Shows the minutes in 2-digit format (e.g., "30")
            hour12: true, // Formats the time to 12-hour format with AM/PM
          })}</div>
          </div>
          <div class="info-item">
            <div class="label">Status</div>
            <div class="value">${getStatusBadge(request.requestStatus)}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
};

// Function to generate a random password
const generatePassword = (length = 8) => {
  return crypto.randomBytes(length).toString("hex").slice(0, length); // Generate password with specified length
};
// Helper function to generate a random number suffix
const generateUsername = (name) => {
  const randomSuffix = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
  const cleanName = name.toLowerCase().replace(/\s+/g, ""); // Remove spaces and convert to lowercase
  return `${cleanName}${randomSuffix}`;
};
