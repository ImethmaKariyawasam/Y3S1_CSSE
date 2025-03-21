import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt, faTimes, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

interface Device {
  Device_Name: string;
  Device_ID: string;
  Device_Type: string;
  Created_Date: string;
  _id: string;
}

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [deviceToUpdate, setDeviceToUpdate] = useState<Device | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get("http://localhost:5173/api/device/");
        setDevices(response.data);
      } catch (error) {
        console.error("Error fetching devices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleDeleteClick = (deviceId: string) => {
    setDeviceToDelete(deviceId); // Store the device ID to be deleted
    setShowDeleteDialog(true); 
  };

  const handleUpdateClick = (device: Device) => {
    setDeviceToUpdate(device);
    setShowUpdateDialog(true);
  };

  //handleSubmitDelete
  const handleSubmitDelete = async () => {
    if (deviceToDelete) {
      try {
        await axios.delete(`http://localhost:5173/api/device/delete/${deviceToDelete}`);
        setDevices((prevDevices) =>
          prevDevices.filter((device) => device._id !== deviceToDelete)
        );
      } catch (error) {
        console.error("Error deleting device:", error);
      } finally {
        setShowDeleteDialog(false);
        setDeviceToDelete(null); // Reset the state
      }
    }
  };

  const handleSubmitUpdate = async () => {
    if (deviceToUpdate) {
      try {
        await axios.put(`http://localhost:5173/api/device/update/${deviceToUpdate._id}`, deviceToUpdate);
        setDevices((prevDevices) =>
          prevDevices.map((device) =>
            device._id === deviceToUpdate._id ? deviceToUpdate : device
          )
        );
      } catch (error) {
        console.error("Error updating device:", error);
      } finally {
        setShowUpdateDialog(false);
        setDeviceToUpdate(null);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="side1">
      <Link to="/DeviceAnalysis"> <h2>Device Analysis</h2></Link> 
        <Link to="/AddDevice"><h2>Add Device</h2></Link>
        <Link to="/DeviceList"><h2>List Devices</h2></Link>
        <Link to="/ListRegisterDevice"> <h2>View Registered Device</h2></Link> 
        <h2>Dashboard</h2>
      </div>
      <div className="side2">
        <h1 style={{fontSize:"1.5rem"}}>Device List</h1>
        {devices.length === 0 ? (
          <p>No devices found.</p>
        ) : (
          <table className="device-table">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>Device ID</th>
                <th>Device Type</th>
                <th>Created Date</th>
                <th>Request Update</th>
                <th>Request Delete</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device._id}>
                  <td>{device.Device_Name}</td>
                  <td>{device.Device_ID}</td>
                  <td>{device.Device_Type}</td>
                  <td>{device.Created_Date}</td>
                  <td>
                    <button className="update-button" onClick={() => handleUpdateClick(device)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </td>
                  <td>
                    <button className="delete-button" onClick={() => handleDeleteClick(device._id)}>
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>
              <FontAwesomeIcon icon={faTrashAlt} /> Confirm Deletion
            </h2>
            <p>Are you sure you want to delete this device? ID: {deviceToDelete}</p>
            <div className="dialog-buttons">
              <button className="submit-button" onClick={handleSubmitDelete}>
                <FontAwesomeIcon icon={faCheckCircle} /> Yes
              </button>
              <button className="cancel-button" onClick={() => setShowDeleteDialog(false)}>
                <FontAwesomeIcon icon={faTimes} /> No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Dialog */}
      {showUpdateDialog && deviceToUpdate && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Update Device</h2>
            <label>
              Device ID:
              <input
                type="text"
                value={deviceToUpdate.Device_ID}
                className="input-box"
              />
            </label>
            <label>
              Device Name:
              <input
                type="text"
                readOnly
                value={deviceToUpdate.Device_Name}
                onChange={(e) => setDeviceToUpdate({ ...deviceToUpdate, Device_Name: e.target.value })}
                className="input-box"
              />
            </label>
            <label>
              Device Type:
              <input
                type="text"
                value={deviceToUpdate.Device_Type}
                readOnly
                onChange={(e) => setDeviceToUpdate({ ...deviceToUpdate, Device_Type: e.target.value })}
                className="input-box"
              />
            </label>
            <div className="dialog-buttons">
              <button className="submit-button" onClick={handleSubmitUpdate}>Submit</button>
              <button className="cancel-button" onClick={() => setShowUpdateDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .container {
          display: flex;
          flex-direction: row;
          width: 100vw;
        }
        .side1 {
          width: 20vw;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .side1 h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          cursor: pointer;
          text-align: center;
        }
        .side1 h2:hover {
          color: red;
        }
        .side2 {
          width: 80vw;
          padding: 20px;
        }
        .device-table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .device-table th, .device-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .device-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .device-table tr:hover {
          background-color: #f5f5f5;
        }
        .update-button, .delete-button {
          background-color: transparent;
          border: none;
          cursor: pointer;
        }
        .update-button svg, .delete-button svg {
          color: #4CAF50;
        }
        .delete-button svg {
          color: #f44336;
        }
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .dialog {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }
        .dialog h2 {
          margin-top: 0;
        }
        .input-box {
          display: block;
          width: 100%;
          padding: 8px;
          margin: 10px 0;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }
        .input-box:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.2);
        }
        .dialog-buttons {
          display: flex;
          justify-content: space-between;
        }
        .submit-button, .cancel-button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 20px;
        }
        .cancel-button {
          background-color: #f44336;
        }
      `}</style>
    </div>
  );
}
