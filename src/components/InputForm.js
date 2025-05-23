const InputForm = ({ input, handleChange, calculate }) => (
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
);

export default InputForm;
