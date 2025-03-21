import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'font-awesome/css/font-awesome.min.css';
import { Device } from './ListRegisterDevice';

interface ApiResponse {
    data: Device | Device[];
    status: string;
}

const UserViewDevice: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(false);
    const [nic, setNic] = useState('OLAX'); // Default NIC value
    const [showRemoveForm, setShowRemoveForm] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [removalReason, setRemovalReason] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [removing, setRemoving] = useState(false); // New state for loading during removal

    const fetchDevices = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await axios.get<ApiResponse>(`http://localhost:5173/api/deviceregister/getNIC?NIC=${nic}`);
            if (response.data && response.data.data) {
                const deviceData = response.data.data;
                setDevices(Array.isArray(deviceData) ? deviceData : [deviceData]);
            } else {
                setDevices([]);
            }
        } catch (error) {
            setError('Error fetching devices. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, [nic]); // Fetch devices when NIC changes

    const handleRemoveDevice = (device: Device) => {
        setSelectedDevice(device);
        setShowRemoveForm(true);
    };

    const handleSubmitRemoval = async () => {
        if (!removalReason) {
            setError('Please provide a reason for removal.');
            return;
        }
    
        try {
            const response = await axios.post('http://localhost:5173/api/sendRemovalEmail/removeDevice', {
                device: selectedDevice,
                removalReason: removalReason,
                subject: "Remove the Device in the System",
                message: `Device ID: ${selectedDevice?.Device_ID} is being I want to removed from the system for the following reason: ${removalReason}`
            });
    
            if (response.status === 200) {
                console.log('Device removed successfully and email sent.');
                setSuccessMessage('Device removed successfully.');
                setError(''); // Clear any previous error messages
                setShowRemoveForm(false); // Hide the form after submission
                setRemovalReason(''); // Reset the removal reason
                fetchDevices(); // Refresh the device list after removal
            }
        } catch (error) {
            console.error('Error removing device:', error);
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'Error removing device. Please try again later.');
            } else {
                setError('Error removing device. Please try again later.');
            }
        }
    };
    

    if (loading) {
        return <div>Loading devices...</div>;
    }

    return (
        
        <div className="table-container">
            <h1 className="title">Your Registered Devices</h1>
            {devices.length === 0 && !loading && <div>No devices found for the provided NIC.</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {successMessage && <div style={{ color: 'green' }}>{successMessage}</div>}

            <table className="device-table">
                <thead>
                    <tr>
                        <th>NIC</th>
                        <th>Full Name</th>
                        <th>Location</th>
                        <th>Device ID</th>
                        <th>Device Name</th>
                        <th>Device Type</th>
                        <th>Status</th>
                        <th>Device Remove</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((device) => (
                        <tr key={device._id}>
                            <td>{device.NIC}</td>
                            <td>{device.Full_Name}</td>
                            <td>{device.Location}</td>
                            <td>{device.Device_ID}</td>
                            <td>{device.Device_Name}</td>
                            <td>{device.Device_Type}</td>
                            <td>{device.Status}</td>
                            <td>
                                <button onClick={() => handleRemoveDevice(device)}>
                                    Remove <i className="fa fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showRemoveForm && selectedDevice && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Remove Device</h2>
                        <p>Device ID: {selectedDevice.Device_ID}</p>
                        <p>NIC: {selectedDevice.NIC}</p>
                        <label>
                            Reason for removal:
                            <input
                                type="text"
                                value={removalReason}
                                onChange={(e) => setRemovalReason(e.target.value)}
                                placeholder="Enter reason"
                            />
                        </label>
                        <button onClick={handleSubmitRemoval} style={{ marginTop: '10px' }} disabled={removing}>
                            {removing ? 'Removing...' : 'Submit'}
                        </button>
                        <button onClick={() => setShowRemoveForm(false)} style={{ marginTop: '10px' }}>Cancel</button>
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
                button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #4CAF50;
                }
                button:hover {
                    color: #45a049;
                }
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .modal-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: center;
                    width: 300px;
                }
                .modal-content input {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                }
                @media (max-width: 900px) {
                    .device-table {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default UserViewDevice;
