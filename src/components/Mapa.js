import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import io from "socket.io-client";
import "leaflet/dist/leaflet.css";
import capacete from '../assets/helmet.png';
import restaurantePin from '../assets/restaurantPin.png';

const apiUrl = 'https://gotrackapi.onrender.com';

const motoristaIcon = new L.Icon({
  iconUrl: capacete,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});


const restauranteIcon = new L.icon({
  iconUrl: restaurantePin,
  iconSize: [32, 45],
  iconAnchor: [16, 32],
  popupAnchor: [0, -50]
})


const Mapa = () => {
  const [motoristas, setMotoristas] = useState([]);
  const [restauranteId, setRestauranteId] = useState(null);
  const [restauranteData, setRestauranteData] = useState(null);

  useEffect(() => {
    // Buscar o restaurante logado
    const fetchRestaurante = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${apiUrl}/api/restaurantes/me`, {
          method: "GET",
          headers: {
            Authorization: token,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar restaurante");
        }

        const data = await response.json();
        setRestauranteId(data._id);
        setRestauranteData(data);
      } catch (error) {
        console.error("Erro ao obter restaurante:", error);
      }
    };

    fetchRestaurante();
  }, []);

  useEffect(() => {
    if (!restauranteId) return;

    const socket = io(apiUrl);

    socket.on("connect", () => {
      console.log("✅ Socket conectado!", socket.id);
      socket.emit("joinRestaurante", { restauranteId });
    });

    socket.on("localizacaoAtualizada", (data) => {
      console.log("📍 Localização recebida:", data);
      setMotoristas((prev) => {
        const atualizados = prev.filter((m) => m.email !== data.email);
        return [...atualizados, data];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [restauranteId]); // só conecta quando o restauranteId estiver disponível

  return (
    <div style={{ height: "600px", width: "100%" }}>
      {
        restauranteData ?
          <MapContainer center={[restauranteData.localizacao.latitude,
          restauranteData.localizacao.longitude]} zoom={17} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {motoristas.map((motorista) => (
              <Marker key={motorista.email} position={[motorista.latitude, motorista.longitude]} icon={motoristaIcon}>
                <Popup>
                  Motorista: <strong>{motorista.email}</strong>
                  <br />
                  Distância até a loja: {Number(motorista.distancia).toFixed(2)}m
                </Popup>
              </Marker>
            ))}
            {restauranteData && (
              <Marker
                key={restauranteData._id}
                position={[
                  restauranteData.localizacao.latitude,
                  restauranteData.localizacao.longitude
                ]}
                icon={restauranteIcon}
              >
                <Popup>
                  Restaurante: <strong>{restauranteData.nome}</strong>
                  <br />
                  Entregas do dia: <strong>{10}</strong>
                </Popup>
              </Marker>
            )}
          </MapContainer> : null
      }

    </div>
  );
};

export default Mapa;
