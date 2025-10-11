import React from "react";
import { Zones } from "../constants";
import "./ZoneAxis.css";

const ZoneAxis = () => (
  <div className="zone-axis">
    {Object.entries(Zones)
      .reverse()
      .map(([name, zone]) => (
        <div key={name} style={{ height: 250 * zone.max }}>
          {name}
        </div>
      ))}
  </div>
);

export default ZoneAxis;
