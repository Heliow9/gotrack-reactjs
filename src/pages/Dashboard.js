import React from "react";
import Mapa from "../components/Mapa";
import "../Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h2>Mapa de Entregadores</h2>
      <div className="mapa-wrapper">
        <Mapa />
      </div>
    </div>
  );
};

export default Dashboard;
