import WasteRequest from "../models/wasteRequest.model.js";
import WasteCategory from "../models/wasteCategory.model.js";
import WasteTruck from "../models/driver.model.js";
import District from "../models/district.model.js";
import User from "../models/user.model.js";
import GoogleSendMail from "../utils/sendEmail.js";
import Payment from "../models/payment.model.js";
import generatePDFFromHtml from "../utils/pdfGenerator.js";
import ChartJsImage from "chartjs-to-image";

/**
 * Waste Request Controller
 * Handles CRUD operations for waste requests
 * @module controllers/wasteRequest.controller
 * @requires models/wasteRequest.model
 * @requires models/wasteCategory.model
 * @requires models/driver.model
 * @requires models/district.model
 * @requires models/user.model
 * @requires utils/sendEmail
 * @requires models/payment.model
 * @requires utils/pdfGenerator
 * @requires chartjs-to-image
 * @requires models/payment.model
 */

/**
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {string} req.body.userId - User ID
 * @param {string} req.body.wasteCategory - Waste category ID
 * @param {string} req.body.district - District ID
 * @param {string} req.body.city - City
 * @param {string} req.body.address - Address
 * @param {Object} req.body.location - Location coordinates
 * @param {string} req.body.location.type - Location type
 * @param {Array} req.body.location.coordinates - Location coordinates
 * @param {Date} req.body.pickUpDate - Pick up date
 * @param {number} req.body.quantity - Quantity in kg
 * @param {number} req.body.estimatedPrice - Estimated price in LKR
 * @error {400} Please fill in all fields
 * @error {400} Please fill in your NIC and phone number in your profile
 * @error {400} Please login to create a waste request
 * @error {400} Quantity must be greater than 0
 * @error {400} Estimated price must be greater than 0
 * @error {500} Server error
 * @returns {JSON} New waste request data
 */
