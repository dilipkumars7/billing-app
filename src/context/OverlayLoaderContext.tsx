import React, { createContext, useState, useContext } from "react";

interface OverlayContextType {
  show: () => void;
  hide: () => void;
  visible: boolean;
}

const OverlayLoaderContext = createContext<OverlayContextType | null>(null);

export const OverlayLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return (
    <OverlayLoaderContext.Provider value={{ show, hide, visible }}>
      {children}
    </OverlayLoaderContext.Provider>
  );
};

export const useOverlayLoader = () => {
  const ctx = useContext(OverlayLoaderContext);
  if (!ctx) throw new Error("useOverlayLoader must be inside OverlayLoaderProvider");
  return ctx;
};
