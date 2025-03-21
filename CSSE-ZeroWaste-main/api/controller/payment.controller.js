import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import WasteRequest from "../models/wasteRequest.model.js";
import generatePDFFromHtml from "../utils/pdfGenerator.js";
import GoogleSendMail from "../utils/sendEmail.js";

/**
 * Payment Controller
 * Handles payment operations including fetching, updating, and deleting payments
 * @module controllers/payment.controller
 * @requires models/payment.model
 * @requires models/user.model
 * @requires models/wasteRequest.model
 * @requires utils/sendEmail
 *
 */

/**
 * Geta all payments
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @error {500} Server error
 * @return {JSON} List of all payments
 */
export const getPayments = async (req, res, next) => {
  try {
    // Fetch all payments from the database and populate the request and user fields
    const payments = await Payment.find()
      .populate({
        path: "request", // Populating the request field
        populate: {
          path: "wasteCategory", // Nested population of the wasteCategory within the request
        },
      })
      .populate("user"); // Populating the user field;
    const total = payments.length;
    const pending = payments.filter(
      (payment) => payment.paymentStatus == "PENDING"
    ).length;
    const completed = payments.filter(
      (payment) => payment.paymentStatus == "COMPLETED"
    ).length;
    const cancelled = payments.filter(
      (payment) => payment.paymentStatus == "CANCELLED"
    ).length;
    res.status(200).json({ total, pending, completed, cancelled, payments });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments for a specific user
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @param {string} req.params.id - User ID
 * @error {404} Payment not found
 * @error {500} Server error
 * @return {JSON} List of payments for a specific user
 */
export const getPaymentsUser = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.params.id })
      .populate({
        path: "request", // Populating the request field
        populate: {
          path: "wasteCategory", // Nested population of the wasteCategory within the request
        },
      })
      .populate("user"); // Populating the user field

    const total = payments.length;
    const pending = payments.filter(
      (payment) => payment.paymentStatus === "PENDING"
    ).length;

    const completed = payments.filter(
      (payment) => payment.paymentStatus === "COMPLETED"
    ).length;

    const cancelled = payments.filter(
      (payment) => payment.paymentStatus === "CANCELLED"
    ).length;

    res.status(200).json({ total, pending, completed, cancelled, payments });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Payment Detials and status
 * @param {object} req
 * @param {object} res
 * @param {Function} next - Express next middleware function
 * @error {500} Server error
 * @error {404} Payment not found
 * @error {404} Waste request not found
 * @error {404} User not found
 * @return {JSON} Updated payment information
 */
