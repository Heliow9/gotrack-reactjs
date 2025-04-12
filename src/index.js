import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import ProtectedRoute from "../src/components/ProtectedRoute";
import { MapProvider } from './Context/MapContext'
import { PedidosProvider } from "./Context/PedidosContext";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MapProvider>
              <PedidosProvider>
                <App />
              </PedidosProvider>
            </MapProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);
