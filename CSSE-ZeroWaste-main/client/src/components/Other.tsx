import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ChartsPage: React.FC = () => {
  const [data, setData] = useState({
    barData: {
      labels: ['January', 'February', 'March', 'April', 'May'],
      datasets: [
        {
          label: 'Monthly Sales',
          data: [120, 190, 300, 500, 200],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    },
    pieData: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      datasets: [
        {
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    },
  });

  const updateData = () => {
    setData({
      barData: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [
          {
            label: 'Monthly Sales',
            data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 500)),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      },
      pieData: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [
          {
            label: '# of Votes',
            data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 20)),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
            ],
            borderWidth: 1,
          },
        ],
      },
    });
  };

  return (
    <div style={{ width: '80%', margin: '0 auto', textAlign: 'center' }}>
      <h1>Dynamic Charts Page</h1>
      
      <h2>Dynamic Bar Graph</h2>
      <Bar data={data.barData} options={{ responsive: true }} />
      
      <h2 style={{ marginTop: '40px' }}>Dynamic Pie Chart</h2>
      <Pie data={data.pieData} options={{ responsive: true }} />
      
      <button onClick={updateData} style={{ marginTop: '40px', padding: '10px 20px', fontSize: '16px' }}>
        Update Data
      </button>
    </div>
  );
};

export default ChartsPage;
