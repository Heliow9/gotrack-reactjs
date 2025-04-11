import React, { useState } from "react";
import Mapa from "../components/Mapa";
import ModalPedido from "../components/ModalPedido";

import { Container } from '@mui/material';
const Dashboard = () => {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <Container maxWidth="xl">
      <h2>Mapa de Entregadores</h2>
      <button onClick={() => setModalAberto(true)} className="botao-novo-pedido">
        + Novo Pedido
      </button>

      <div className="mapa-wrapper">
        <Mapa />
      </div>

      <ModalPedido isOpen={modalAberto} onClose={() => setModalAberto(false)} />
    </Container>
  );
};

export default Dashboard;
