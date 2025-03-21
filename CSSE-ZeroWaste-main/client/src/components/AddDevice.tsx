import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { Link } from "react-router-dom";

interface Device {
  Device_Name: string;
  Device_ID: string;
  Device_Type: string;
}

export default function AddDevice() {
  const [currentDate, setCurrentDate] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceList, setDeviceList] = useState<Device[]>([]); 

  useEffect(() => {

    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    setCurrentDate(today);

    const fetchDevices = async () => {
        try {
            const response = await fetch('http://localhost:5173/api/fetchdevicedata/'); 
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data); // Log the data to inspect its structur

            // Access the devices array from the response
            if (Array.isArray(data.devices)) {
                setDeviceList(data.devices); // Set the device list to the devices array
            } else {
                console.error("Fetched data.devices is not an array:", data.devices);
                setDeviceList([]); // Reset the device list if not an array
            }
        } catch (error) {
            console.error("Error fetching devices:", error);
        }
    };

    fetchDevices();
}, []);



  // Fetch devices from the database
  const fetchDevices = async () => {
    try {
      const response = await axios.get("http://localhost:5173/api/fetchdevicedata/"); 
      console.log(response);
      setDeviceList(response.data); 
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  // Handle device name selection
  const handleDeviceNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDeviceName = e.target.value;
    setDeviceName(selectedDeviceName);

    // Automatically select device type based on selected device name
    const selectedDevice = deviceList.find((device) => device.Device_Name === selectedDeviceName);
    if (selectedDevice) {
      setDeviceId(selectedDevice.Device_ID); // Automatically set Device ID
      setDeviceType(selectedDevice.Device_Type); // Automatically set Device Type
    }
  };

 // Handle form submission
const handleSubmit = async () => {
  const deviceData = {
    Device_Name: deviceName,
    Device_ID: deviceId,
    Device_Type: deviceType,
    Created_Date: currentDate,
    User: "Admin",
  };

  try {
    const response = await axios.post("http://localhost:5173/api/device/Add", deviceData);

    if (response.status === 200) {
      Swal.fire({
        icon: 'success',
        title: 'Device Added Successfully!',
        text: `Device ${deviceName} has been added to the system.`,
        showConfirmButton: true,
        confirmButtonColor: '#3085d6',
        timer: 3000,
        willClose: () => {
          // Optional: Redirect to another page after success (e.g., Device List)
          // window.location.href = "/DeviceList";
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Add Device',
        text: 'Please try again later.',
        showConfirmButton: true,
        confirmButtonColor: '#d33',
      });
    }
  } catch (error) {
    console.error("Error adding device:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'An error occurred while adding the device. Please check the console for more details.',
      showConfirmButton: true,
      confirmButtonColor: '#d33',
    });
  }
};


  return (
    <div className="container">
      <div className="side1">
        <div className="side1-column">
          <div className="side-row">
          <Link to="/DeviceAnalysis"> <h2>Device Analysis</h2></Link> 
          <Link to="/AddDevice"><h2>Add Device</h2></Link>
          <Link to="/DeviceList"><h2>List Devices</h2></Link>
          <Link to="/ListRegisterDevice"> <h2>View Registered Device</h2></Link> 
            </div>
            <h2>Dashboard</h2>
        </div>
      </div>
      <div className="side2">
        <div className="form">
          <h1 className="title">Create Device Account</h1>
          <div className="row">
          <div className="column">
              <span className="label">Device Name</span>
              <select
                className="input"
                value={deviceName}
                onChange={handleDeviceNameChange}
              >
                <option value="" disabled>Select Device Name</option>
                {deviceList.map((device, index) => (
                  <option key={index} value={device.Device_Name}>
                    {device.Device_Name}
                  </option>
                ))}
              </select>
            </div>
            <div className="column">
              <span className="label">Device ID</span>
              <input
                type="text"
                placeholder="Device ID"
                className="input"
                onChange={(e) => setDeviceId(e.target.value)} // Update state
              />
            </div>
          </div>
          <div className="row">
            <div className="column">
              <span className="label">Device Type</span>
              <input
                type="text"
                placeholder="Device Type"
                className="input"
                value={deviceType}
                readOnly 
              />
            </div>
            <div className="column">
              <span className="label">Date</span>
              <input type="date" readOnly value={currentDate} className="input" />
            </div>
          </div>
          <button className="add-button" onClick={handleSubmit}>Add</button>
        </div>
      </div>

      <style>{`
        .container {
          width: 100vw;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
        .side1{
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items: center;
          width:20vw;
          height:100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        h2{
          font-size: 1.5rem;
          text-align: center;
          font-weight:bold;
          color:white;
          margin-bottom:2rem;
          cursor:pointer;
        }h2:hover{
          color:red;
        }
        .title {
          text-align: center;
          font-family: "Roboto", sans-serif;
          font-size: 2.1rem;
          color: black;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 2rem;
        }
        .form {
          width: 83vw; 
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 20vw;
          align-items: center;
          margin-left:auto;
          margin-right:auto;
        }
        .row {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
        }
        .column {
          display: flex;
          flex-direction: column;
          align-items: left;
          margin-bottom: 2rem;
        }
        .label {
          font-size: 1.1rem;
          color: black;
          margin-left: 1vw;
          margin-bottom:0.1rem;
        }
        .input {
          width: 20vw;
          height: 6vh;
          border-radius: 4px;
          border: 1.5px solid #907ad0;
        }
        .side2{
          width:80vw;
        }
        .add-button {
          font-size: 1.3rem;
          font-weight: bold;
          width: 10vw;
          height: 5vh;
          border-radius: 8px;
          background-color: #2672ce;
          color: white;
        }.add-button:hover{
          color:#2672ce;
          background-color: white;
          border:2px solid #2672ce;
        }
        @media (min-width: 1000px) {
          .form {
            width: 83vw;
          }
          .side1{
            border-top-right-radius: 1rem;
            border-bottom-right-radius: 1rem;
          }
          .side2{
            width:80vw;
          }
          .input {
            width: 20vw;
          }
          .add-button {
            width: 20vw;
            height:8vh;
          }
        }
        @media (max-width: 768px) {
          .container{
            flex-direction:column;
          }
          .side1{
            height:10vh;
            flex-direction:row;
            width:80vw;
            border-radius:10px;
            margin-top:2rem;
          }
          .form {
            width: 80vw;
          }
          .side-row{
            display:flex;
            flex-direction:row;
            justify-content: space-around;
            width: 80vw;
            height:10vh;
            align-items: center;
          }
          h2{
            margin-bottom:0;
            font-size:1.3rem;
          }
          .label{
            font-size: 1.5rem;
          }
          .input {
            width: 80vw;
            font-size: 1.3rem;
          }
          .add-button {
            width: 40vw;
            height:8vh;
            margin-bottom:2rem;
            font-size : 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
