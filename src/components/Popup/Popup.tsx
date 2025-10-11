import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Popup.css";

const Popup = (props: { width: string; height?: string; dismiss: Function; children: any }) => {
  return (
    <div className="popup-background">
      <div className="popup" style={{ width: props.width, height: props.height }}>
        <button className="close" onClick={() => props.dismiss()}>
          <FontAwesomeIcon icon={faTimesCircle} size="lg" />
        </button>
        {props.children}
      </div>
    </div>
  );
};

export default Popup;
