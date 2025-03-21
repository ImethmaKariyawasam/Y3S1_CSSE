const generateEnhancedDistrictReportHtml = (district, stats) => {
  const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>District Details Report</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1/lucide.min.js"></script>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 1000px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f0f4f8;
              }
              .header {
                  background: linear-gradient(135deg, #3498db, #2c3e50);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 10px;
                  margin-bottom: 30px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .section {
                  margin-bottom: 30px;
                  background-color: white;
                  padding: 25px;
                  border-radius: 10px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .section h2 {
                  margin-top: 0;
                  color: #2c3e50;
                  border-bottom: 2px solid #3498db;
                  padding-bottom: 10px;
                  display: flex;
                  align-items: center;
              }
              .section h2 svg {
                  margin-right: 10px;
              }
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                  gap: 20px;
                  margin-bottom: 30px;
              }
              .stat-card {
                  background-color: #ffffff;
                  border: 1px solid #e0e0e0;
                  border-radius: 8px;
                  padding: 20px;
                  text-align: center;
                  transition: all 0.3s ease;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              }
              .stat-card:hover {
                  transform: translateY(-5px);
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              .stat-card h3 {
                  margin-top: 0;
                  color: #2c3e50;
                  font-size: 1.1em;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .stat-card h3 svg {
                  margin-right: 8px;
              }
              .stat-card p {
                  font-size: 1.4em;
                  font-weight: bold;
                  margin: 15px 0 0;
                  color: #3498db;
              }
              .info-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                  gap: 15px;
              }
              .info-item {
                  background-color: #f8f9fa;
                  border: 1px solid #e0e0e0;
                  border-radius: 6px;
                  padding: 12px;
                  display: flex;
                  align-items: center;
              }
              .info-item strong {
                  color: #2c3e50;
                  margin-right: 8px;
              }
              .waste-request, .driver-item {
                  background-color: #ffffff;
                  border: 1px solid #e0e0e0;
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 20px;
                  transition: all 0.3s ease;
              }
              .waste-request:hover, .driver-item:hover {
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>District Details Report</h1>
              <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
  
          <div class="section">
              <h2>
                  <i data-lucide="bar-chart-2"></i>
                  Statistics Overview
              </h2>
              <div class="stats-grid">
                  <div class="stat-card">
                      <h3><i data-lucide="file-question"></i>Total Requests</h3>
                      <p>${stats.totalRequests}</p>
                  </div>
                  <div class="stat-card">
                      <h3><i data-lucide="trash-2"></i>Total Waste Collected</h3>
                      <p>${stats.totalWaste.toFixed(2)} kg</p>
                  </div>
                  <div class="stat-card">
                      <h3><i data-lucide="dollar-sign"></i>Total Revenue</h3>
                      <p>LKR ${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div class="stat-card">
                      <h3><i data-lucide="tag"></i>Total Estimated Price</h3>
                      <p>LKR ${stats.totalEstimatedPrice.toLocaleString()}</p>
                  </div>
                  <div class="stat-card">
                      <h3><i data-lucide="users"></i>Active Drivers</h3>
                      <p>${stats.activeDrivers}/${stats.totalDrivers}</p>
                  </div>
              </div>
          </div>
  
          <div class="section">
              <h2>
                  <i data-lucide="info"></i>
                  District Information
              </h2>
              <div class="info-grid">
                  <div class="info-item"><strong>Name:</strong> ${
                    district.name
                  }</div>
                  <div class="info-item"><strong>District Code:</strong> ${
                    district.districtCode || "N/A"
                  }</div>
                  <div class="info-item"><strong>Status:</strong> ${
                    district.isActive ? "Active" : "Inactive"
                  }</div>
                  <div class="info-item"><strong>Cities:</strong> ${district.cities.join(
                    ", "
                  )}</div>
              </div>
          </div>
  
          <div class="section">
              <h2>
                  <i data-lucide="truck"></i>
                  Waste Requests
              </h2>
              ${district.wasteRequests
                .map(
                  (request) => `
                  <div class="waste-request">
                      <div class="info-grid">
                          <div class="info-item"><strong>Waste Category:</strong> ${
                            request.wasteCategory
                              ? request.wasteCategory.name
                              : "N/A"
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
                          ).toLocaleDateString()}</div>
                          <div class="info-item"><strong>Status:</strong> ${
                            request.requestStatus
                          }</div>
                      </div>
                  </div>
              `
                )
                .join("")}
          </div>
  
          <div class="section">
              <h2>
                  <i data-lucide="user"></i>
                  Truck Drivers
              </h2>
              ${district.TruckDrivers.map(
                (driver) => `
                  <div class="driver-item">
                      <div class="info-grid">
                          <div class="info-item"><strong>Name:</strong> ${
                            driver.name
                          }</div>
                          <div class="info-item"><strong>NIC:</strong> ${
                            driver.NIC
                          }</div>
                          <div class="info-item"><strong>Vehicle Number:</strong> ${
                            driver.vehicleNumber
                          }</div>
                          <div class="info-item"><strong>City:</strong> ${
                            driver.city
                          }</div>
                          <div class="info-item"><strong>Status:</strong> ${
                            driver.isActive ? "Active" : "Inactive"
                          }</div>
                      </div>
                  </div>
              `
              ).join("")}
          </div>
  
          <script>
              lucide.createIcons();
          </script>
      </body>
      </html>
    `;

  return htmlContent;
};

export default generateEnhancedDistrictReportHtml;
