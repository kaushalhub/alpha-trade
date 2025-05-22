// Updated PCRTradeAnalyzer.jsx with full feature suite
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Bar } from "react-chartjs-2";
import _ from "lodash";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

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
  const [targetAchieved, setTargetAchieved] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  let today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState(false);
  const [filterTrades, setFilterTrade] = useState([]);

  const maxTradesPerDay = 5;
  const dailyTarget = 3000;

  useEffect(() => {
    const saved = localStorage.getItem("pcr_trade_logs");
    if (saved) {
      setTrades(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

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

    if (
      isNaN(pcrNum) ||
      isNaN(cp) ||
      isNaN(pp) ||
      isNaN(spotPrice) ||
      isNaN(strikePrice)
    ) {
      alert("Please enter all values correctly.");
      return;
    }

    let side = "";
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
    } else {
      side = "NEUTRAL";
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
      segment: input.segment,
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
    if (window.confirm("Are you sure you want to delete all trades?")) {
      setTrades([]);
      localStorage.removeItem("pcr_trade_logs");
    }
  };

  const todayProfit = trades
    .filter((t) => t.date === new Date().toDateString())
    .reduce((acc, t) => acc + parseFloat(t.result || 0), 0);

  const grouped = {};

  trades.forEach((t) => {
    const dateObj = new Date(t.date);
    const label = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }); // e.g., "May 22"

    const result = parseFloat(t.result || 0);

    if (!grouped[label]) {
      grouped[label] = 0;
    }

    grouped[label] += result;
  });

  const labels = Object.keys(grouped);
  const data = labels.map((label) => grouped[label]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Profit/Loss",
        data,
        backgroundColor: "#a0d0f5",
        barThickness: 30,
      },
    ],
  };
  const handleDateChange = (e) => {
    if (e.target.value == today) {
      setFilter(false);
      setDate(today);
    } else {
      setFilter(true);
      const selectedDate = e.target.value;
      setDate(selectedDate);
      console.log("Selected date:", selectedDate);

      setFilterTrade(_.filter(trades, { date: selectedDate }));
    }

    // today = new Date(e.target.value).toISOString().split("T")[0]; // "YYYY-MM-DD"
  };

  return (
    <div className={`container py-4 ${darkMode ? "bg-dark text-white" : ""}`}>
      <h2 className="mb-4 text-center">🎯 PCR Trade Analyzer</h2>
      <div className="d-flex justify-content-end mb-2">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="card p-4 mb-4">
        <div className="row mb-3">
          <div className="col">
            <select
              className="form-control"
              name="segment"
              value={input.segment}
              onChange={handleChange}
            >
              <option value="NIFTY">NIFTY</option>
              <option value="SENSEX">SENSEX</option>
            </select>
          </div>
          <div className="col">
            <input
              className="form-control"
              name="strike"
              placeholder="Strike Price"
              value={input.strike}
              onChange={handleChange}
            />
          </div>
          <div className="col">
            <input
              className="form-control"
              name="pcr"
              placeholder="PCR"
              value={input.pcr}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col">
            <input
              className="form-control"
              name="spot"
              placeholder="Spot Price"
              value={input.spot}
              onChange={handleChange}
            />
          </div>
          <div className="col">
            <input
              className="form-control"
              name="callPrice"
              placeholder="Call Price"
              value={input.callPrice}
              onChange={handleChange}
            />
          </div>
          <div className="col">
            <input
              className="form-control"
              name="putPrice"
              placeholder="Put Price"
              value={input.putPrice}
              onChange={handleChange}
            />
          </div>
          <div className="col">
            <button className="btn btn-success w-100" onClick={calculate}>
              Get Trade Suggestion
            </button>
          </div>
        </div>
      </div>

      {suggestion && (
        <div className="card p-4 mb-3">
          <h4>📢 Suggested Trade</h4>
          {suggestion.side === "NEUTRAL" ? (
            <p>Market is neutral. No trade suggested.</p>
          ) : (
            <>
              <p>
                <strong>Side:</strong> {suggestion.side}
              </p>
              <p>
                <strong>Entry Price:</strong> ₹{suggestion.entry}
              </p>
              <p>
                <strong>Stop Loss:</strong> ₹{suggestion.stopLoss}
              </p>
              <p>
                <strong>Targets:</strong>
              </p>
              <ul>
                {suggestion.targets.map((t, idx) => (
                  <li key={idx}>₹{t}</li>
                ))}
              </ul>
              <button className="btn btn-primary mt-3" onClick={takeTrade}>
                ✅ Take This Trade
              </button>
            </>
          )}
        </div>
      )}

      {/* {trades.length > 0 && (
        
      )} */}
      {!filter && (
        <div className="card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>
              📘 Trade History Total P&L (
              {_.sumBy(trades, (result) => Number(result.result))})
            </h4>
            {/* // _.sumBy(trades, result)} */}
            <button className="btn btn-danger btn-sm" onClick={deleteAllTrades}>
              🗑️ Delete All Trades
            </button>
          </div>

          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <h4>Filter: </h4>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e)}
            />
          </div>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Segment</th>
                <th>Strike</th>
                <th>Side</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Lot</th>
                <th>Target</th>
                <th>P&L</th>
                <th>%</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, index) => (
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
                      onChange={(e) => handleEditChange(e, index)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filter && (
        <div className="card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>
              📘 Trade History Total P&L (
              {_.sumBy(filterTrades, (result) => Number(result.result))})
            </h4>
          </div>

          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <h4>Filter: </h4>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e)}
            />
          </div>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Segment</th>
                <th>Strike</th>
                <th>Side</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Lot</th>
                <th>Target</th>
                <th>P&L</th>
                <th>%</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filterTrades.map((t, index) => (
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
                      onChange={(e) => handleEditChange(e, index)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-4 mb-4">
        <h5>📈 Daily P&L Chart</h5>
        <Bar data={chartData} />
      </div>

      <div className="card p-4">
        <h5>📋 Summary</h5>
        <p>
          <strong>Capital:</strong> ₹{capital.toFixed(2)}
        </p>
        <p>
          <strong>Target:</strong> ₹{dailyTarget.toFixed(2)}
        </p>
        <p>
          <strong>Trades Left:</strong>{" "}
          {Math.max(
            0,
            maxTradesPerDay -
              trades.filter((t) => t.date === new Date().toDateString()).length
          )}
        </p>
        <p>
          <strong>Today P&L:</strong> ₹{todayProfit.toFixed(2)}
        </p>
        {targetAchieved && <p className="text-success">🎯 Target achieved</p>}
      </div>
    </div>
  );
};

export default App;
