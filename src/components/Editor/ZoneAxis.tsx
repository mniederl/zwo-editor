import { Zones } from "@/domain/workout/zones";
import "./ZoneAxis.css";

const zoneRanges = [
  { name: "Z1", min: 0, max: Zones.Z1.max },
  { name: "Z2", min: Zones.Z2.min, max: Zones.Z2.max },
  { name: "Z3", min: Zones.Z3.min, max: Zones.Z3.max },
  { name: "Z4", min: Zones.Z4.min, max: Zones.Z4.max },
  { name: "Z5", min: Zones.Z5.min, max: Zones.Z5.max },
];

const ZoneAxis = ({ powerScale, visibleMaxPower }: { powerScale: number; visibleMaxPower: number }) => (
  <div className="zone-axis">
    {[...zoneRanges, { name: "Z6", min: Zones.Z6.min, max: visibleMaxPower }]
      .filter((zone) => zone.max > zone.min)
      .map((zone) => (
      <div key={zone.name} className="zone-axis-marker" style={{ bottom: ((zone.min + zone.max) / 2) * powerScale }}>
        <span className="zone-axis-label">{zone.name}</span>
      </div>
      ))}
  </div>
);

export default ZoneAxis;
