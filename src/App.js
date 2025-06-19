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
import Login from "./pages/Login";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import PedidosCliente from "./pages/PedidosCliente";
import Acompanhar from "./pages/Acompanhar";
import { TourProvider, useTour } from '@reactour/tour';
import {
  Button,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

import { useUI } from "../src/Context/UIContext";
import { isTokenExpired } from "./utils/auth";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token || isTokenExpired()) {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }
  return children;
};

const AppLayout = () => {
  const navigate = useNavigate();
  const { fullscreen, setFullscreen, setAbrirModalPedido } = useUI();
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", backgroundColor: "#f9f9f9" }}>
      {!fullscreen && <Sidebar />}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {!fullscreen && (
          <AppBar
            elevation={0}
            position="static"
            sx={{
              backgroundColor: "#d90429",
              px: 2,
              height: 68,
              justifyContent: "center",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Toolbar
              disableGutters
              sx={{
                minHeight: "unset",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                RapiGO — Painel de Entregas
              </Typography>

              <Box display="flex" alignItems="center" gap={1.5}>
                <Button
                  onClick={() => setAbrirModalPedido(true)}
                  startIcon={<AddIcon />}
                  variant="contained"
                  size="small"
                  sx={{
                    background: "linear-gradient(90deg, #ff4e4e 0%, #d90429 100%)",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    textTransform: "none",
                    px: 2.5,
                    py: 1,
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: "linear-gradient(90deg, #ff6f6f 0%, #c00325 100%)",
                    },
                  }}
                >
                  Novo Pedido
                </Button>


                <Tooltip title="Exibir mapa em tela cheia">
                  <IconButton
                    size="small"
                    onClick={() => setFullscreen(true)}
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.2)",
                      },
                    }}
                  >
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{
                    color: "#fff",
                    borderColor: "#fff",
                    fontSize: "0.75rem",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderColor: "#fff",
                    },
                  }}
                >
                  Sair
                </Button>
              </Box>
            </Toolbar>
          </AppBar>

        )}

        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: { xs: 1.5, md: 3 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/pedido/:slug" element={<PedidoSlugRedirect />} />
    <Route path="/pedido" element={<Publico />} />
    <Route path="/carrinho" element={<Carrinho />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/meus-pedidos/:telefone" element={<PedidosCliente />} />
    <Route path="/acompanhar/:token" element={<Acompanhar />} /> {/* 👈 NOVA ROTA */}
    <Route path="/erro" element={<ErroRestaurante />} />

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

export default App;
