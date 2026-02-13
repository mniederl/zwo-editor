import type { ReactNode } from "react";
import { CircleX } from "lucide-react";

import "./Popup.css";

const Popup = (props: { width: string; height?: string; dismiss: () => void; children: ReactNode }) => {
  return (
    <div className="popup-background">
      <div className="popup" style={{ width: props.width, height: props.height }}>
        <button type="button" className="close" onClick={() => props.dismiss()}>
          <CircleX className="h-5 w-5" />
        </button>
        {props.children}
      </div>
    </div>
  );
};

export default Popup;
