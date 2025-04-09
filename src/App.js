import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Pedidos from "./pages/Pedidos";
import Motoristas from "./pages/Motoristas";
import Configuracoes from "./pages/Configuracoes";
import PedidosEmAndamento from "./components/PedidosEmAndamento";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const token = localStorage.getItem("token");
  const [showSidebar, setShowSidebar] = useState(true);


  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {showSidebar ? <Sidebar /> : <PedidosEmAndamento />}
        <div className="main-content">
          <header className="header">
            <h1>GoTrack - Painel de Entregas</h1>

          </header>
          <div className="dashboard-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pedidos" element={<Pedidos />} />
              <Route path="/motoristas" element={<Motoristas />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