export const updatePayment = async (req, res, next) => {
  try {
    // Find payment by ID
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment information
    payment.paymentMethod = req.body.paymentMethod;
    payment.paymentStatus = req.body.paymentStatus;
    payment.paymentDate = new Date();
    await payment.save();

    // Update corresponding WasteRequest based on payment
    const request = await WasteRequest.findById(payment.request)
      .populate("user")
      .populate("wasteCategory");
    if (!request) {
      return res.status(404).json({ message: "Waste request not found" });
    }

    request.paymentStatus = req.body.paymentStatus;
    await request.save();

    // Get user information for email
    const user = await User.findById(request.user); // Assuming WasteRequest has `user` field
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare email data
    const emailData = {
      name: user?.username,
      wasteCategory: request?.wasteCategory?.name, // Ensure wasteCategory is part of the request model
      quantity: request?.quantity,
      estimatedPrice: request?.estimatedPrice,
      pickUpDate: new Date(request?.pickUpDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      paymentDueDate: new Date(request?.paymentDueDate).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      ),
      paymentStatus: "Payment has been successfully processed.", // Message for successful payment
      paymentAmount: payment?.amount, // Assuming `amount` exists in the Payment model
    };

    // Send email to the user
    try {
      await GoogleSendMail({
        email: user?.email,
        subject: "Payment Successful - Waste Zero",
        template: "paymentSuccessful.ejs", // Path to the email template
        data: emailData,
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }

    res.status(200).json({ message: "Payment updated successfully", payment });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete Payment
 * @param {object} req
 * @param {object} res
 * @param {string} req.params.id - Payment ID
 * @param {Function} next - Express next middleware function
 * @error {404} Payment not found
 * @error {400} Payment cannot be deleted
 * @error {400} Payment cannot be deleted as the waste request has been completed
 * @error {400} Payment cannot be deleted as it has been completed
 * @error {400} Payment cannot be deleted as the waste request has been accepted
 * @error {500} Server error
 *
 */
export const deletePayment = async (req, res, next) => {
  try {
    // Find the payment by ID and populate the 'request' field
    const payment = await Payment.findById(req.params.id).populate("request");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if the waste request associated with the payment is accepted
    if (payment.request?.requestStatus === "ACCEPTED") {
      return res.status(400).json({
        message:
          "Payment cannot be deleted as the waste request has been accepted",
      });
    }

    // Check if the payment status for the request is completed
    if (payment.request?.paymentStatus === "COMPLETED") {
      return res.status(400).json({
        message:
          "Payment cannot be deleted as the waste request has been completed",
      });
    }

    // Check if the payment itself is completed
    if (payment?.paymentStatus === "COMPLETED") {
      return res.status(400).json({
        message: "Payment cannot be deleted as it has been completed",
      });
    }

    // If all checks pass, proceed to delete the payment and update the request
    const updateRequest = await WasteRequest.findById(payment.request);
    updateRequest.paymentStatus = "CANCELLED";
    await updateRequest.save();
    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    // Pass any errors to the next middleware for error handling
    next(error);
  }
};

/**
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {string} req.body.district - District ID for filtering
 * @param {string} req.body.city - City name for filtering
 * @param {string} req.body.paymentStatus - Payment status for filtering
 * @returns {void} - Returns a PDF report with the payment details based on the criteria
 */
export const downloadReportStatus = async (req, res, next) => {
  const { paymentStatus } = req.body;

  try {
    // Construct a filter object based on the provided criteria
    let filter = {};
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Fetch payments based on the filter, and populate necessary fields
    const payments = await Payment.find(filter)
      .populate("user")
      .populate({
        path: "request",
        populate: {
          path: "wasteCategory",
        },
      });

    // Generate HTML content whether there are payments or not
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Payment Status Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>${getStyles()}</style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Status Report</h1>
          <p>Generated on ${new Date().toLocaleDateString("en-GB")}</p>
        </div>
        
        ${generateReportSummary(payments, filter)}
        
        ${
          payments && payments.length > 0
            ? `
              ${generateStatistics(payments)}
              ${payments
                .map(
                  (payment) => `
                ${generatePaymentInfo(payment)}
                ${generateWasteRequests(payment.request)}
              `
                )
                .join("")}
            `
            : `
              <div class="no-records">
                <h2>No Records Found</h2>
                <div class="search-criteria">
                  <h3>Search Criteria:</h3>
                  <ul>
                    ${
                      paymentStatus
                        ? `<li>Payment Status: ${paymentStatus}</li>`
                        : `<li>No payment status filter applied</li>`
                    }
                  </ul>
                </div>
                <p>No payment records were found matching the specified criteria.</p>
              </div>
            `
        }
      </body>
      </html>
    `;

    // Generate PDF from the HTML content
    const pdfBuffer = await generatePDFFromHtml(htmlContent);

    // Set the response headers and send the PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename="payment-status-report-${
        new Date().toISOString().split("T")[0]
      }.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

/**
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {string} req.body.paymentStatus - Payment status for filtering
 * @param {string} req.body.user - User ID for filtering
 * @returns {void} - Returns a PDF report with the payment details based on the criteria and user
 */
export const downloadReportStatusByUser = async (req, res, next) => {
  const { paymentStatus, user } = req.body;

  try {
    // Fetch payments based on the filter, and populate necessary fields
    const payments = await Payment.find({
      ...(paymentStatus && { paymentStatus }),
      ...(user && { user }),
    })
      .populate("user")
      .populate({
        path: "request",
        populate: {
          path: "wasteCategory",
        },
      });

    // Generate HTML content whether there are payments or not
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>User Payment Status Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>${getStyles()}</style>
      </head>
      <body>
        <div class="header">
          <h1>User Payment Status Report</h1>
          <p>Generated on ${new Date().toLocaleDateString("en-GB")}</p>
        </div>
        
        ${generateReportSummary(payments, { paymentStatus, user })}
        
        ${
          payments && payments.length > 0
            ? `
              ${generateStatistics(payments)}
              ${payments
                .map(
                  (payment) => `
                ${generatePaymentInfo(payment)}
                ${generateWasteRequests(payment.request)}
              `
                )
                .join("")}
            `
            : `
              <div class="no-records">
                <h2>No Records Found</h2>
                <div class="search-criteria">
                  <h3>Search Criteria:</h3>
                  <ul>
                    ${
                      paymentStatus
                        ? `<li>Payment Status: ${paymentStatus}</li>`
                        : ""
                    }
                    ${user ? `<li>User ID: ${user}</li>` : ""}
                  </ul>
                </div>
                <p>No payment records were found matching the specified criteria.</p>
              </div>
            `
        }
      </body>
      </html>
    `;

    // Generate PDF from the HTML content
    const pdfBuffer = await generatePDFFromHtml(htmlContent);

    // Set the response headers and send the PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename="user-payment-status-report-${
        new Date().toISOString().split("T")[0]
      }.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

/**
 * Helper function to generate the HTML content for the payment information
 */


// New helper function to generate report summary
const generateReportSummary = (payments, filters) => `
  <div class="report-summary">
    <h2>Report Summary</h2>
    <div class="summary-details">
      <p><strong>Total Records Found:</strong> ${payments.length}</p>
      <p><strong>Report Type:</strong> ${filters.user ? 'User-Specific' : 'General'} Payment Status Report</p>
      <p><strong>Applied Filters:</strong></p>
      <ul>
        ${Object.entries(filters)
          .filter(([_, value]) => value)
          .map(([key, value]) => `<li>${key}: ${value}</li>`)
          .join('')}
      </ul>
    </div>
  </div>
`;

/**
 *
 * @returns {string} - Returns the CSS styles for the HTML content
 */
export const getStyles = () => `
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    margin: 0;
    padding: 24px;
    font-size: 15px;
    background-color: #f9fafb;
    line-height: 1.5;
  }
    .no-records {
    margin: 2rem;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  
  .search-criteria {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #fff;
    border-radius: 4px;
  }
  
  .search-criteria ul {
    list-style-type: none;
    padding-left: 0;
  }
  
  .search-criteria li {
    margin: 0.5rem 0;
    color: #666;
  }
  
  .report-summary {
    margin: 2rem;
    padding: 1.5rem;
    background-color: #f5f5f5;
    border-radius: 8px;
  }
  
  .summary-details {
    margin-top: 1rem;
  }
  
  .summary-details ul {
    list-style-type: none;
    padding-left: 1rem;
  }
  
  .summary-details li {
    margin: 0.3rem 0;
    color: #555;
  }
  
  .header {
    text-align: center;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .payment-info, .request-info {
    margin: 24px 0;
    padding: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background-color: white;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    transition: all 0.2s ease-in-out;
  }
  
  .payment-info:hover, .request-info:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    transform: translateY(-1px);
  }
  
  .info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .info-row:last-child {
    border-bottom: none;
  }
  
  .icon {
    width: 20px;
    height: 20px;
    stroke: #6b7280;
    flex-shrink: 0;
  }
  
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: #f1f5f9;
    border-radius: 8px;
    transition: all 0.2s ease-in-out;
  }
  
  .info-row:hover .icon-wrapper {
    background-color: #e2e8f0;
  }
  
  .info-content {
    flex: 1;
  }
  
  h1 { 
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
  }
  
  h2 { 
    font-size: 20px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 20px;
    position: relative;
    padding-bottom: 12px;
  }
  
  h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 3px;
    background-color: #3b82f6;
    border-radius: 2px;
  }
  
  p { 
    margin: 0;
    color: #64748b;
  }
  
  strong {
    color: #334155;
    font-weight: 500;
    margin-right: 4px;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .status-paid {
    background-color: #dcfce7;
    color: #166534;
  }
  
  .status-pending {
    background-color: #fef3c7;
    color: #92400e;
  }
  
  .status-overdue {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .statistics-section {
    margin: 24px 0;
    padding: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background-color: white;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-card {
    padding: 20px;
    border-radius: 8px;
    background-color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.2s ease-in-out;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e2e8f0;
  }

  .stat-icon {
    width: 24px;
    height: 24px;
    stroke: #475569;
  }

  .stat-content h3 {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 4px 0;
    font-weight: 500;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  .status-breakdown {
    margin-top: 32px;
  }

  .status-breakdown h3 {
    font-size: 18px;
    color: #334155;
    margin-bottom: 20px;
  }

  .status-bars {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .status-bar-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .status-label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-count {
    font-size: 14px;
    color: #64748b;
  }

  .status-bar-container {
    height: 8px;
    background-color: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
  }

  .status-bar {
    height: 100%;
    transition: width 0.3s ease-in-out;
  }

  .status-bar.status-paid {
    background-color: #22c55e;
  }

  .status-bar.status-pending {
    background-color: #f59e0b;
  }

  .status-bar.status-overdue {
    background-color: #ef4444;
  }

  .status-percentage {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
`;

export const generatePaymentInfo = (payment) => `
  <div class="payment-info">
    <h2>Payment Details</h2>
    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>User</strong>${payment?.user?.username}</p>
      </div>
    </div>
    
    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Email</strong>${payment?.user?.email}</p>
      </div>
    </div>

    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Payment Method</strong>${payment?.paymentMethod}</p>
      </div>
    </div>

    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Amount</strong>LKR ${payment?.amount.toFixed(2)}</p>
      </div>
    </div>

    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div class="info-content">
        <p>
          <strong>Payment Status</strong>
          <span class="status-badge ${
            payment?.paymentStatus?.toLowerCase() === "paid"
              ? "status-paid"
              : payment?.paymentStatus?.toLowerCase() === "pending"
              ? "status-pending"
              : "status-overdue"
          }">
            ${payment?.paymentStatus}
          </span>
        </p>
      </div>
    </div>

    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Payment Due Date</strong>${new Date(
          payment?.paymentDueDate
        ).toLocaleDateString("en-GB")}</p>
      </div>
    </div>

    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Payment Date</strong>${new Date(
          payment?.paymentDate
        ).toLocaleDateString("en-GB")}</p>
      </div>
    </div>
  </div>
`;

export const generateWasteRequests = (request) => `
  <div class="request-info">
    <h2>Waste Request Details</h2>
    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Category</strong>${request?.wasteCategory?.name || "N/A"}</p>
      </div>
    </div>

    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Quantity</strong>${request?.quantity} KGS</p>
      </div>
    </div>

    <div class="info-row">
      <div class="icon-wrapper">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      </div>
      <div class="info-content">
        <p><strong>Pick-Up Date</strong>${new Date(
          request?.pickUpDate
        ).toLocaleDateString("en-GB")}</p>
      </div>
    </div>
  </div>
`;

/**
 *
 * @param {object} payments
 * @param {object} stats
 * @returns {object} - Returns the statistics object for the payments
 */
const calculateStatistics = (payments) => {
  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    totalWasteQuantity: payments.reduce(
      (sum, p) => sum + (p.request?.quantity || 0),
      0
    ),
    statusBreakdown: payments.reduce((acc, p) => {
      const status = p.paymentStatus || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    averageAmount: 0,
    averageQuantity: 0,
  };

  stats.averageAmount = stats.totalAmount / stats.totalPayments;
  stats.averageQuantity = stats.totalWasteQuantity / stats.totalPayments;

  return stats;
};

/**
 *
 * @param {object} payments
 * @param {object} stats
 * @returns {string} - Returns the HTML content for the statistics section
 */
export const generateStatistics = (payments) => {
  const stats = calculateStatistics(payments);

  return `
    <div class="statistics-section">
      <h2>Summary Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card total-payments">
          <div class="stat-icon-wrapper">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Payments</h3>
            <p class="stat-value">${stats.totalPayments}</p>
          </div>
        </div>

        <div class="stat-card total-amount">
          <div class="stat-icon-wrapper">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Amount</h3>
            <p class="stat-value">LKR ${stats.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <div class="stat-card average-amount">
          <div class="stat-icon-wrapper">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Average Amount</h3>
            <p class="stat-value">LKR ${stats.averageAmount.toFixed(2)}</p>
          </div>
        </div>

        <div class="stat-card total-waste">
          <div class="stat-icon-wrapper">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Waste</h3>
            <p class="stat-value">${stats.totalWasteQuantity.toFixed(2)} KGS</p>
          </div>
        </div>
      </div>

      <div class="status-breakdown">
        <h3>Payment Status Breakdown</h3>
        <div class="status-bars">
          ${Object.entries(stats.statusBreakdown)
            .map(([status, count]) => {
              const percentage = ((count / stats.totalPayments) * 100).toFixed(
                1
              );
              const statusClass =
                status.toLowerCase() === "paid"
                  ? "status-paid"
                  : status.toLowerCase() === "pending"
                  ? "status-pending"
                  : "status-overdue";

              return `
                <div class="status-bar-item">
                  <div class="status-label">
                    <span class="status-badge ${statusClass}">${status}</span>
                    <span class="status-count">${count} payments</span>
                  </div>
                  <div class="status-bar-container">
                    <div class="status-bar ${statusClass}" style="width: ${percentage}%"></div>
                  </div>
                  <span class="status-percentage">${percentage}%</span>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;
};
