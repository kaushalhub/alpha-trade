import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";

ChartJS.register(BarElement, CategoryScale, LinearScale);

const App = () => {
  const [input, setInput] = useState({
    segment: "NIFTY",
    strike: "",
    pcr: "",
    callPrice: "",
    putPrice: "",
    spot: "",
  });
  const [suggestion, setSuggestion] = useState(null);
  const [trades, setTrades] = useState([]);
  const [capital] = useState(
    () => parseFloat(localStorage.getItem("capital")) || 10000
  );
  const [darkMode, setDarkMode] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [displayTrades, setDisplayTrades] = useState([]);
  const [filter, setFilter] = useState(false);

  const maxTradesPerDay = 3;
  const dailyTarget = 3000;

  // Load trades once
  useEffect(() => {
    const saved = localStorage.getItem("pcr_trade_logs");
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  // Handle display trades on change
  useEffect(() => {
    const selectedTrades = filter
      ? trades.filter(
          (t) =>
            new Date(t.date).toDateString() === new Date(date).toDateString()
        )
      : trades;
    setDisplayTrades(selectedTrades);
  }, [trades, filter, date]);

  const handleChange = (e) =>
    setInput({ ...input, [e.target.name]: e.target.value });

  const handleEditChange = (e, index) => {
    const { name, value } = e.target;
    setTrades((prevTrades) => {
      const updated = [...prevTrades];
      const filtered = filter
        ? updated.filter(
            (t) =>
              new Date(t.date).toDateString() === new Date(date).toDateString()
          )
        : updated;

      const targetIndex = filter ? filtered[index] : updated[index];

      if (!targetIndex) return prevTrades;

      const updatedTrade = { ...targetIndex, [name]: value };
      const lotSize = parseFloat(updatedTrade.qty);
      const entry = parseFloat(updatedTrade.entry);
      const exit = parseFloat(updatedTrade.exit);

      if (!isNaN(entry) && !isNaN(exit) && !isNaN(lotSize)) {
        const profit = ((exit - entry) * lotSize).toFixed(2);
        const percent = ((profit / (entry * lotSize)) * 100).toFixed(2);
        updatedTrade.result = profit;
        updatedTrade.percentage = percent;
      } else {
        updatedTrade.result = "";
        updatedTrade.percentage = "";
      }

      const idx = updated.findIndex(
        (t) => t.date === updatedTrade.date && t.strike === targetIndex.strike
      );

      updated[idx] = updatedTrade;

      localStorage.setItem("pcr_trade_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const calculate = () => {
    const { strike, pcr, callPrice, putPrice, spot } = input;
    const pcrNum = parseFloat(pcr);
    const cp = parseFloat(callPrice);
    const pp = parseFloat(putPrice);
    const spotPrice = parseFloat(spot);
    const strikePrice = parseFloat(strike);

    if ([pcrNum, cp, pp, spotPrice, strikePrice].some(Number.isNaN)) {
      alert("Please enter all values correctly.");
      return;
    }

    let side = "NEUTRAL";
    let entry = 0;
    let stopLoss = 0;
    let targets = [];

    if (pcrNum > 1.3) {
      side = "PUT";
      entry = pp;
      stopLoss = (pp * 0.75).toFixed(2);
      targets = [
        (pp * 1.2).toFixed(2),
        (pp * 1.4).toFixed(2),
        (pp * 1.6).toFixed(2),
      ];
    } else if (pcrNum < 0.7) {
      side = "CALL";
      entry = cp;
      stopLoss = (cp * 0.75).toFixed(2);
      targets = [
        (cp * 1.2).toFixed(2),
        (cp * 1.4).toFixed(2),
        (cp * 1.6).toFixed(2),
      ];
    }

    setSuggestion({ side, entry, stopLoss, targets });
  };

  const takeTrade = () => {
    const today = new Date().toDateString();
    const lotSize = input.segment === "SENSEX" ? 20 : 75;
    const newTrade = {
      ...input,
      date: today,
      side: suggestion.side,
      entry: suggestion.entry,
      stopLoss: suggestion.stopLoss,
      targets: suggestion.targets,
      qty: lotSize,
      exit: "",
      result: "",
      percentage: "",
      note: "",
    };
    const updatedTrades = [...trades, newTrade];
    setTrades(updatedTrades);
    localStorage.setItem("pcr_trade_logs", JSON.stringify(updatedTrades));
    setSuggestion(null);
  };

  const deleteAllTrades = () => {
    if (window.confirm("Delete all trades?")) {
      setTrades([]);
      localStorage.removeItem("pcr_trade_logs");
    }
  };

  const todayProfit = trades
    .filter((t) => t.date === new Date().toDateString())
    .reduce((acc, t) => acc + parseFloat(t.result || 0), 0);

  const grouped = {};
  trades.forEach((t) => {
    const label = new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    grouped[label] = (grouped[label] || 0) + parseFloat(t.result || 0);
  });

  const chartData = {
    labels: Object.keys(grouped),
    datasets: [
      {
        label: "Total P&L",
        data: Object.values(grouped),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    setFilter(selectedDate !== new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-6">📊 PCR Trade Analyzer</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn btn-outline-dark"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Input Section */}
      <div className="card shadow p-4 mb-5">
        <h5 className="mb-3">📥 Enter Trade Inputs</h5>
        <div className="row g-3">
          {Object.entries(input).map(([key, value]) => (
            <div className="col-md-4" key={key}>
              <label className="form-label text-capitalize">{key}</label>
              <input
                type="text"
                className="form-control"
                name={key}
                value={value}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="btn btn-success w-100" onClick={calculate}>
            Get Trade Suggestion
          </button>
        </div>
      </div>

      {/* Suggestion */}
      {suggestion && (
        <div className="alert alert-info p-4">
          <h5>📢 Trade Suggestion</h5>
          {suggestion.side === "NEUTRAL" ? (
            <p>No trade suggestion. Market is neutral.</p>
          ) : (
            <>
              <p>
                <strong>Side:</strong> {suggestion.side}
              </p>
              <p>
                <strong>Entry:</strong> ₹{suggestion.entry}
              </p>
              <p>
                <strong>Stop Loss:</strong> ₹{suggestion.stopLoss}
              </p>
              <p>
                <strong>Targets:</strong> {suggestion.targets.join(", ")}
              </p>
              <button className="btn btn-primary mt-3" onClick={takeTrade}>
                ✅ Take Trade
              </button>
            </>
          )}
        </div>
      )}

      {/* Trade History */}
      <div className="card shadow p-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            📘 Trade History (
            {displayTrades
              .reduce((sum, t) => sum + parseFloat(t.result || 0), 0)
              .toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            )
          </h5>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={deleteAllTrades}
          >
            🗑️ Clear All
          </button>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="row">
            <input
              type="date"
              className="form-control mb-3"
              value={date}
              onChange={handleDateChange}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Segment</th>
                <th>Strike</th>
                <th>Side</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Qty</th>
                <th>Target</th>
                <th>P&L</th>

                {/* <th>Note</th> */}
              </tr>
            </thead>
            <tbody>
              {[...displayTrades]
                // .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((t, index) => (
                  <tr key={index}>
                    <td>{t.date}</td>
                    <td>{t.segment}</td>
                    <td>{t.strike}</td>
                    <td>{t.side}</td>
                    <td>{t.entry}</td>
                    <td>
                      <input
                        name="exit"
                        className="form-control"
                        value={t.exit}
                        onChange={(e) => handleEditChange(e, index)}
                      />
                    </td>
                    <td>
                      <input
                        name="qty"
                        className="form-control"
                        value={t.qty}
                        onChange={(e) => handleEditChange(e, index)}
                      />
                    </td>
                    <td>{t.targets[1]}</td>
                    <td
                      className={
                        parseFloat(t.result) > 0
                          ? "text-success"
                          : "text-danger"
                      }
                    >
                      {t.result} (<span>{t.percentage}%</span>)
                    </td>

                    {/* <td>
                      <input
                        name="note"
                        className="form-control"
                        value={t.note}
                        onChange={(e) => handleEditChange(e, index)}
                      />
                    </td> */}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="card shadow p-4 mb-5">
        <h5 className="mb-3">📈 Daily P&L Chart</h5>
        <Bar data={chartData} />
      </div>

      {/* Summary */}
      <div className="card shadow p-4">
        <h5 className="mb-3">📋 Summary</h5>
        <ul className="list-group">
          <li className="list-group-item">Capital: ₹{capital.toFixed(2)}</li>
          <li className="list-group-item">Target: ₹{dailyTarget.toFixed(2)}</li>
          <li className="list-group-item">
            Today P&L: ₹{todayProfit.toFixed(2)}
          </li>
          <li className="list-group-item">
            Trades Left:{" "}
            {Math.max(
              0,
              maxTradesPerDay -
                trades.filter((t) => t.date === new Date().toDateString())
                  .length
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default App;
