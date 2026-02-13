import "./XAxis.css";

const DistanceAxis = ({ width }: { width: number }) => (
  <div className="x-axis x-axis-distance" style={{ width }}>
    {[...new Array(44)].map((_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: This is a static array that will never change, so using the index as key is fine.
      <span key={i}>{i}K</span>
    ))}
  </div>
);

export default DistanceAxis;
