import "./SpeedAxis.css";

const SpeedAxis = () => (
  <div className="speed-axis">
    {[...Array(30)].map((_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: This is a static array that will never change, so using the index as key is fine.
      <div key={i} className="speed-block" style={{ height: 31, bottom: 31 * i }}>
        <div className="speed-label">{i} km/h</div>
      </div>
    ))}
  </div>
);

export default SpeedAxis;
