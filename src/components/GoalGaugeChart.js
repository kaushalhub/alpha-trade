import React from "react";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const GoalGaugeChart = ({ current = 1052.98, target = 1200 }) => {
  const percentage = (current / target) * 100;

  return (
    <div
      className="card shadow p-4"
      style={{
        borderRadius: "12px",
        height: "280px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h6 className="mb-1 fw-bold">Saving Goal</h6>
          <small className="text-muted">Data from 1–12 Apr, 2024</small>
        </div>
        <button className="btn btn-outline-secondary btn-sm">
          View Report
        </button>
      </div>

      <div
        style={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", maxWidth: "160px" }}>
          <CircularProgressbarWithChildren
            value={percentage}
            circleRatio={0.5}
            styles={buildStyles({
              rotation: 0.75,
              strokeLinecap: "round",
              trailColor: "#eee",
              pathColor: "#34c759",
              pathTransitionDuration: 0.5,
              strokeWidth: 8, // ✅ thinner stroke
            })}
          >
            <div style={{ marginTop: 10 }}>
              <strong style={{ fontSize: "1.2rem" }}>
                ${current.toFixed(2)}
              </strong>
              <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                of ${target.toLocaleString()}
              </div>
            </div>
          </CircularProgressbarWithChildren>
        </div>
      </div>
    </div>
  );
};

export default GoalGaugeChart;
