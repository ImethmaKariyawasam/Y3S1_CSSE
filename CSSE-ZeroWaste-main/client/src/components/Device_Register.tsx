import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Device_Register() {
  const [currentDate, setCurrentDate] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [NIC, setNIC] = useState("");
  const [Phone, setPhone] = useState("");
  const [Full_Name, setFull_Name] = useState("");
  const [Email, setEmail] = useState("");
  const [Location, setLocation] = useState("");
  const [Device_ID, setDevice_ID] = useState("");
  const [Device_Name, setDevice_Name] = useState("");

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; 
    setCurrentDate(formattedDate);
  }, []);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const checkDeviceID = async (id) => {
    console.log(id);
    try {
      const response = await axios.get(`http://localhost:5173/api/device/get/${id}`); 
      if (response.status === 200 && response.data) {
        setDevice_Name(response.data.data.Device_Name); 
      } else {
        alert("This is an incorrect Device ID.");
        setDevice_Name(""); 
      }
    } catch (error) {
      console.error("Error fetching device data:", error);
      alert("This is an incorrect Device ID.");
      setDevice_Name(""); 
    }
  };
  

  const handleDeviceIDChange = (e) => {
    const id = e.target.value;
    setDevice_ID(id);
    if (id) {
     // checkDeviceID(id);
    } else {
      setDevice_Name(""); // Clear Device_Name if the input is empty
    }
  };
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    return emailPattern.test(email);
  };
  const handleSubmit = async () => {

    if (!NIC || !Phone || !Full_Name || !Email || !Location || !Device_ID || !Device_Name || !selectedOption) {
      alert("All fields must be filled out.");
      return;
    }

    if (!validateEmail(Email)) {
      alert("Please enter a valid email address.");
      return;
    }
    const deviceData = {
      NIC,
      Phone,
      Full_Name,
      Email,
      Location,
      Device_ID,
      Device_Name,
      Device_Type: selectedOption,
      Created_Date: currentDate,
      Status: "Pending",
    };

    const confirmdevice = {
      NIC,
      Device_ID,
      Task: "Device Register",
      Reason: "New Device Register",
      Created_Date: currentDate,
      Status: false,
    };

    try {
      const response = await axios.post("http://localhost:5173/api/deviceregister/Add", deviceData);
      const response2 = await axios.post("http://localhost:5173/api/Confirm/Add", confirmdevice);
      // Check the response from the API
      if (response.status === 200) {
        alert("Device Registration successfully!");
      } else {
        alert("Failed to Register device. Please try again.");
      }
    } catch (error) {
      console.error("Error adding device:", error);
      alert("An error occurred while adding the device.");
    }
  };

const handleKeyDown = (e) => {
  if (e.key === "Enter") { 
    e.preventDefault(); // Prevent the default form submission
    if (Device_ID) { // Ensure Device_ID is not empty
      checkDeviceID(Device_ID); 
    }
  }
};

  return (
    <div className="container">
      <div className="side1">
        <div className="side1-column">
          <div className="side-row">
            <h2>Register Device</h2>
         <Link to="/UserViewDevice" >  <h2>Registered Device</h2> </Link>
         <Link to="/ChartsPage"> <h2>Others</h2></Link>  
          </div>
        </div>
      </div>
      <div className="side2">
        <div className="form">
          <h1 className="title">Device Register</h1>
          <div className="row">
            <div className="column">
              <span className="label">NIC</span>
              <input
                type="text"
                placeholder="NIC"
                className="input"
                onChange={(e) => setNIC(e.target.value)}
              />
            </div>
            <div className="column">
              <span className="label">Phone</span>
              <input
                type="text"
                placeholder="Phone"
                className="input"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="row">
            <div className="column">
              <span className="label">Full Name</span>
              <input
                type="text"
                placeholder="Full Name"
                className="input"
                onChange={(e) => setFull_Name(e.target.value)}
              />
            </div>
            <div className="column">
              <span className="label">Email</span>
              <input
                type="email"
                placeholder="Email"
                className="input"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="row">
            <div className="column">
              <span className="label">Location</span>
              <input
                type="text"
                placeholder="Location"
                className="input"
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="column">
              <span className="label">Date</span>
              <input
                type="date"
                readOnly
                value={currentDate}
                className="input"
              />
            </div>
          </div>
          <div className="row">
            <div className="column">
              <span className="label">Device ID</span>
              <input
              type="text"
              placeholder="Device ID"
              className="input"
              value={Device_ID}
              onChange={handleDeviceIDChange}
              onKeyDown={handleKeyDown} 
            />
            </div>
            <div className="column">
              <span className="label">Device Name</span>
              <input
                type="text"
                placeholder="Device Name"
                className="input"
                value={Device_Name}
                readOnly 
              />
            </div>
          </div>
          <div className="row" style={{ flexDirection: "column" }}>
            <span className="label1" style={{marginLeft:"8.5vw"}}>Device Type</span>
            <div
              className="column1"
              style={{ display: "flex", justifyContent: "space-around" }}
            >
              {["Food", "Glass", "Plastic", "E-Waste"].map((type) => (
                <label key={type} style={{ marginBottom: "0.5rem" }}>
                  <input
                    type="radio"
                    value={type}
                    checked={selectedOption === type}
                    onChange={handleOptionChange}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
          <button className="add-button" onClick={handleSubmit}>
            Register
          </button>
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
        .side1 {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 20vw;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        h2 {
          font-size: 1.5rem;
          text-align: center;
          font-weight: bold;
          color: white;
          margin-bottom: 2rem;
          cursor: pointer;
        }
        h2:hover {
          color: red;
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
          align-items: center;
          margin-left: auto;
          margin-right: auto;
        }
        .row {
          width: 100%;
          display: flex;
          justify-content: space-around;
        }
        .column {
          display: flex;
          flex-direction: column;
          margin-bottom: 2rem;
        }
        .label {
          font-size: 1.1rem;
          color: black;
          margin-left: 1vw;
          margin-bottom: 0.1rem;
        }
        .input {
          width: 20vw;
          height: 6vh;
          border-radius: 4px;
          border: 1.5px solid #907ad0;
        }
        .side2 {
          width: 80vw;
        }
        .add-button {
          font-size: 1.3rem;
          font-weight: bold;
          width: 10vw;
          height: 7vh;
          background-color: #6646a2;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          margin-top: 2rem;
          transition: background-color 0.3s;
        }
        .add-button:hover {
          background-color: #907ad0;
        }
      `}</style>
    </div>
  );
}
