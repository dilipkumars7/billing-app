import React from "react";
import "../css/overlayLoader.css";

interface OverlayLoaderProps {
  visible: boolean;
}

export const OverlayLoader: React.FC<OverlayLoaderProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className='lmask cursor-progress'>
      <div className="loader-line-mask">
        <div className="loader-line"></div>
      </div>
      <div className="message select-none">
        <h4>LOADING</h4>
      </div>
    </div>
  );
};
