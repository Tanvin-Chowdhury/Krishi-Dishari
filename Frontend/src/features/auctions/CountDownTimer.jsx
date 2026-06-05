import React from "react";
import { useState, useEffect } from "react";

const CountDownTimer = ({ endTime, large = false }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, new Date(endTime) - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (timeLeft <= 0) {
    return (
      <div
        style={{
          background: "#FCEBEB",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
          color: "#A32D2D",
          fontWeight: 600,
        }}
      >
        ⏰ সময় শেষ
      </div>
    );
  }

  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isUrgent = timeLeft < 3600000; // < 1 hour

  const boxStyle = (val) => ({
    background: isUrgent ? "#FCEBEB" : "#F7FAF8",
    border: `0.5px solid ${isUrgent ? "#E24B4A" : "#e0e0d8"}`,
    borderRadius: 6,
    padding: large ? "8px 12px" : "4px 8px",
    textAlign: "center",
    minWidth: large ? 52 : 36,
  });
  const numStyle = {
    fontSize: large ? 22 : 15,
    fontWeight: 700,
    color: isUrgent ? "#A32D2D" : "#085041",
    display: "block",
  };
  const lblStyle = {
    fontSize: 9,
    color: "#888780",
    display: "block",
    marginTop: 1,
  };
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {days > 0 && (
        <div style={boxStyle(days)}>
          <span style={numStyle}>{days}</span>
          <span style={lblStyle}>দিন</span>
        </div>
      )}
      <div style={boxStyle(hours)}>
        <span style={numStyle}>{String(hours).padStart(2, "0")}</span>
        <span style={lblStyle}>ঘণ্টা</span>
      </div>
      <div
        style={{ color: "#888780", fontWeight: 700, fontSize: large ? 18 : 13 }}
      >
        :
      </div>
      <div style={boxStyle(minutes)}>
        <span style={numStyle}>{String(minutes).padStart(2, "0")}</span>
        <span style={lblStyle}>মিনিট</span>
      </div>
      <div
        style={{ color: "#888780", fontWeight: 700, fontSize: large ? 18 : 13 }}
      >
        :
      </div>
      <div style={boxStyle(seconds)}>
        <span style={numStyle}>{String(seconds).padStart(2, "0")}</span>
        <span style={lblStyle}>সেকেন্ড</span>
      </div>
    </div>
  );
};

export default CountDownTimer;
