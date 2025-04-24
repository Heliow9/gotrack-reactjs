import React from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Pedidos from "./pages/Pedidos";
import Motoristas from "./pages/Motoristas";
import Configuracoes from "./pages/Configuracoes";
import Produtos from "./pages/Produtos";
import Publico from "./pages/Publico";
import PedidoSlugRedirect from "./pages/PedidoSlugRedirect";
import ErroRestaurante from "./pages/ErroRestaurante";
import Login from "./pages/Login"; // 🔥 Aqui você importa a sua tela de login existente
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import "./App.css";
import { useUI } from "../src/Context/UIContext";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const AppLayout = () => {
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
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Rota de login existente (necessária para o Navigate funcionar) */}
      <Route path="/login" element={<Login />} />

      {/* Rota especial que seta o restaurante no localStorage */}
      <Route path="/pedido/:slug" element={<PedidoSlugRedirect />} />

      {/* Rota que carrega o painel público do restaurante com dados locais */}
      <Route path="/pedido" element={<Publico />} />

      {/* Página de erro se restaurante não estiver disponível */}
      <Route path="/erro" element={<ErroRestaurante />} />

      {/* Rotas privadas (dashboard) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="motoristas" element={<Motoristas />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 20px",
  backgroundColor: "#f5f5f5",
  borderBottom: "1px solid #ddd",
};

export default App;
