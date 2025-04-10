// MapContext.js
import { createContext, useContext, useState } from "react";

const MapContext = createContext();

export const useMapContext = () => useContext(MapContext);

export const MapProvider = ({ children }) => {
  const [selectedPosition, setSelectedPosition] = useState(null);

  return (
    <MapContext.Provider value={{ selectedPosition, setSelectedPosition }}>
      {children}
    </MapContext.Provider>
  );
};
