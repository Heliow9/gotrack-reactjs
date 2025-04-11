import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import io from 'socket.io-client';
import axios from 'axios';
import { useMapContext } from '../Context/MapContext';


import capacete from '../assets/helmet.png';
import restaurantePin from '../assets/restaurantPin.png';

const apiUrl = 'https://gotrackapi.onrender.com';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ'; // <-- Substitua por sua chave da Mapbox

const Mapa = () => {
  const [motoristas, setMotoristas] = useState([]);
  const [restauranteId, setRestauranteId] = useState(null);
  const [restauranteData, setRestauranteData] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const mapRef = useRef();
  const { selectedPosition, pedidosMap } = useMapContext();


  useEffect(() => {
    const fetchRestaurante = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${apiUrl}/api/restaurantes/me`, {
          method: "GET",
          headers: { Authorization: token },
        });

        if (!response.ok) throw new Error("Erro ao buscar restaurante");

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

    return () => socket.disconnect();
  }, [restauranteId]);
  console.log(pedidosMap)
  useEffect(() => {
    const geocodificarPedidos = async () => {
      if (!pedidosMap || pedidosMap.length === 0) return;
     

      const geocodificados = await Promise.all(
        pedidosMap.map(async (pedido) => {
          try {
            const response = await axios.get(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pedido.enderecoCliente)}.json`,
              {
                params: {
                  access_token: 'pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ',
                  limit: 1,
                },
              }
            );
            console.log(response)
            if (response.data.features && response.data.features.length > 0) {
              const [lon, lat] = response.data.features[0].geometry.coordinates;
              return {
                ...pedido,
                latitude: lat,
                longitude: lon,
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
  }, [restauranteId, pedidosMap]);

  // Centralizar quando selecionar um pedido
  useEffect(() => {
    if (!selectedPosition || !mapRef.current) return;
    const pedido = pedidos.find(p => p._id === selectedPosition);
    if (pedido) {
      mapRef.current.flyTo({
        center: [pedido.longitude, pedido.latitude],
        zoom: 15,
        duration: 1500,
      });
    }
  }, [selectedPosition, pedidos]);

  // Obter centro aproximado de todos os pontos
  const getMapCenter = () => {

    const pontos = [
      ...motoristas,
      ...pedidos,
      restauranteData?.localizacao,
    ].filter(Boolean);

    if (!pontos.length) return [-34.8808, -8.0476]; // fallback: Recife

    const avgLat =
      pontos.reduce((sum, p) => sum + (p.latitude || p.lat), 0) / pontos.length;
    const avgLon =
      pontos.reduce((sum, p) => sum + (p.longitude || p.lon), 0) / pontos.length;

    return [avgLon, avgLat];
  };

  return (
    restauranteData &&
    <div style={{
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%', // ocupa 100% da altura da tela
      width: '100%',  // ocupa 100% da largura da tela
      overflow: 'hidden', // impede qualquer barra de rolagem
    }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: restauranteData.localizacao.longitude,
          latitude: restauranteData.localizacao.latitude,
          zoom: 14,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Restaurante */}
        {restauranteData && (
          <Marker
            longitude={restauranteData.localizacao.longitude}
            latitude={restauranteData.localizacao.latitude}
          >
            <img src={restaurantePin} alt="Restaurante" style={{ width: 40 }} />
          </Marker>
        )}

        {/* Motoristas */}
        {motoristas.map((m) => (
          <Marker key={m.email} longitude={m.longitude} latitude={m.latitude}>
            <img src={capacete} alt="Motorista" style={{ width: 32 }} />
          </Marker>
        ))}

        {pedidos.length > 0 ? pedidos
          .filter(p => !isNaN(p.latitude) && !isNaN(p.longitude)) // <- importante!
          .map((p) => (
            <Marker key={p._id} longitude={p.longitude} latitude={p.latitude}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/3448/3448604.png"
                alt="Pedido"
                style={{ width: 28 }}
              />
              <Popup anchor="top" closeButton={false} longitude={p.longitude} latitude={p.latitude}>
                <strong>Pedido:</strong> {p.nomeCliente}
              </Popup>
            </Marker>
          )) : null}

      </Map>
    </div>
  );
};

export default Mapa;
