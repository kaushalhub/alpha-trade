// PCRTradeAnalyzer - Fully Modernized UI with Bootstrap 5 Enhancements
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import _ from "lodash";
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
  const [capital, setCapital] = useState(
    () => parseFloat(localStorage.getItem("capital")) || 10000
  );
  const [darkMode, setDarkMode] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState(false);
  const [filterTrades, setFilterTrade] = useState([]);
  const maxTradesPerDay = 5;
  const dailyTarget = 3000;

  useEffect(() => {
    const saved = localStorage.getItem("pcr_trade_logs");
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  const handleChange = (e) =>
    setInput({ ...input, [e.target.name]: e.target.value });

  const handleEditChange = (e, index) => {
    const updatedTrades = [...trades];
    updatedTrades[index][e.target.name] = e.target.value;
    const lotSize = parseFloat(updatedTrades[index].qty);
    if (updatedTrades[index].exit && updatedTrades[index].entry && lotSize) {
      const diff =
        parseFloat(updatedTrades[index].exit) -
        parseFloat(updatedTrades[index].entry);
      const profit = diff * lotSize;
      const percentage = (
        (profit / (parseFloat(updatedTrades[index].entry) * lotSize)) *
        100
      ).toFixed(2);
      updatedTrades[index].result = profit.toFixed(2);
      updatedTrades[index].percentage = percentage;
    }
    setTrades(updatedTrades);
    localStorage.setItem("pcr_trade_logs", JSON.stringify(updatedTrades));
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
    const selected = new Date(e.target.value).toDateString();
    setDate(e.target.value);
    setFilter(selected !== new Date().toDateString());
    setFilterTrade(_.filter(trades, { date: selected }));
  };

  const displayTrades = filter ? filterTrades : trades;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-6">📊 PCR Trade Analyzer</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn btn-outline-dark"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

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

      {suggestion && (
        <div className="alert alert-info p-4">
          <h5>📢 Trade Suggestion</h5>
          {suggestion.side === "NEUTRAL" ? (
            <p>No trade suggestion. Market is neutral.</p>
          ) : (
            <div>
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
            </div>
          )}
        </div>
      )}

      <div className="card shadow p-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            📘 Trade History (
            {_.sumBy(trades, (result) => Number(result.result)).toLocaleString(
              "en-IN",
              {
                style: "currency",
                currency: "INR",
              }
            )}
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
              className="form-control"
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
                <th>%</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {/* {displayTrades.map((t, i) => (
                <tr key={i}>
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
                      onChange={(e) => handleEditChange(e, i)}
                    />
                  </td>
                  <td>
                    <input
                      name="qty"
                      className="form-control"
                      value={t.qty}
                      onChange={(e) => handleEditChange(e, i)}
                    />
                  </td>
                  <td>{t.targets[1]}</td>
                  <td
                    className={
                      parseFloat(t.result) > 0 ? "text-success" : "text-danger"
                    }
                  >
                    {t.result}
                  </td>
                  <td>{t.percentage}%</td>
                  <td>
                    <input
                      name="note"
                      className="form-control"
                      value={t.note}
                      onChange={(e) => handleEditChange(e, i)}
                    />
                  </td>
                </tr>
              ))} */}
              {[...displayTrades]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
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
                      {t.result}
                    </td>
                    <td>{t.percentage}%</td>
                    <td>
                      <input
                        name="note"
                        className="form-control"
                        value={t.note}
                        onChange={(e) => handleEditChange(e, index)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card shadow p-4 mb-5">
        <h5 className="mb-3">📈 Daily P&L Chart</h5>
        <Bar data={chartData} />
      </div>

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