export const createWasteRequest = async (req, res) => {
  try {
    const {
      userId,
      wasteCategory,
      district,
      city,
      address,
      pickUpDate,
      quantity,
      estimatedPrice,
      location,
    } = req.body;

    // Validations
    if (
      !userId ||
      !wasteCategory ||
      !district ||
      !city ||
      !address ||
      !location ||
      !pickUpDate ||
      !quantity ||
      !estimatedPrice
    ) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    const foundUser = await User.findById(userId);
    if (foundUser) {
      if (foundUser.nic === null || foundUser.phone === null) {
        return res.status(400).json({
          message: "Please fill in your NIC and phone number in your profile",
        });
      }
    }
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Please login to create a waste request" });
    }
    if (quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }
    if (estimatedPrice <= 0) {
      return res
        .status(400)
        .json({ message: "Estimated price must be greater than 0" });
    }
    if (
      !location ||
      !location.type ||
      location.type !== "Point" ||
      !location.coordinates ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({ message: "Invalid location data" });
    }
    if (
      new Date(pickUpDate) <
      new Date(new Date().setDate(new Date().getDate() + 2))
    ) {
      return res.status(400).json({
        message: "Pick-up date must be at least 2 days in the future",
      });
    }

    // Create waste request
    const wasteRequest = new WasteRequest({
      wasteCategory,
      district,
      city,
      address,
      location,
      pickUpDate,
      quantity,
      estimatedPrice,
      user: userId,
    });
    await wasteRequest.save();

    // Update district with the new waste request
    const foundDistrict = await District.findById(district);
    foundDistrict.wasteRequests.push(wasteRequest._id);
    await foundDistrict.save();

    // Calculate payment due date (1 day before the pickUpDate)
    let paymentDueDate = new Date(pickUpDate);
    paymentDueDate.setDate(paymentDueDate.getDate() - 1);

    // Check if payment is required based on the waste category
    const wasteCategoryPayment = await WasteCategory.findById(wasteCategory);
    let payment;
    if (wasteCategoryPayment.isUserPaymentRequired) {
      payment = new Payment({
        user: userId,
        amount: estimatedPrice,
        status: "PENDING",
        request: wasteRequest._id,
        paymentDueDate: paymentDueDate,
        isAdminPayment: false,
      });
      await payment.save();
      wasteRequest.payment = payment._id;
      await wasteRequest.save();
    } else {
      payment = new Payment({
        user: userId,
        amount: estimatedPrice,
        status: "PENDING",
        request: wasteRequest._id,
        paymentDueDate: paymentDueDate,
        isAdminPayment: true,
      });
      await payment.save();
      wasteRequest.payment = payment._id;
      await wasteRequest.save();
    }
    // Fetch user details for email
    const user = await User.findById(userId);
    // Prepare email data
    const emailData = {
      name: user?.username,
      wasteCategory: wasteCategoryPayment.name, // Assuming wasteCategory object has 'name' field
      quantity,
      estimatedPrice,
      pickUpDate: new Date(pickUpDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      paymentDueDate: paymentDueDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      isPaymentRequired: wasteCategoryPayment.isUserPaymentRequired
        ? "Payment is required."
        : "No payment is required.",
    };

    // Send email to the user
    try {
      await GoogleSendMail({
        email: user?.email,
        subject: "Waste Request Submitted Successfully - Waste Zero",
        template: "wasteRequestSubmitted.ejs", // Path to the email template
        data: emailData,
      });
    } catch (error) {
      console.log(error);
    }

    // Respond with the created waste request
    res.status(201).json({ wasteRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @error {500} Something went wrong
 * @returns {JSON} Waste requests data
 * @returns {number} totalWasteRequests - Total waste requests
 * @returns {number} totalPendingRequests - Total pending requests
 * @returns {number} totalAcceptedRequests - Total accepted requests
 * @returns {number} totalRejectedRequests - Total rejected requests
 * @returns {number} totalAcceptedRequestsByTruckDrivers - Total accepted requests by truck drivers
 * @returns {number} totalRejectedRequestsByTruckDrivers - Total rejected requests by truck drivers
 * @returns {number} totalPendingRequestsByTruckDrivers - Total pending requests by truck drivers
 * @returns {number} totalCollectionPendingRequests - Total collection pending requests
 * @returns {number} totalCollectionCompletedRequests - Total collection completed requests
 * @returns {number} totalCollectionRejectedRequests - Total collection rejected requests
 * @returns {Array} wasteRequests - List of waste requests
 */
export const getWasteRequests = async (req, res) => {
  try {
    const wasteRequests = await WasteRequest.find()
      .populate("driver")
      .populate("wasteCategory")
      .populate("district")
      .populate("user")
      .populate("payment");
    const totalWasteRequests = wasteRequests.length;
    const totalPendingRequests = wasteRequests.filter(
      (request) => request.requestStatus === "PENDING"
    ).length;
    const totalAcceptedRequests = wasteRequests.filter(
      (request) => request.requestStatus === "ACCEPTED"
    ).length;
    const totalRejectedRequests = wasteRequests.filter(
      (request) => request.requestStatus === "REJECTED"
    ).length;
    const totalAcceptedRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "ACCEPTED"
    ).length;
    const totalRejectedRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "REJECTED"
    ).length;
    const totalPendingRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "PENDING"
    ).length;
    const totalCollectionPendingRequests = wasteRequests.filter(
      (request) => request.collectionStatus === "PENDING"
    ).length;
    const totalCollectionCompletedRequests = wasteRequests.filter(
      (request) => request.collectionStatus === "COMPLETED"
    ).length;
    const totalCollectionRejectedRequests = wasteRequests.filter(
      (request) => request.collectionStatus === "REJECTED"
    ).length;
    res.status(200).json({
      totalWasteRequests,
      totalPendingRequests,
      totalAcceptedRequests,
      totalRejectedRequests,
      totalAcceptedRequestsByTruckDrivers,
      totalRejectedRequestsByTruckDrivers,
      totalPendingRequestsByTruckDrivers,
      totalCollectionPendingRequests,
      totalCollectionCompletedRequests,
      totalCollectionRejectedRequests,
      wasteRequests,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getWasteRequestByUserId = async (req, res) => {
  try {
    const wasteRequests = await WasteRequest.find({ user: req.params.userId })
      .populate("driver")
      .populate("wasteCategory")
      .populate("district")
      .populate("user")
      .populate("payment");
    const totalWasteRequests = wasteRequests.length;
    const totalPendingRequests = wasteRequests.filter(
      (request) => request.requestStatus === "PENDING"
    ).length;
    const totalAcceptedRequests = wasteRequests.filter(
      (request) => request.requestStatus === "ACCEPTED"
    ).length;
    const totalRejectedRequests = wasteRequests.filter(
      (request) => request.requestStatus === "REJECTED"
    ).length;
    const totalAcceptedRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "ACCEPTED"
    ).length;
    const totalRejectedRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "REJECTED"
    ).length;
    const totalPendingRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "PENDING"
    ).length;
    res.status(200).json({
      totalWasteRequests,
      totalPendingRequests,
      totalAcceptedRequests,
      totalRejectedRequests,
      totalAcceptedRequestsByTruckDrivers,
      totalRejectedRequestsByTruckDrivers,
      totalPendingRequestsByTruckDrivers,
      wasteRequests,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getDriverRequests = async (req, res) => {
  try {
    const driver = await WasteTruck.findOne({ userId: req.params.id });
    const wasteRequests = await WasteRequest.find({ driver: driver._id })
      .populate("driver")
      .populate("wasteCategory")
      .populate("district")
      .populate("user");
    const totalWasteRequests = wasteRequests.length;
    const totalPendingRequests = wasteRequests.filter(
      (request) => request.requestStatus === "PENDING"
    ).length;
    const totalAcceptedRequests = wasteRequests.filter(
      (request) => request.requestStatus === "ACCEPTED"
    ).length;
    const totalRejectedRequests = wasteRequests.filter(
      (request) => request.requestStatus === "REJECTED"
    ).length;
    const totalAcceptedRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "ACCEPTED"
    ).length;
    const totalRejectedRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "REJECTED"
    ).length;
    const totalPendingRequestsByTruckDrivers = wasteRequests.filter(
      (request) => request.truckDriverStatus === "PENDING"
    ).length;
    res.status(200).json({
      totalWasteRequests,
      totalPendingRequests,
      totalAcceptedRequests,
      totalRejectedRequests,
      totalAcceptedRequestsByTruckDrivers,
      totalRejectedRequestsByTruckDrivers,
      totalPendingRequestsByTruckDrivers,
      wasteRequests,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateWasteRequest = async (req, res, next) => {
  const { id } = req.params; // Waste request ID from URL params
  const {
    wasteCategory,
    district,
    city,
    address,
    location,
    pickUpDate,
    quantity,
    estimatedPrice,
    driver,
    requestStatus,
    truckDriverStatus,
  } = req.body; // Request body

  try {
    // Find the existing waste request
    const wasteRequest = await WasteRequest.findById(id);
    if (!wasteRequest) {
      const error = new Error("Waste request not found");
      error.statusCode = 404;
      return next(error);
    }

    if (wasteRequest.requestStatus === "ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Cannot update an accepted waste request" });
    }

    // Update waste category if passed
    if (wasteCategory) {
      wasteRequest.wasteCategory = wasteCategory;
      const foundWasteCategory = await WasteCategory.findById(wasteCategory);
      if (!foundWasteCategory) {
        const error = new Error("Waste category not found");
        error.statusCode = 404;
        return next(error);
      }
      const payment = await Payment.findById(wasteRequest.payment);
      if (!payment) {
        const error = new Error("Payment not found");
        error.statusCode = 404;
        return next(error);
      } else {
        if (foundWasteCategory.isUserPaymentRequired === true) {
          payment.isAdminPayment = false;
        } else {
          payment.isAdminPayment = true;
        }
        await payment.save();
      }
    }

    if (estimatedPrice > 0) {
      const payment = await Payment.findById(wasteRequest.payment);
      payment.amount = estimatedPrice;
      await payment.save();
    }

    if (pickUpDate) {
      const payment = await Payment.findById(wasteRequest.payment);
      const paymentDueDate = new Date(pickUpDate).setDate(
        new Date(pickUpDate).getDate() - 1
      );
      payment.paymentDueDate = paymentDueDate;
      await payment.save();
    }

    // Handle district change
    if (district) {
      const oldDistrict = wasteRequest.district;
      const foundOldDistrict = await District.findById(oldDistrict);
      const foundNewDistrict = await District.findById(district);

      if (!foundNewDistrict) {
        const error = new Error("New district not found");
        error.statusCode = 404;
        return next(error);
      }

      if (foundOldDistrict) {
        foundOldDistrict.wasteRequests.pull(wasteRequest._id);
        await foundOldDistrict.save();
      }

      foundNewDistrict.wasteRequests.push(wasteRequest._id);
      await foundNewDistrict.save();

      wasteRequest.district = district;
    }

    if (city) wasteRequest.city = city;
    if (address) wasteRequest.address = address;
    if (location && location.coordinates && location.type === "Point") {
      wasteRequest.location = location;
    }
    if (pickUpDate) wasteRequest.pickUpDate = pickUpDate;
    if (quantity > 0) wasteRequest.quantity = quantity;
    if (estimatedPrice > 0) wasteRequest.estimatedPrice = estimatedPrice;

    if (driver) {
      const foundDriver = await WasteTruck.findById(driver);
      if (!foundDriver) {
        const error = new Error("Driver not found");
        error.statusCode = 404;
        return next(error);
      }
      wasteRequest.driver = driver;
    }

    if (requestStatus) {
      const validStatuses = ["PENDING", "ACCEPTED", "REJECTED"];
      if (!validStatuses.includes(requestStatus)) {
        return next(errorHandler(400, "Invalid request status"));
      }
      wasteRequest.requestStatus = requestStatus;
    }

    if (truckDriverStatus) {
      const validTruckStatuses = ["PENDING", "ACCEPTED", "REJECTED"];
      if (!validTruckStatuses.includes(truckDriverStatus)) {
        return next(errorHandler(400, "Invalid truck driver status"));
      }
      wasteRequest.truckDriverStatus = truckDriverStatus;
    }

    // Save the updated waste request
    await wasteRequest.save();

    const updatedRequest = await WasteRequest.findById(id)
      .populate("wasteCategory")
      .populate("district")
      .populate("user")
      .populate("payment");

    // Prepare email data
    const emailData = {
      name: updatedRequest?.user?.username,
      wasteCategory: updatedRequest?.wasteCategory?.name,
      quantity: updatedRequest?.quantity,
      estimatedPrice: updatedRequest?.estimatedPrice,
      pickUpDate: new Date(updatedRequest?.pickUpDate).toLocaleDateString(
        "en-GB"
      ),
      address: updatedRequest?.address,
      city: updatedRequest?.city,
      district: updatedRequest?.district?.name,
      paymentRequired: updatedRequest?.payment?.isAdminPayment
        ? "No Payment Required"
        : `Payment Required: LKR ${updatedRequest?.payment?.amount}`,
    };

    // Send the email using GoogleSendMail
    await GoogleSendMail({
      email: updatedRequest?.user?.email,
      subject: "Waste Request Update - Waste Zero",
      template: "wasteUpdateRequest.ejs", // Path to the template in mails folder
      data: emailData,
    });

    // Return the updated waste request
    res.status(200).json({
      success: true,
      message: "Waste request updated successfully",
      wasteRequest: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWasteRequest = async (req, res) => {
  try {
    const wasteRequest = await WasteRequest.findById(req.params.id);
    if (!wasteRequest) {
      return res.status(404).json({ message: "Waste request not found" });
    }
    if (wasteRequest.requestStatus === "ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Cannot delete an accepted waste request" });
    }
    const foundDistrict = await District.findById(wasteRequest.district);
    foundDistrict.wasteRequests.pull(req.params.id);
    await foundDistrict.save();
    await WasteRequest.findByIdAndDelete(req.params.id);
    const payment = await Payment.findById(wasteRequest.payment);
    if (payment) {
      await Payment.findByIdAndDelete(payment._id);
    }
    const user = await User.findById(wasteRequest.user);
    // Send email notification to the user
    const emailData = {
      name: user.name, // User's name
      wasteCategory: wasteRequest.wasteCategory, // Waste category
      quantity: wasteRequest.quantity, // Quantity in kg
      estimatedPrice: wasteRequest.estimatedPrice, // Estimated price in LKR
      pickUpDate: new Date(wasteRequest.pickUpDate).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      ),
    };

    await GoogleSendMail({
      email: user.email, // User's email
      subject: "Waste Request Deleted - Waste Zero", // Subject
      template: "wasteDeletionRequest.ejs", // Template path in your 'mails' folder
      data: emailData, // Data passed to the template
    });
    res.status(200).json({ message: "Waste request deleted successfully" });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const assignDriverToRequest = async (req, res, next) => {
  const { requestId, driverId } = req.body;
  try {
    // Find the waste request by ID
    const wasteRequest = await WasteRequest.findById(requestId)
      .populate("user")
      .populate("driver")
      .populate("wasteCategory");
    if (!wasteRequest) {
      const error = new Error("Waste request not found");
      error.statusCode = 404;
      return next(error);
    }

    if (wasteRequest.driver === driverId) {
      return res
        .status(400)
        .json({ message: "Driver is already assigned to this request" });
    }

    // Check if the waste request already has an accepted driver
    if (wasteRequest.truckDriverStatus === "ACCEPTED") {
      return res.status(400).json({
        message:
          "Driver is already assigned and has accepted the request. You cannot reassign another driver.",
      });
    }

    // Remove the old driver if one is assigned
    if (wasteRequest.driver) {
      const oldDriver = await WasteTruck.findById(wasteRequest.driver);
      oldDriver.wasteRequests.pull(requestId);
      await oldDriver.save();
    }

    // Find the new driver by ID
    const driver = await WasteTruck.findById(driverId);
    if (!driver) {
      const error = new Error("Driver not found");
      error.statusCode = 404;
      return next(error);
    }

    // Prepare email data with the driver (collector) information
    const emailData = {
      name: wasteRequest?.user?.username,
      wasteCategory: wasteRequest.wasteCategory?.name, // Assuming you have the category name
      quantity: wasteRequest?.quantity,
      estimatedPrice: wasteRequest?.estimatedPrice,
      pickUpDate: new Date(wasteRequest?.pickUpDate).toLocaleDateString(
        "en-GB"
      ),
      address: wasteRequest?.address,
      city: wasteRequest?.city,
      district: wasteRequest?.district, // Assuming you have the district name
      collectorName: driver?.name, // Assuming the driver has a 'name' field
      collectorContact: driver?.phone, // Assuming the driver has a 'contactNumber' field
      vehicleNumber: driver?.vehicleNumber, // Assuming driver has truck details (if applicable)
    };

    try {
      // Send email notification to the user
      await GoogleSendMail({
        email: wasteRequest?.user?.email,
        subject: "Driver Assigned to Waste Request - Waste Zero",
        template: "driverAssignedRequest.ejs", // Path to the email template in the 'mails' folder
        data: emailData,
      });
    } catch (error) {
      return res.status(500).json(error);
    }

    // Assign the new driver to the waste request
    wasteRequest.driver = driverId;
    wasteRequest.truckDriverStatus = "PENDING"; // Reset status to pending when assigning a new driver
    driver.wasteRequests.push(requestId);
    await driver.save();
    await wasteRequest.save();

    // Return success response
    res.status(200).json({
      success: true,
      message: "Driver assigned to waste request successfully",
      wasteRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (req, res) => {
  const { id, city } = req.body;

  try {
    let filter = {};
    if (id) filter.district = id;
    if (city) filter.city = city;

    const wasteRequests = await WasteRequest.find(filter)
      .populate("district")
      .populate("user")
      .populate("wasteCategory")
      .populate("driver")
      .populate("payment")
      .sort("pickUpDate");

    if (wasteRequests.length === 0) {
      return res
        .status(404)
        .json({ message: "No waste requests found for the given criteria." });
    }

    // Calculate statistics
    const stats = calculateStats(wasteRequests);

    // Generate charts
    const statusChartUrl = await generateStatusChart(stats);
    const categoryChartUrl = await generateCategoryChart(stats);
    const cityChartUrl = await generateCityChart(stats);
    const cityQuantityChartUrl = await generateCityQuantityChart(stats);

    // Ensure all chart URLs are available before generating the report
    if (!statusChartUrl || !categoryChartUrl || !cityChartUrl) {
      throw new Error("Failed to generate one or more charts");
    }

    // Create HTML content for the report
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Comprehensive Waste Request Report</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .summary, .charts, .request-section {
                margin: 20px auto;
                padding: 15px;
                border: 2px solid #ccc;
                border-radius: 10px;
                background-color: #f9f9f9;
              }
              .summary h2, .charts h2 { color: #2c3e50; text-align: center; }
              .stat-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
              }
              .stat-item {
                background-color: #ecf0f1;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .stat-value { font-size: 1.2em; font-weight: bold; color: #3498db; }
              .request-section h3 { color: #2980b9; }
              .request-detail {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid #bdc3c7;
                border-radius: 5px;
                background-color: #ecf0f1;
              }
              .status { font-weight: bold; }
              .status-PENDING { color: #f39c12; }
              .status-ACCEPTED, .status-COMPLETED { color: #27ae60; }
              .status-REJECTED, .status-CANCELLED { color: #c0392b; }
              .charts { text-align: center; }
              .chart { 
                display: block;
                width: 90%;
                margin: 20px auto;
                page-break-after: always;
              }
              .chart img { 
                max-width: 100%;
                height: auto;
              }
              .chart-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
              }
                .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .stat-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .icon-wrapper {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            flex-shrink: 0;
          }

          .stat-content {
            flex-grow: 1;
          }

          .stat-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
          }

          /* Icon-specific backgrounds */
          .bg-blue { background: #e0f2fe; }
          .bg-yellow { background: #fef9c3; }
          .bg-green { background: #dcfce7; }
          .bg-red { background: #fee2e2; }
          .bg-purple { background: #f3e8ff; }
          .bg-indigo { background: #e0e7ff; }

          /* Icon-specific colors */
          .text-blue { color: #0284c7; }
          .text-yellow { color: #ca8a04; }
          .text-green { color: #16a34a; }
          .text-red { color: #dc2626; }
          .text-purple { color: #9333ea; }
          .text-indigo { color: #4f46e5; }

          .stat-icon {
            width: 24px;
            height: 24px;
          }

           .request-detail {
            margin-bottom: 20px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background-color: #f8fafc;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .request-detail h3 {
            color: #2c3e50;
            margin-top: 0;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .request-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
        }
        .info-icon {
            width: 24px;
            height: 24px;
            margin-right: 10px;
            color: #3498db;
        }
        .status-icon {
            width: 16px;
            height: 16px;
            margin-right: 5px;
        }
          </style>
          <script src="https://kit.fontawesome.com/a076d05399.js"></script>
      </head>
      <body>
<div class="summary">
    <h2 style="text-align: center; color: #1e293b; font-size: 24px; margin-bottom: 30px;">
      Waste Request Report Summary
    </h2>
    <div class="stats-grid">
      <!-- Total Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-blue">
          <svg class="stat-icon text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Requests</div>
          <div class="stat-value">${stats.TotalRequests}</div>
        </div>
      </div>

      <!-- Pending Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-yellow">
          <svg class="stat-icon text-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Pending Requests</div>
          <div class="stat-value">${stats.PendingRequests}</div>
        </div>
      </div>

      <!-- Accepted Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-green">
          <svg class="stat-icon text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Accepted Requests</div>
          <div class="stat-value">${stats.AcceptedRequests}</div>
        </div>
      </div>

      <!-- Rejected Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-red">
          <svg class="stat-icon text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Rejected Requests</div>
          <div class="stat-value">${stats.RejectedRequests}</div>
        </div>
      </div>

      <!-- Completed Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-purple">
          <svg class="stat-icon text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Completed Requests</div>
          <div class="stat-value">${stats.CompletedFullyRequests}</div>
        </div>
      </div>

      <!-- Total Waste Quantity -->
      <div class="stat-card">
        <div class="icon-wrapper bg-indigo">
          <svg class="stat-icon text-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Waste Quantity (KG)</div>
          <div class="stat-value">${stats.TotalWasteQuantity}</div>
        </div>
      </div>
    </div>


        <div class="charts">
          <h2>Visual Analytics</h2>
          <div class="chart">
            <div class="chart-title">Request Status Distribution</div>
            <img src="${statusChartUrl}" alt="Request Status Distribution">
          </div>
          <div class="chart">
            <div class="chart-title">Waste Quantities by Category</div>
            <img src="${categoryChartUrl}" alt="Waste Categories Distribution">
          </div>
          <div class="chart">
            <div class="chart-title">Waste Requests by City</div>
            <img src="${cityChartUrl}" alt="Waste Requests by City">
          </div>
          <div class="chart">
            <div class="chart-title">Waste Quantity by City</div>
            <img src="${cityQuantityChartUrl}" alt="Waste Requests by City">
          </div>
        </div>

            <div class="request-section">
        <h2>Detailed Waste Requests</h2>
        ${wasteRequests
          .map(
            (request, index) => `
        <div class="request-detail">
            <h3>Request #${index + 1}</h3>
            <div class="request-info">
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    <span><strong>Waste Category:</strong> ${
                      request.wasteCategory ? request.wasteCategory.name : "N/A"
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span><strong>District:</strong> ${
                      request.district ? request.district.name : "N/A"
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    <span><strong>City:</strong> ${request.city}</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    <span><strong>Address:</strong> ${request.address}</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span><strong>Pickup Date:</strong> ${new Date(
                      request.pickUpDate
                    ).toLocaleDateString()}</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                    <span><strong>Quantity:</strong> ${
                      request.quantity
                    } KG</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Estimated Price:</strong> LKR ${
                      request.estimatedPrice
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span><strong>User:</strong> ${
                      request.user ? request.user.username : "N/A"
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Request Status</strong> <span class="status status-${
                      request.requestStatus
                    }">${request.requestStatus}</span></span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Truck Driver Status</strong> <span class="status status-${
                      request.truckDriverStatus
                    }">${request.truckDriverStatus}</span></span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Collection Status</strong> <span class="status status-${
                      request.collectionStatus
                    }">${request.collectionStatus}</span></span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Payment Status</strong> <span class="status status-${
                      request.paymentStatus
                    }">${request.paymentStatus}</span></span>
                </div>
                ${
                  request.driver
                    ? `
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6M23 11h-6"></path></svg>
                    <span><strong>Assigned Driver:</strong> ${request.driver.name}</span>
                </div>
                `
                    : ""
                }
                ${
                  request.payment
                    ? `
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span><strong>Payment Amount:</strong> LKR ${request.payment.amount}</span>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
          )
          .join("")}
    </div>
      </body>
      </html>
    `;

    // Generate PDF from the HTML content (implementation not shown)
    const pdfBuffer = await generatePDFFromHtml(htmlContent);

    // Set the response headers and send the PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition":
        'attachment; filename="comprehensive-waste-request-report.pdf"',
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function calculateStats(wasteRequests) {
  const stats = {
    TotalRequests: wasteRequests.length,
    PendingRequests: 0,
    AcceptedRequests: 0,
    RejectedRequests: 0,
    CompletedFullyRequests: 0,
    TotalWasteQuantity: 0,
    RequestsPerCity: {},
    RequestsPerWasteCategory: {},
    QuantityPerWasteCategory: {},
    QuantityPerCity: {},
  };

  wasteRequests.forEach((request) => {
    // Count total waste quantity
    stats.TotalWasteQuantity += request.quantity;

    // Count requests by status
    switch (request.requestStatus) {
      case "PENDING":
        stats.PendingRequests++;
        break;
      case "ACCEPTED":
        stats.AcceptedRequests++;
        break;
      case "REJECTED":
        stats.RejectedRequests++;
        break;
    }

    // Count fully completed requests
    if (
      request.requestStatus === "ACCEPTED" &&
      request.truckDriverStatus === "ACCEPTED" &&
      request.collectionStatus === "COMPLETED" &&
      request.paymentStatus === "COMPLETED"
    ) {
      stats.CompletedFullyRequests++;
    }

    // Count requests per city
    stats.RequestsPerCity[request.city] =
      (stats.RequestsPerCity[request.city] || 0) + 1;

    stats.QuantityPerCity[request.city] =
      (stats.QuantityPerCity[request.city] || 0) + request.quantity;

    // Count requests and quantities per waste category
    const categoryName = request.wasteCategory?.name || "Uncategorized";
    stats.RequestsPerWasteCategory[categoryName] =
      (stats.RequestsPerWasteCategory[categoryName] || 0) + 1;
    stats.QuantityPerWasteCategory[categoryName] =
      (stats.QuantityPerWasteCategory[categoryName] || 0) + request.quantity;
  });

  // Round numerical values for better readability
  for (let key in stats) {
    if (typeof stats[key] === "number") {
      stats[key] = Number(stats[key].toFixed(2));
    }
  }

  return stats;
}

/**
 *
 * @param {object} stats - Statistics object containing waste request data
 * @returns {Promise<string>} - Short URL of the generated chart image
 */
async function generateStatusChart(stats) {
  const chart = new ChartJsImage();
  chart.setConfig({
    type: "pie",
    data: {
      labels: ["Pending", "Accepted", "Rejected", "Completed"],
      datasets: [
        {
          data: [
            stats.PendingRequests,
            stats.AcceptedRequests,
            stats.RejectedRequests,
            stats.CompletedFullyRequests,
          ],
          backgroundColor: ["#f39c12", "#27ae60", "#c0392b", "#2980b9"],
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Request Status Distribution",
          font: {
            size: 20,
          },
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });
  chart.setWidth(800);
  chart.setHeight(600);
  return await chart.getShortUrl();
}

/**
 *
 * @param {object} stats - Statistics object containing waste request data
 * @returns {Promise<string>} - Short URL of the generated chart image
 */
async function generateCategoryChart(stats) {
  const chart = new ChartJsImage();
  chart.setConfig({
    type: "bar",
    data: {
      labels: Object.keys(stats.QuantityPerWasteCategory),
      datasets: [
        {
          label: "Waste Quantity (KG)",
          data: Object.values(stats.QuantityPerWasteCategory),
          backgroundColor: "#3498db",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Waste Quantities by Category",
          font: {
            size: 20,
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Quantity (KG)",
          },
        },
      },
    },
  });
  chart.setWidth(800);
  chart.setHeight(600);
  return await chart.getShortUrl();
}

/**
 *
 * @param {object} stats - Statistics object containing waste request data
 * @returns {Promise<string>} - Short URL of the generated chart image
 */
async function generateCityChart(stats) {
  const chart = new ChartJsImage();
  chart.setConfig({
    type: "bar",
    data: {
      labels: Object.keys(stats.RequestsPerCity),
      datasets: [
        {
          label: "Number of Requests",
          data: Object.values(stats.RequestsPerCity),
          backgroundColor: "#2ecc71",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Waste Requests by City",
          font: {
            size: 20,
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Requests",
          },
        },
      },
    },
  });
  chart.setWidth(800);
  chart.setHeight(600);
  return await chart.getShortUrl();
}

/**
 *
 * @param {object} stats - Statistics object containing waste request data
 * @returns {Promise<string>} - Short URL of the generated chart image
 */
async function generateCityQuantityChart(stats) {
  const chart = new ChartJsImage();
  chart.setConfig({
    type: "bar",
    data: {
      labels: Object.keys(stats.QuantityPerCity),
      datasets: [
        {
          label: "Waste Quantity (KG)",
          data: Object.values(stats.QuantityPerCity),
          backgroundColor: "#9b59b6",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Waste Quantity Distribution by City",
          font: {
            size: 20,
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Quantity (KG)",
          },
        },
      },
    },
  });
  chart.setWidth(800);
  chart.setHeight(600);
  return await chart.getShortUrl();
}

/**
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {String} req.body.requestId - ID of the waste request
 * @error {404} - Waste request not found
 * @returns {JSON} - JSON response with success status and updated waste request
 */
export const handleConfirmation = async (req, res, next) => {
  const { requestId } = req.body;
  try {
    const wasteRequest = await WasteRequest.findById(requestId)
      .populate("user")
      .populate("wasteCategory");
    if (!wasteRequest) {
      return res.status(404).json({ message: "Waste request not found" });
    }
    wasteRequest.collectionStatus = "COMPLETED";
    const emailData = {
      name: wasteRequest?.user?.username,
      wasteCategory: wasteRequest?.wasteCategory?.name, // Assuming wasteCategory object has 'name' field
      quantity: wasteRequest?.quantity,
      estimatedPrice: wasteRequest?.estimatedPrice,
      confirmationDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }), // This will capture the current date of confirmation
    };

    // Send email to the user
    try {
      await GoogleSendMail({
        email: wasteRequest?.user?.email,
        subject: "Waste Request Collection Confirmation - Waste Zero",
        template: "collectionConfirmation.ejs", // Path to the email template
        data: emailData,
      });
    } catch (error) {
      console.log(error);
    }
    await wasteRequest.save();
    res.status(200).json({
      success: true,
      message: "Truck driver status updated successfully",
      wasteRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {String} req.body.requestId - ID of the waste request
 * @param {Number} req.body.rating - Rating value (1-5)
 * @param {String} req.body.comment - Feedback comment
 * @error {404} - Waste request not found
 * @returns {JSON} - JSON response with success status and updated waste request
 */
export const handleFeedback = async (req, res, next) => {
  const { requestId, rating, comment } = req.body;

  try {
    const wasteRequest = await WasteRequest.findById(requestId)
      .populate("user")
      .populate("wasteCategory")
      .populate("driver");
    if (!wasteRequest) {
      return res.status(404).json({ message: "Waste request not found" });
    }
    wasteRequest.ratingValue = rating;
    wasteRequest.ratingComment = comment;
    const emailData = {
      name: wasteRequest?.user?.username,
      rating: rating,
      comment: comment,
    };
    try {
      await GoogleSendMail({
        email: wasteRequest?.user?.email,
        subject: "Feedback on Waste Collection - Waste Zero",
        template: "feedback.ejs", // Path to the email template
        data: emailData,
      }); // Send email to the user
    } catch (error) {
      console.log(error);
    }
    const emailDataDriver = {
      name: wasteRequest?.driver?.name,
      user: wasteRequest?.user?.username,
      rating: rating,
      comment: comment,
    };
    try {
      await GoogleSendMail({
        email: wasteRequest?.driver?.email,
        subject: "Feedback on Waste Collection - Waste Zero",
        template: "feedbackDriver.ejs", // Path to the email template
        data: emailDataDriver,
      }); // Send email to the user
    } catch (error) {
      console.log(error);
    }
    await wasteRequest.save();
    res.status(200).json({
      success: true,
      message: "Feedback added successfully",
      wasteRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {user} req.body.user - User ID
 * @param {date} req.body.date - Pick up date
 * @error {500} - Internal server error
 * @error {Error} - Failed to generate one or more charts
 * @error {Error} - Failed to generate PDF from HTML content
 * @returns {JSON} - JSON response with the generated PDF report
 */
export const generateReportPickUpDateByUser = async (req, res) => {
  try {
    const { user, date } = req.body;
    const wasteRequests = await WasteRequest.find({
      user: user,
      pickUpDate: date.value,
    })
      .populate("user")
      .populate("wasteCategory")
      .populate("driver");

    const stats = calculateStats(wasteRequests);
    const statusChartUrl = await generateStatusChart(stats);
    const categoryChartUrl = await generateCategoryChart(stats);
    const cityChartUrl = await generateCityChart(stats);
    const cityQuantityChartUrl = await generateCityQuantityChart(stats);

    // Ensure all chart URLs are available before generating the report
    if (!statusChartUrl || !categoryChartUrl || !cityChartUrl) {
      throw new Error("Failed to generate one or more charts");
    }

    // Create HTML content for the report
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Comprehensive Waste Request Report</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .summary, .charts, .request-section {
                margin: 20px auto;
                padding: 15px;
                border: 2px solid #ccc;
                border-radius: 10px;
                background-color: #f9f9f9;
              }
              .summary h2, .charts h2 { color: #2c3e50; text-align: center; }
              .stat-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
              }
              .stat-item {
                background-color: #ecf0f1;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .stat-value { font-size: 1.2em; font-weight: bold; color: #3498db; }
              .request-section h3 { color: #2980b9; }
              .request-detail {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid #bdc3c7;
                border-radius: 5px;
                background-color: #ecf0f1;
              }
              .status { font-weight: bold; }
              .status-PENDING { color: #f39c12; }
              .status-ACCEPTED, .status-COMPLETED { color: #27ae60; }
              .status-REJECTED, .status-CANCELLED { color: #c0392b; }
              .charts { text-align: center; }
              .chart { 
                display: block;
                width: 90%;
                margin: 20px auto;
                page-break-after: always;
              }
              .chart img { 
                max-width: 100%;
                height: auto;
              }
              .chart-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
              }
                .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .stat-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .icon-wrapper {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .stat-content {
      flex-grow: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
    }

    /* Icon-specific backgrounds */
    .bg-blue { background: #e0f2fe; }
    .bg-yellow { background: #fef9c3; }
    .bg-green { background: #dcfce7; }
    .bg-red { background: #fee2e2; }
    .bg-purple { background: #f3e8ff; }
    .bg-indigo { background: #e0e7ff; }

    /* Icon-specific colors */
    .text-blue { color: #0284c7; }
    .text-yellow { color: #ca8a04; }
    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
    .text-purple { color: #9333ea; }
    .text-indigo { color: #4f46e5; }

    .stat-icon {
      width: 24px;
      height: 24px;
    }

           .request-detail {
            margin-bottom: 20px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background-color: #f8fafc;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .request-detail h3 {
            color: #2c3e50;
            margin-top: 0;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .request-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
        }
        .info-icon {
            width: 24px;
            height: 24px;
            margin-right: 10px;
            color: #3498db;
        }
        .status-icon {
            width: 16px;
            height: 16px;
            margin-right: 5px;
        }
          </style>
          <script src="https://kit.fontawesome.com/a076d05399.js"></script>
      </head>
      <body>
<div class="summary">
    <h2 style="text-align: center; color: #1e293b; font-size: 24px; margin-bottom: 30px;">
      Waste Request Report Summary
    </h2>
    <div class="stats-grid">
      <!-- Total Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-blue">
          <svg class="stat-icon text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Requests</div>
          <div class="stat-value">${stats.TotalRequests}</div>
        </div>
      </div>

      <!-- Pending Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-yellow">
          <svg class="stat-icon text-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Pending Requests</div>
          <div class="stat-value">${stats.PendingRequests}</div>
        </div>
      </div>

      <!-- Accepted Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-green">
          <svg class="stat-icon text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Accepted Requests</div>
          <div class="stat-value">${stats.AcceptedRequests}</div>
        </div>
      </div>

      <!-- Rejected Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-red">
          <svg class="stat-icon text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Rejected Requests</div>
          <div class="stat-value">${stats.RejectedRequests}</div>
        </div>
      </div>

      <!-- Completed Requests -->
      <div class="stat-card">
        <div class="icon-wrapper bg-purple">
          <svg class="stat-icon text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Completed Requests</div>
          <div class="stat-value">${stats.CompletedFullyRequests}</div>
        </div>
      </div>

      <!-- Total Waste Quantity -->
      <div class="stat-card">
        <div class="icon-wrapper bg-indigo">
          <svg class="stat-icon text-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Waste Quantity (KG)</div>
          <div class="stat-value">${stats.TotalWasteQuantity}</div>
        </div>
      </div>
    </div>


        <div class="charts">
          <h2>Visual Analytics</h2>
          <div class="chart">
            <div class="chart-title">Request Status Distribution</div>
            <img src="${statusChartUrl}" alt="Request Status Distribution">
          </div>
          <div class="chart">
            <div class="chart-title">Waste Quantities by Category</div>
            <img src="${categoryChartUrl}" alt="Waste Categories Distribution">
          </div>
          <div class="chart">
            <div class="chart-title">Waste Requests by City</div>
            <img src="${cityChartUrl}" alt="Waste Requests by City">
          </div>
          <div class="chart">
            <div class="chart-title">Waste Quantity by City</div>
            <img src="${cityQuantityChartUrl}" alt="Waste Requests by City">
          </div>
        </div>

            <div class="request-section">
        <h2>Detailed Waste Requests</h2>
        ${wasteRequests
          .map(
            (request, index) => `
        <div class="request-detail">
            <h3>Request #${index + 1}</h3>
            <div class="request-info">
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    <span><strong>Waste Category:</strong> ${
                      request.wasteCategory ? request.wasteCategory.name : "N/A"
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span><strong>District:</strong> ${
                      request.district ? request.district.name : "N/A"
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    <span><strong>City:</strong> ${request.city}</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    <span><strong>Address:</strong> ${request.address}</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span><strong>Pickup Date:</strong> ${new Date(
                      request.pickUpDate
                    ).toLocaleDateString()}</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                    <span><strong>Quantity:</strong> ${
                      request.quantity
                    } KG</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Estimated Price:</strong> LKR ${
                      request.estimatedPrice
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span><strong>User:</strong> ${
                      request.user ? request.user.username : "N/A"
                    }</span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Request Status</strong> <span class="status status-${
                      request.requestStatus
                    }">${request.requestStatus}</span></span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Truck Driver Status</strong> <span class="status status-${
                      request.truckDriverStatus
                    }">${request.truckDriverStatus}</span></span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Collection Status</strong> <span class="status status-${
                      request.collectionStatus
                    }">${request.collectionStatus}</span></span>
                </div>
                <div class="info-item">
                    <svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span><strong>Payment Status</strong> <span class="status status-${
                      request.paymentStatus
                    }">${request.paymentStatus}</span></span>
                </div>
                ${
                  request.driver
                    ? `
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6M23 11h-6"></path></svg>
                    <span><strong>Assigned Driver:</strong> ${request.driver.name}</span>
                </div>
                `
                    : ""
                }
                ${
                  request.payment
                    ? `
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span><strong>Payment Amount:</strong> LKR ${request.payment.amount}</span>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
          )
          .join("")}
    </div>
      </body>
      </html>
    `;

    // Generate PDF from the HTML content (implementation not shown)
    const pdfBuffer = await generatePDFFromHtml(htmlContent);

    // Set the response headers and send the PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition":
        'attachment; filename="comprehensive-waste-request-report.pdf"',
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
