import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import InputForm from "./components/InputForm";
import SuggestionBox from "./components/SuggestionBox";
import TradeTable from "./components/TradeTable";
import PnLChart from "./components/PnLChart";
import Summary from "./components/Summery";
import GoalGaugeChart from "./components/GoalGaugeChart";
import "bootstrap/dist/css/bootstrap.min.css";
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
  const [capital] = useState(
    () => parseFloat(localStorage.getItem("capital")) || 10000
  );
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pcr_trade_logs");
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  const handleChange = (e) =>
    setInput({ ...input, [e.target.name]: e.target.value });

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

  const todayProfit = trades
    .filter((t) => t.date === new Date().toDateString())
    .reduce((acc, t) => acc + parseFloat(t.result || 0), 0);

  const maxTradesPerDay = 3;

  return (
    <div className="container py-5">
      <Header
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      <div className="row">
        <div className="col-md-8">
          <PnLChart data={chartData} />
        </div>
        <div className="col-md-4">
          <GoalGaugeChart current={1052.98} target={1200} />
        </div>
      </div>
      <InputForm
        input={input}
        handleChange={handleChange}
        calculate={calculate}
      />
      <SuggestionBox suggestion={suggestion} takeTrade={takeTrade} />
      <TradeTable trades={trades} setTrades={setTrades} />

      <Summary
        capital={capital}
        dailyTarget={3000}
        todayProfit={todayProfit}
        tradesLeft={Math.max(
          0,
          maxTradesPerDay -
            trades.filter((t) => t.date === new Date().toDateString()).length
        )}
      />
    </div>
  );
};

export default App;
