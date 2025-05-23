const SuggestionBox = ({ suggestion, takeTrade }) =>
  suggestion && (
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
  );

export default SuggestionBox;
