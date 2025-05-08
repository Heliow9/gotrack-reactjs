import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { MapProvider } from "./Context/MapContext";
import { PedidosProvider } from "./Context/PedidosContext";
import { UIProvider } from "./Context/UIContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <MapProvider>
      <PedidosProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </PedidosProvider>
    </MapProvider>
  </BrowserRouter>
);
