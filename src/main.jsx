// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import App from "./App";
import { MapProvider } from "./Context/MapContext";
import { PedidosProvider } from "./Context/PedidosContext";
import { UIProvider } from "./Context/UIContext";
import theme from "./theme"; // 👈 novo tema

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MapProvider>
          <PedidosProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </PedidosProvider>
        </MapProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
