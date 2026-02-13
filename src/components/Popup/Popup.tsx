import type { ReactNode } from "react";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Popup.css";

const Popup = (props: { width: string; height?: string; dismiss: () => void; children: ReactNode }) => {
  return (
    <div className="popup-background">
      <div className="popup" style={{ width: props.width, height: props.height }}>
        <button type="button" className="close" onClick={() => props.dismiss()}>
          <FontAwesomeIcon icon={faTimesCircle} size="lg" />
        </button>
        {props.children}
      </div>
    </div>
  );
};

export default Popup;
