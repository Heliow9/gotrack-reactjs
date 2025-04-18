import React from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Pedidos from "./pages/Pedidos";
import Motoristas from "./pages/Motoristas";
import Configuracoes from "./pages/Configuracoes";
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import "./App.css";
import { useUI } from "../src/Context/UIContext";

function App() {
  const navigate = useNavigate();
  const { fullscreen } = useUI();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="app-container">
      {!fullscreen && <Sidebar />}

      <div className="main-content">
        {!fullscreen && (
          <header className="header" style={headerStyle}>
            <h1 style={{ margin: 0 }}>GoTrack - Painel de Entregas</h1>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Sair
            </Button>
          </header>
        )}

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
  );
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 20px",
  backgroundColor: "#f5f5f5",
  borderBottom: "1px solid #ddd",
};

export default App;
