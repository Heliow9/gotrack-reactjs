import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Publico from "./pages/Publico";
import PedidoSlugRedirect from "./pages/PedidoSlugRedirect";
import ErroRestaurante from "./pages/ErroRestaurante";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import PedidosCliente from "./pages/PedidosCliente";
import Acompanhar from "./pages/Acompanhar";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Publico />} />
      <Route path="/:slug" element={<PedidoSlugRedirect />} />
      <Route path="/p" element={<Publico />} />
      <Route path="/p/:slug" element={<PedidoSlugRedirect />} />
      <Route path="/p/carrinho" element={<Carrinho />} />
      <Route path="/p/checkout" element={<Checkout />} />
      <Route path="/p/meus-pedidos" element={<PedidosCliente />} />
      <Route path="/p/meus-pedidos/:telefone" element={<PedidosCliente />} />
      <Route path="/acompanhar/:token" element={<Acompanhar />} />
      <Route path="/erro" element={<ErroRestaurante />} />
      <Route path="*" element={<Navigate to="/erro" replace />} />
    </Routes>
  );
};

export default App;
