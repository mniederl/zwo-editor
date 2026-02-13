import { Zones } from "../constants";
import "./ZoneAxis.css";

const ZoneAxis = ({ powerScale }: { powerScale: number }) => (
  <div className="zone-axis">
    {Object.entries(Zones)
      .reverse()
      .map(([name, zone]) => (
        <div key={name} style={{ height: powerScale * zone.max }}>
          {name}
        </div>
      ))}
  </div>
);

export default ZoneAxis;
