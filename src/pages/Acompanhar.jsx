// src/pages/Acompanhar.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { API_ORIGIN, MAPBOX_TOKEN } from "../config";

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export default function Acompanhar() {
  const { token } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/publico/acompanhar/${token}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!ativo) return;
        setDados(json);
        setErro(null);
      } catch (e) {
        if (!ativo) return;
        setErro(e.message || "Não foi possível acompanhar este pedido.");
      }
    };

    buscar();
    const interval = setInterval(buscar, 10000);
    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    const loc = dados?.localizacao;
    if (!MAPBOX_TOKEN || dados?.status !== "em_entrega" || !loc?.longitude || !loc?.latitude || !mapContainer.current) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [loc.longitude, loc.latitude],
        zoom: 15,
      });

      marker.current = new mapboxgl.Marker().setLngLat([loc.longitude, loc.latitude]).addTo(map.current);
    } else {
      map.current.setCenter([loc.longitude, loc.latitude]);
      marker.current?.setLngLat([loc.longitude, loc.latitude]);
    }
  }, [dados]);

  if (erro?.toLowerCase().includes("entregue")) {
    return <Alert severity="success">Pedido entregue com sucesso!</Alert>;
  }

  if (erro) return <Alert severity="error">{erro}</Alert>;
  if (!dados) return <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7fb", p: 2 }}>
      <Paper sx={{ maxWidth: 720, mx: "auto", p: 3, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          Acompanhar entrega
        </Typography>
        <Typography>Cliente: {dados.cliente || dados.nomeCliente || "Cliente"}</Typography>
        <Typography>Entregador: {dados.entregadorNome || dados.entregador?.nome || "Motoboy"}</Typography>
        <Typography>Status: {dados.status || "Atualizando"}</Typography>

        {dados.status === "em_entrega" && MAPBOX_TOKEN && (
          <Box ref={mapContainer} sx={{ height: 400, mt: 2, borderRadius: 3, overflow: "hidden" }} />
        )}

        {dados.status === "em_entrega" && !MAPBOX_TOKEN && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Entrega em andamento. Configure VITE_MAPBOX_TOKEN para exibir o mapa em tempo real.
          </Alert>
        )}

        {dados.status === "entregue" && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Pedido entregue com sucesso! Obrigado por usar a Movyo.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
