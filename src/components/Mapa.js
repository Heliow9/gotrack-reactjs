import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import io from "socket.io-client";
import "leaflet/dist/leaflet.css";
import capacete from '../assets/helmet.png';
import restaurantePin from '../assets/restaurantPin.png';
import { pedidosFake } from './PedidosEmAndamento'
import axios from "axios";
import { useMapContext } from "../Context/MapContext";

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

const pedidoIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448604.png", // um ícone de pacote
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});



const Mapa = () => {
  const [motoristas, setMotoristas] = useState([]);
  const [restauranteId, setRestauranteId] = useState(null);
  const [restauranteData, setRestauranteData] = useState(null);
  const [pedidos, setPedidos] = useState([]);




  const CameraController = () => {
    const { selectedPosition } = useMapContext();
    const map = useMap();
  
    useEffect(() => {
      if (selectedPosition) {
        const pedidoEncontrado = pedidos.find(
          (pedido) => pedido._id === selectedPosition
        );
  
        if (pedidoEncontrado) {
          map.flyTo([pedidoEncontrado.latitude, pedidoEncontrado.longitude], 15, {
            duration: 1.5,
          });
        }
      }
    }, [selectedPosition, map, pedidos]);
  
    return null;
  };
    





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



  useEffect(() => {
    const geocodificarPedidos = async () => {
      const pedidosDoRestaurante = pedidosFake.filter(
        (p) => p.restauranteId === restauranteId
      );

      const geocodificados = await Promise.all(
        pedidosDoRestaurante.map(async (pedido) => {
          try {
            const geo = await axios.get(
              `https://nominatim.openstreetmap.org/search`,
              {
                params: {
                  q: pedido.enderecoCliente,
                  format: "json",
                  addressdetails: 1,
                  limit: 1,
                },
              }
            );

            if (geo.data[0]) {
              return {
                ...pedido,
                latitude: parseFloat(geo.data[0].lat),
                longitude: parseFloat(geo.data[0].lon),
              };
            }
            return null;
          } catch (err) {
            console.error(`Erro ao geocodificar ${pedido._id}:`, err);
            return null;
          }
        })
      );

      setPedidos(geocodificados.filter(Boolean));
    
    };

    if (restauranteId) {
      geocodificarPedidos();
    }
    console.log(pedidos)
  }, [restauranteId]);




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
            <CameraController />
            {/* Pedidos com localização */}
            {pedidos.map((pedido) => (
              <Marker
                key={pedido._id}
                position={[pedido.latitude, pedido.longitude]}
                icon={pedidoIcon}
              >
                <Popup>
                  <span><strong>ID do Pedido:</strong> {pedido._id}</span>
                  <br />
                  Cliente: {pedido.nomeCliente}
                </Popup>
              </Marker>
            ))}
          </MapContainer> : null
      }

    </div>
  );
};

export default Mapa;
