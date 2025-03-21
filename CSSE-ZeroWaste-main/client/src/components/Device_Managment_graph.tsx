import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ArcElement, Tooltip, Legend);

interface Device {
  Device_Name: string;
  Device_ID: string;
  Device_Type: string;
  Created_Date: string;
  _id: string;
}

export default function DeviceAnalysis() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getDeviceTypeData = () => {
    const deviceTypeCount: { [key: string]: number } = {};

    devices.forEach((device) => {
      deviceTypeCount[device.Device_Type] = (deviceTypeCount[device.Device_Type] || 0) + 1;
    });

    return {
      labels: Object.keys(deviceTypeCount),
      datasets: [
        {
          label: "Number of Devices",
          data: Object.values(deviceTypeCount),
          backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3", "#9c27b0"],
          borderWidth: 1,
        },
      ],
    };
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Devices by Type (Bar Chart)" },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right" as const },
      title: { display: true, text: "Devices by Type (Pie Chart)" },
    },
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h2 style={{fontSize:"2rem"}}>Device Type Analysis</h2>
      <div className="charts">
        <div className="chart-container">
          <Bar data={getDeviceTypeData()} options={barOptions} />
        </div>
        <div className="chart-container">
          <Pie data={getDeviceTypeData()} options={pieOptions} />
        </div>
      </div>

      <style>{`
        .container {
          width: 90%;
          margin: 0 auto;
        }
        .charts {
          display: flex;
          justify-content: space-around;
          margin-top: 30px;
        }
        .chart-container {
          width: 45%;
        }
      `}</style>
    </div>
  );
}
