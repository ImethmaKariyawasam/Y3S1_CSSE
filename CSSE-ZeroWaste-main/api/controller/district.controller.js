import District from "../models/district.model.js";
import { errorHandler } from "../utils/error.js";
import generatePdfFromHtml from "../utils/pdfGenerator.js";

/**
 * District Management Controller
 * Handles CRUD operations for district management
 * @module controllers/district.controller
 * @requires models/district.model
 * @requires utils/error
 */

/**
 * Function which creates a new district
 * @param {object} req 
 * @param {object} res
 * @param {string} req.body.name - Name of the district
 * @param {string} req.body.cities - Comma-separated list of cities in the district
 * @param {string} req.body.districtCode - Code of the district 
 * @param {Function} next - Express next middleware function
 * @error {400} Name and cities are required
 * @error {400} At least one city is required
 * @error {500} Internal server error
 * @returns {JSON} Created district
 * @returns 
 */
export const createDistrict = async (req, res, next) => {
  let { name, cities, districtCode } = req.body;

  // Check if name and cities are provided
  if (!name || !cities) {
    return next(errorHandler(400, "Name and cities are required"));
  }

  // Convert comma-separated cities string to an array (trim whitespace)
  cities = cities.split(",").map((city) => city.trim());

  // Check if cities array is valid and contains at least one city
  if (cities.length === 0) {
    return next(errorHandler(400, "At least one city is required"));
  }

  try {
    // Create a new district with name and cities
    const district = new District({
      name,
      cities,
      districtCode,
    });

    // Save the new district to the database
    await district.save();
    res.status(201).json(district); // Return the created district
  } catch (error) {
    next(error); // Pass any errors to the error handler
  }
};

/**
 * 
 * @param {object} req 
 * @param {object} res 
 * @param {Function} next - Express next middleware function
 * @error {500} Internal server error
 * @returns {JSON} List of districts with populated fields
 */
