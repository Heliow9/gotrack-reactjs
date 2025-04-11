import React, { useState } from "react";
import Mapa from "../components/Mapa";
import ModalPedido from "../components/ModalPedido";
import "../Dashboard.css";

const Dashboard = () => {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="dashboard-container">
      <h2>Mapa de Entregadores</h2>
      <button onClick={() => setModalAberto(true)} className="botao-novo-pedido">
        + Novo Pedido
      </button>

      <div className="mapa-wrapper">
        <Mapa />
      </div>

      <ModalPedido isOpen={modalAberto} onClose={() => setModalAberto(false)} />
    </div>
  );
};

export default Dashboard;
