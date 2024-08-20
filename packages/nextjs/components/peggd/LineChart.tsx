import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Title, LineController);

const LineChart = ({ data, options }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    // Destroy the existing chart instance if it exists
    if (chartRef.current.chartInstance) {
      chartRef.current.chartInstance.destroy();
    }

    // Create new chart instance and store it in ref
    chartRef.current.chartInstance = new Chart(ctx, {
      type: "line",
      data,
      options,
    });

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartRef.current.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }
    };
  }, [data, options]);

  return <canvas ref={chartRef} />;
};

export default LineChart;