export const getDistricts = async (req, res, next) => {
  try {
    // Find all districts and populate the TruckDrivers and wasteRequests fields
    const districts = await District.find()
      .populate("TruckDrivers")
      .populate("wasteRequests");
    // Calculate statistics
    const totalDistricts = districts.length;
    const totalActiveDistricts = districts.filter(
      (district) => district.isActive
    ).length;
    const totalInactiveDistricts = districts.filter(
      (district) => !district.isActive
    ).length;
    const totalCities = districts.reduce(
      (acc, district) => acc + district.cities.length,
      0
    );
    // Return the list of districts
    res.json({
      totalDistricts,
      totalActiveDistricts,
      totalInactiveDistricts,
      districts,
      totalCities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upadate district details
 * @param {object} req 
 * @param {object} res 
 * @param {Function} next - Express next middleware function
 * @error {404} District not found
 * @error {500} Internal server error
 * @error {400} Name must be at least 3 characters
 * @error {400} At least one city is required
 * @error {400} District code must be at least 3 characters
 * @error {400} isActive must be 'Active' or 'Deactive'
 * @error {400} isActive must be a boolean
 * @returns {JSON} District details
 * @returns 
 */
export const updateDistrict = async (req, res, next) => {
  const { id } = req.params;
  let { name, cities, districtCode, isActive } = req.body;
  try {
    const district = await District.findById(id);

    if (!district) {
      return next(errorHandler(404, "District not found"));
    }
    if (name) {
      if (name.length < 3) {
        return next(errorHandler(400, "Name must be at least 3 characters"));
      }
    }
    if (cities) {
      district.cities = cities.split(",").map((city) => city.trim());
      if (district.cities.length === 0) {
        return next(errorHandler(400, "At least one city is required"));
      }
    }
    if (districtCode) {
      if (districtCode.length < 3) {
        return next(
          errorHandler(400, "District code must be at least 3 characters")
        );
      }
    }
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
      district.isActive = isActive;
    }

    district.name = name || district.name;
    district.districtCode = districtCode || district.districtCode;

    await district.save();
    res.json(district);
  } catch (error) {
    next(error);
  }
};

/**
 * 
 * @param {object} req 
 * @param {object} res 
 * @param {Function} next - Express next middleware function
 * @error {404} District not found
 * @error {400} Delete Denied.District has drivers
 * @error {500} Internal server error
 * @returns {JSON} Deleted district
 */
export const deleteDistrict = async (req, res, next) => {
  const { id } = req.params;

  try {
    const checkDrivers = await District.findById(id);
    const checkWasteRequests = await District.findById(id);
    if (checkDrivers.TruckDrivers.length > 0) {
      return next(errorHandler(400, "Delete Denied.District has drivers"));
    }
    if (checkWasteRequests.wasteRequests.length > 0) {
      return next(
        errorHandler(400, "Delete Denied.District has waste requests")
      );
    }
    const district = await District.findByIdAndDelete(id);
    if (!district) {
      return next(errorHandler(404, "District not found"));
    }
    res.json(district);
  } catch (error) {
    next(error);
  }
};

/**
 * 
 * @param {object} req 
 * @param {object} res 
 * @param {Function} next - Express next middleware function
 * @error {404} District not found
 * @error {500} Internal server error
 */
export const downloadDistrictReport = async (req, res, next) => {
  const districtID = req.body.id;
  try {
    const district = await District.findById(districtID)
      .populate("TruckDrivers")
      .populate({
        path: "wasteRequests",
        populate: {
          path: "wasteCategory",
        },
      });

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Calculate statistics
    const calculateStats = (wasteRequests) => {
      const totalRequests = wasteRequests.length;
      const totalWaste = wasteRequests.reduce(
        (sum, req) => sum + req.quantity,
        0
      );

      const totalRevenue = wasteRequests.reduce(
        (sum, req) =>
          req.wasteCategory.isUserPaymentRequired
            ? sum + req.estimatedPrice
            : sum,
        0
      );

      const totalEstimatedPrice = wasteRequests.reduce(
        (sum, req) => sum + req.estimatedPrice,
        0
      );


      // Calculate requests by status
      const requestsByStatus = wasteRequests.reduce((acc, req) => {
        acc[req.requestStatus] = (acc[req.requestStatus] || 0) + 1;
        return acc;
      }, {});

      // Calculate waste by category
      const wasteByCategory = wasteRequests.reduce((acc, req) => {
        const category = req.wasteCategory
          ? req.wasteCategory.name
          : "Uncategorized";
        acc[category] = (acc[category] || 0) + req.quantity;
        return acc;
      }, {});

      return {
        totalRequests,
        totalWaste,
        totalRevenue,
        requestsByStatus,
        wasteByCategory,
        totalEstimatedPrice,
        avgRequestValue: totalRequests
          ? (totalRevenue / totalRequests).toFixed(2)
          : 0,
        activeDrivers: district.TruckDrivers.filter((d) => d.isActive).length,
        totalDrivers: district.TruckDrivers.length,
      };
    };

    const stats = calculateStats(district.wasteRequests);

    // Prepare chart data
    const statusChartData = Object.entries(stats.requestsByStatus).map(
      ([status, count]) => ({
        name: status,
        value: count,
      })
    );

    const categoryChartData = Object.entries(stats.wasteByCategory).map(
      ([category, quantity]) => ({
        name: category,
        value: quantity,
      })
    );

    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>District Details Report</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/recharts/2.1.9/Recharts.js"></script>
          <link
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
            rel="stylesheet"
          />
          <style>
              /* Previous styles remain the same */
              body {
                  font-family: 'Arial', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f5f5f5;
              }
              .container {
                  background-color: #fff;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  padding: 30px;
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
              }
              .header h1 {
                  color: #2c3e50;
                  margin-bottom: 10px;
              }
              .section {
                  margin-bottom: 30px;
                  border: 1px solid #e0e0e0;
                  padding: 20px;
                  border-radius: 8px;
                  background-color: #fff;
              }
              .section h2 {
                  color: #2c3e50;
                  border-bottom: 2px solid #3498db;
                  padding-bottom: 10px;
                  margin-bottom: 20px;
              }
              .info-item {
                  margin-bottom: 10px;
              }
              .info-item strong {
                  color: #2c3e50;
              }
              .status-active {
                  color: #27ae60;
                  font-weight: bold;
              }
              .status-inactive {
                  color: #e74c3c;
                  font-weight: bold;
              }
              .status-pending {
                  color: #f39c12;
                  font-weight: bold;
              }
              .driver-img {
                  width: 100px;
                  height: 100px;
                  object-fit: cover;
                  border-radius: 50%;
                  margin-bottom: 10px;
              }
              .waste-request, .driver-details {
                  background-color: #f9f9f9;
                  border: 1px solid #e0e0e0;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 15px;
              }
              .icon {
                  width: 20px;
                  height: 20px;
                  vertical-align: middle;
                  margin-right: 5px;
              }
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 20px;
                  margin-bottom: 30px;
              }
              
              .stat-card {
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                color: black;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                gap: 15px; /* Added gap between icon and content */
            }

            .stat-card h3 {
                margin: 0;
                font-size: 1.1rem;
                opacity: 0.9;
            }

            .stat-card .value {
                font-size: 2rem;
                font-weight: bold;
                margin: 10px 0;
            }

            .stat-card .icon {
                font-size: 2rem;
                margin-right: 15px; /* Ensure space between icon and text */
                flex-shrink: 0; /* Prevent the icon from shrinking */
            }

              .charts-container {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                  gap: 30px;
                  margin-bottom: 30px;
              }
              
              .chart-wrapper {
                  background: white;
                  padding: 20px;
                  border-radius: 12px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  height: 300px;
              }
          </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>District Details Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <!-- Statistics Overview -->
          <div class="stats-grid">
          <div class="stat-card">
            <i class="fas fa-tasks icon"></i>
            <div>
              <h3>Total Requests</h3>
              <div class="value">${stats.totalRequests}</div>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-dumpster icon"></i>
            <div>
              <h3>Total Waste Collected</h3>
              <div class="value">${stats.totalWaste.toFixed(2)} kg</div>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-dollar-sign icon"></i>
            <div>
              <h3>Total Revenue</h3>
              <div class="value">LKR ${stats.totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-money-check-alt icon"></i>
            <div>
              <h3>Total Estimated Price</h3>
              <div class="value">LKR ${stats.totalEstimatedPrice.toLocaleString()}</div>
            </div>
          </div>

          <div class="stat-card">
            <i class="fas fa-users icon"></i>
            <div>
              <h3>Active Drivers</h3>
              <div class="value">${stats.activeDrivers}/${stats.totalDrivers}</div>
            </div>
          </div>
        </div>
          <!-- Rest of the existing content -->

      `;

    // District details
    const districtStatusClass = district.isActive
      ? "status-active"
      : "status-inactive";

    htmlContent += `
        <div class="section">
          <h2>
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItbWFwLXBpbiI+PHBhdGggZD0iTTIxIDEwYzAgNy03IDEyLTkgMTItMiAwLTktNS05LTEyIDAtMy44NyAzLjEzLTcgNy03czcsIDMuMTMgNywgN3oiPjwvcGF0aD48Y2lyY2xlIGN4PSIxMiIgY3k9IjEwIiByPSIzIj48L2NpcmNsZT48L3N2Zz4=" class="icon" alt="District Icon">
            District: ${district.name}
          </h2>
          <div class="info-item"><strong>District Code:</strong> ${
            district.districtCode || "N/A"
          }</div>
          <div class="info-item"><strong>Status:</strong> <span class="${districtStatusClass}">${
      district.isActive ? "Active" : "Inactive"
    }</span></div>
          <div class="info-item"><strong>Cities:</strong> ${district.cities.join(
            ", "
          )}</div>
        </div>
      `;

    // Waste requests section
    htmlContent += `
        <div class="section">
          <h2>
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItdHJhc2gtMiI+PHBvbHlsaW5lIHBvaW50cz0iMyA2IDUgNiAyMSA2Ij48L3BvbHlsaW5lPjxwYXRoIGQ9Ik0xOSA2djE0YTIgMiAwIDAgMS0yIDJINy
  
  FhMiAyIDAgMCAxLTItMlY2bTMgMFY0YTIgMiAwIDAgMSAyLTJoNGEyIDIgMCAwIDEgMiAydjIiPjwvcGF0aD48bGluZSB4MT0iMTAiIHkxPSIxMSIgeDI9IjEwIiB5Mj0iMTciPjwvbGluZT48bGluZSB4MT0iMTQiIHkxPSIxMSIgeDI9IjE0IiB5Mj0iMTciPjwvbGluZT48L3N2Zz4=" class="icon" alt="Waste Requests Icon">
            Waste Requests
          </h2>
        `;

    if (district.wasteRequests.length > 0) {
      district.wasteRequests.forEach((request) => {
        const requestStatusClass =
          request.requestStatus === "PENDING"
            ? "status-pending"
            : request.requestStatus === "ACCEPTED"
            ? "status-active"
            : "status-inactive";
        htmlContent += `
            <div class="waste-request">
              <div class="info-item"><strong>Waste Category:</strong> ${
                request.wasteCategory ? request.wasteCategory.name : "N/A"
              }</div>
              <div class="info-item"><strong>Quantity:</strong> ${
                request.quantity
              } kg</div>
              <div class="info-item"><strong>Estimated Price:</strong> LKR ${
                request.estimatedPrice
              }</div>
              <div class="info-item"><strong>Address:</strong> ${
                request.address
              }</div>
              <div class="info-item"><strong>City:</strong> ${
                request.city
              }</div>
              <div class="info-item"><strong>Pick-Up Date:</strong> ${new Date(
                request.pickUpDate
              ).toLocaleDateString("en-GB")}</div>
              <div class="info-item"><strong>Status:</strong> <span class="${requestStatusClass}">${
          request.requestStatus
        }</span></div>
            </div>
            `;
      });
    } else {
      htmlContent += `<p>No waste requests associated with this district.</p>`;
    }

    htmlContent += `</div>`; // Close waste requests section

    // Truck drivers section
    htmlContent += `
        <div class="section">
          <h2>
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItdHJ1Y2siPjxyZWN0IHg9IjEiIHk9IjMiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxMyI+PC9yZWN0Pjxwb2x5Z29uIHBvaW50cz0iMTYgOCAyMCA4IDIzIDExIDIzIDE2IDE2IDE2IDE2IDgiPjwvcG9seWdvbj48Y2lyY2xlIGN4PSI1LjUiIGN5PSIxOC41IiByPSIyLjUiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjE4LjUiIGN5PSIxOC41IiByPSIyLjUiPjwvY2lyY2xlPjwvc3ZnPg==" class="icon" alt="Truck Drivers Icon">
            Truck Drivers
          </h2>
        `;

    if (district.TruckDrivers.length > 0) {
      district.TruckDrivers.forEach((driver) => {
        const driverStatusClass = driver.isActive
          ? "status-active"
          : "status-inactive";
        htmlContent += `
            <div class="driver-details">
              <img class="driver-img" src="${
                driver.DriverImage
              }" alt="Driver Image" />
              <div class="info-item"><strong>Name:</strong> ${driver.name}</div>
              <div class="info-item"><strong>NIC:</strong> ${driver.NIC}</div>
              <div class="info-item"><strong>Vehicle Number:</strong> ${
                driver.vehicleNumber
              }</div>
              <div class="info-item"><strong>City:</strong> ${driver.city}</div>
              <div class="info-item"><strong>Status:</strong> <span class="${driverStatusClass}">${
          driver.isActive ? "Active" : "Inactive"
        }</span></div>
            </div>
          `;
      });
    } else {
      htmlContent += `<p>No drivers associated with this district.</p>`;
    }

    htmlContent += `
            </div>
          </div>
        </body>
        </html>`;

    // Continue with the rest of your existing HTML content...

    const pdfBuffer = await generatePdfFromHtml(htmlContent);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
