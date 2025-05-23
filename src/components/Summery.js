const Summary = ({ capital, dailyTarget, todayProfit, tradesLeft }) => (
  <div className="card shadow p-4">
    <h5 className="mb-3">📋 Summary</h5>
    <ul className="list-group">
      <li className="list-group-item">Capital: ₹{capital.toFixed(2)}</li>
      <li className="list-group-item">Target: ₹{dailyTarget.toFixed(2)}</li>
      <li className="list-group-item">Today P&L: ₹{todayProfit.toFixed(2)}</li>
      <li className="list-group-item">Trades Left: {tradesLeft}</li>
    </ul>
  </div>
);

export default Summary;
