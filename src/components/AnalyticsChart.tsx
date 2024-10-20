import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { School, LicenseClass, DifferenceClass, CLASS_NAMES } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsChartProps {
  school: School;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ school }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const classTypes: (LicenseClass | DifferenceClass)[] = ['B', 'A1', 'A2', 'C', 'D', 'FARK_A1', 'FARK_A2', 'BAKANLIK_A1'];

  const data = {
    labels: classTypes.map(type => isMobile ? CLASS_NAMES[type].substring(0, 2) : CLASS_NAMES[type]),
    datasets: [
      {
        label: 'Kursiyer Sayısı',
        data: classTypes.map(type => school.candidates[type] || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: !isMobile,
      },
      title: {
        display: true,
        text: 'Sınıflara Göre Kursiyer Dağılımı',
        font: {
          size: isMobile ? 14 : 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
    },
  };

  return (
    <div className="w-full">
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6">
        <div className={isMobile ? "h-64" : "h-96"}>
          <Bar options={options} data={data} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;