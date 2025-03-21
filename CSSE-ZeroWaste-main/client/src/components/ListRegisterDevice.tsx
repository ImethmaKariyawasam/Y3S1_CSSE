import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import 'font-awesome/css/font-awesome.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 

export interface Device {
  NIC: string;
  Phone: string;
  Full_Name: string;
  Email: string;
  Location: string;
  Device_ID: string;
  Device_Name: string;
  Device_Type: string;
  Created_Date: string;
  Status: string;
  _id: string;
  RemoveDueCode: string;
}

const ListRegisterDevice: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get<Device[]>('http://localhost:5173/api/deviceregister/');
        setDevices(response.data);
        setFilteredDevices(response.data);
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const updateDeviceStatus = async () => {
    const subject = 'Device Status Update Notification';
    let message = '';

    try {
      if (!selectedDevice || !selectedDevice.Email) {
        throw new Error('Device details are missing.');
      }
      if (!removalReason) {
        throw new Error('Removal reason is missing.');
      }

      if (selectedDevice.Status === 'Completed') {
        message = `The following device has been registered successfully: Email - ${selectedDevice.Email}`;
      } else if (selectedDevice.Status === 'Rejected') {
        message = `The following device has been rejected: Email - ${selectedDevice.Email}. Reason: ${removalReason}`;
      }

      const response = await axios.post('http://localhost:5173/api/sendRemovalEmail/removeDevice', {
        device: {
          Email: selectedDevice.Email,
        },
        removalReason,
        subject,
        message,
      });

      console.log('Response:', response.data);
      alert('Device status updated and email sent successfully.');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email: ' + error.message);
    }
  };

  const handleUpdateClick = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = devices.filter(
      (device) =>
        device.Full_Name.toLowerCase().includes(value) ||
        device.Email.toLowerCase().includes(value)
    );
    setFilteredDevices(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Registered Devices', 10, 10);

    const tableColumn = ["NIC", "Phone", "Full Name", "Email", "Location", "Device Name", "Device Type", "Status"];
    const tableRows: any[] = [];

    filteredDevices.forEach((device) => {
      const deviceData = [
        device.NIC,
        device.Phone,
        device.Full_Name,
        device.Email,
        device.Location,
        device.Device_Name,
        device.Device_Type,
        device.Status,
      ];
      tableRows.push(deviceData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("registered_devices.pdf");
  };

  if (loading) {
    return <div>Loading devices...</div>; // Loading state message
  }

  return (
    <div className="table-container">
      <h1 className="title">Registered Devices</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by Full Name or Email"
        value={searchTerm}
        onChange={handleSearch}
        className="search-input"
      />

      {/* PDF Generate Button */}
      <button className="pdf-button" onClick={generatePDF}>Generate PDF</button>

      <table className="device-table">
        <thead>
          <tr>
            <th>NIC</th>
            <th>Phone</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Location</th>
            <th>Device ID</th>
            <th>Device Name</th>
            <th>Device Type</th>
            <th>Created Date</th>
            <th>Status</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {filteredDevices.map((device) => (
            <tr key={device._id}>
              <td>{device.NIC}</td>
              <td>{device.Phone}</td>
              <td>{device.Full_Name}</td>
              <td>{device.Email}</td>
              <td>{device.Location}</td>
              <td>{device.Device_ID}</td>
              <td>{device.Device_Name}</td>
              <td>{device.Device_Type}</td>
              <td>{device.Created_Date}</td>
              <td>{device.Status}</td>
              <td>
                <button onClick={() => handleUpdateClick(device)} aria-label="Update device">
                  <i className="fa fa-refresh" aria-hidden="true" style={{ fontSize: '20px' }}></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedDevice && (
        <div className="modal">
          <div className="modal-content">
            <h2>Update Device Status</h2>
            <p>Update status for: {selectedDevice.Device_Name}</p>
            <select
              value={selectedDevice.Status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setSelectedDevice({ ...selectedDevice, Status: newStatus });
                console.log("New Status Selected:", newStatus);
              }}
            >
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Input for removal reason */}
            <input
              type="text"
              placeholder="Reason"
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
            />

            <button onClick={updateDeviceStatus} style={{marginRight:"1rem"}}>Update</button>
            <button onClick={() => setSelectedDevice(null)}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .table-container {
          padding: 20px;
          text-align: center;
        }

        .title {
          font-size: 2rem;
          margin-bottom: 20px;
        }

        .search-input {
          padding: 10px;
          margin-bottom: 20px;
          width: 50%;
          font-size: 1rem;
        }

        .pdf-button {
          padding: 10px 20px;
          margin-bottom: 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .device-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 1rem;
          text-align: left;
        }

        .device-table th, .device-table td {
          padding: 12px 15px;
          border: 1px solid #ddd;
        }

        .device-table th {
          background-color: #4CAF50;
          color: white;
        }

        .device-table tbody tr {
          transition: background-color 0.3s;
        }

        .device-table tbody tr:hover {
          background-color: #f1f1f1;
        }

        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
          z-index: 1000;
        }

        .modal-content select,
        .modal-content input {
          margin: 10px 0;
          padding: 8px;
          width: 100%;
        }

        button {
          background: none;
          border: none;
          cursor: pointer;
        }

        button:hover {
          color: #4CAF50;
        }
      `}</style>
    </div>
  );
};

export default ListRegisterDevice;
