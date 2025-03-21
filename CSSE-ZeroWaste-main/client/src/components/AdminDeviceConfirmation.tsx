import React, { useEffect, useState } from "react";
import axios from "axios";

const ConfirmationDevice: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from the backend
    axios
      .get("http://localhost:5173/api/Confirm/") // Replace with your actual API URL
      .then((response) => {
        setDevices(response.data); // Set the data from the backend
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching devices");
        setLoading(false);
      });
  }, []);

 


  const updateStatus = (id: string, status: string) => {
    // Define the new status value for the second request
    const value1 = status === "true" ? "Confirmed" : "Rejected";
  
    // Create the requests
    const requests = [
      axios.put(`http://localhost:5173/api/Confirm/update/${id}`, { status }),
      axios.put(`http://localhost:5173/api/deviceregister/update/${id}`, { value1 })
    ];
  
    // Execute both requests simultaneously
    Promise.all(requests)
      .then(() => {
        // Update the local state to reflect the new status after both requests succeed
        setDevices((prevDevices) =>
          prevDevices.map((device) =>
            device._id === id ? { ...device, Status: status } : device
          )
        );
      })
      .catch((err) => {
        setError("Error updating device status");
      });
  };
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={pageContainer}>
      <h2 style={heading}>Device Confirmation Table</h2>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={tableHeader}>NIC</th>
              <th style={tableHeader}>Device ID</th>
              <th style={tableHeader}>Task</th>
              <th style={tableHeader}>Reason</th>
              <th style={tableHeader}>Created Date</th>
              <th style={tableHeader}>Status</th>
              <th style={tableHeader}>Action</th>
              <th style={tableHeader}>Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device._id} style={tableRow}>
                <td style={tableCell}>{device.NIC}</td>
                <td style={tableCell}>{device.Device_ID}</td>
                <td style={tableCell}>{device.Task}</td>
                <td style={tableCell}>{device.Reason}</td>
                <td style={tableCell}>
                  {new Date(device.Created_Date).toLocaleDateString()}
                </td>
                <td style={tableCell}>                  {new Boolean(device.Created_Date).toString()}                </td>
                <td style={tableCell}>
                  {device.Status === "Confirmed" || device.Status === "Rejected" ? null : (
                    <button
                      style={confirmButton}
                      onClick={() => updateStatus(device._id, "Confirmed")}
                    >
                      Confirm
                    </button>
                  )}
                </td>
                <td style={tableCell}>
                  {device.Status === "Confirmed" || device.Status === "Rejected" ? null : (
                    <button
                      style={rejectButton}
                      onClick={() => updateStatus(device._id, "Rejected")}
                    >
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Internal CSS Styles with correct types
const pageContainer: React.CSSProperties = {
  padding: "20px",
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f5f5f5",
};

const heading: React.CSSProperties = {
  textAlign: "center",
  color: "#333",
  marginBottom: "20px",
  fontSize:"2rem"
};

const tableContainer: React.CSSProperties = {
  marginTop: "20px",
  width: "100%",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

const tableHeader: React.CSSProperties = {
  padding: "15px",
  textAlign: "left",
  backgroundColor: "#4CAF50",
  color: "white",
  textTransform: "uppercase",
};

const tableRow: React.CSSProperties = {
  backgroundColor: "#fff",
  transition: "background-color 0.3s ease",
};

const tableCell: React.CSSProperties = {
  padding: "15px",
  textAlign: "left",
  borderBottom: "1px solid #dddddd",
  fontSize: "14px",
};

// Button styles
const buttonBase: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "5px",
  fontSize: "14px",
  cursor: "pointer",
  border: "none",
  color: "#fff",
  transition: "background-color 0.3s ease",
};

const confirmButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: "#4CAF50", // Green color
};

const rejectButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: "#f44336", // Red color
};

// Button hover effects
confirmButton[':hover'] = {
  backgroundColor: "#45a049",
};

rejectButton[':hover'] = {
  backgroundColor: "#d32f2f",
};

export default ConfirmationDevice;
