import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip
);

const PnLChart = ({ data }) => {
  const values = data.datasets[0].data;
  const isProfit = values.reduce((sum, v) => sum + v, 0) >= 0;

  const lineColor = isProfit ? "rgba(0, 153, 51, 1)" : "rgba(220, 53, 69, 1)";
  const fillColor = isProfit
    ? "rgba(0, 153, 51, 0.15)"
    : "rgba(220, 53, 69, 0.15)";

  const styledData = {
    labels: data.labels,
    datasets: [
      {
        label: "P&L",
        data: values,
        fill: true,
        backgroundColor: fillColor,
        borderColor: lineColor,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#333",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: "#333",
          callback: (val) => `₹${val}`,
        },
      },
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#f9f9f9",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#ccc",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `P&L: ₹${ctx.formattedValue}`,
        },
      },
      legend: {
        display: false,
      },
    },
  };

  return (
    <div
      className="card shadow p-3 mb-5"
      style={{
        background: "#fff",
        color: "#000",
        height: "280px",
        borderRadius: "12px",
      }}
    >
      <h5 className="mb-3">📈 Daily P&L (Trading Style)</h5>
      <div style={{ height: "200px" }}>
        <Line data={styledData} options={options} />
      </div>
    </div>
  );
};

export default PnLChart;
