import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";

const Publico = lazy(() => import("./pages/Publico"));
const Carrinho = lazy(() => import("./pages/Carrinho"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PedidosCliente = lazy(() => import("./pages/PedidosCliente"));
const Acompanhar = lazy(() => import("./pages/Acompanhar"));
const ErroRestaurante = lazy(() => import("./pages/ErroRestaurante"));

const getUltimoSlugRestaurante = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("restauranteSelecionado") || "null");
    const r = raw?.restaurante && typeof raw.restaurante === "object" ? raw.restaurante : raw;
    return r?.slugIdentificador || r?.slug || null;
  } catch {
    return null;
  }
};

const getCaminhoUltimaVitrine = () => {
  const slug = getUltimoSlugRestaurante();
  return slug ? `/p/${slug}` : "/p";
};

const RedirectParaUltimaVitrine = () => <Navigate to={getCaminhoUltimaVitrine()} replace />;

const LoadingPublico = () => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 2,
      color: "#fff",
      background:
        "radial-gradient(circle at top left, rgba(255,59,138,.25), transparent 42%), radial-gradient(circle at bottom right, rgba(255,155,45,.22), transparent 46%), #050816",
    }}
  >
    <CircularProgress color="inherit" size={28} />
    <Typography fontWeight={800}>Carregando vitrine...</Typography>
  </Box>
);

const App = () => {
  return (
    <Suspense fallback={<LoadingPublico />}>
      <Routes>
        <Route path="/" element={<RedirectParaUltimaVitrine />} />
        <Route path="/p/:slug" element={<Publico />} />
        <Route path="/p" element={<Publico />} />
        <Route path="/p/carrinho" element={<Carrinho />} />
        <Route path="/p/checkout" element={<Checkout />} />
        <Route path="/p/meus-pedidos/:telefone" element={<PedidosCliente />} />
        <Route path="/p/meus-pedidos" element={<PedidosCliente />} />
        <Route path="/acompanhar/:token" element={<Acompanhar />} />
        <Route path="/erro" element={<ErroRestaurante />} />
        <Route path="*" element={<RedirectParaUltimaVitrine />} />
      </Routes>
    </Suspense>
  );
};

export default App;
