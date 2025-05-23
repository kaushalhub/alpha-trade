import React, { useEffect, useState } from "react";

const TradeTable = ({ trades, setTrades }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState(false);
  const [displayTrades, setDisplayTrades] = useState([]);

  useEffect(() => {
    const selectedTrades = filter
      ? trades.filter(
          (t) =>
            new Date(t.date).toDateString() === new Date(date).toDateString()
        )
      : trades;
    setDisplayTrades(selectedTrades);
  }, [trades, date, filter]);

  const handleDateChange = (e) => {
    const selected = e.target.value;
    setDate(selected);
    setFilter(selected !== new Date().toISOString().split("T")[0]);
  };

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

  const deleteAllTrades = () => {
    if (window.confirm("Delete all trades?")) {
      setTrades([]);
      localStorage.removeItem("pcr_trade_logs");
    }
  };

  const totalPnL = displayTrades.reduce(
    (sum, t) => sum + parseFloat(t.result || 0),
    0
  );

  return (
    <div className="card shadow p-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          📘 Trade History (
          {totalPnL.toLocaleString("en-IN", {
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

      <div className="row mb-3">
        <div className="col-md-4">
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
            </tr>
          </thead>
          <tbody>
            {displayTrades.map((t, index) => (
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
                  {t.result} (<span>{t.percentage}%</span>)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeTable;
