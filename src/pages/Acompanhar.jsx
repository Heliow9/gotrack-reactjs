// src/pages/Acompanhar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { API_URL, MAPBOX_TOKEN } from '../config';

export default function Acompanhar() {
  const { token } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const mapboxRef = useRef(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await fetch(`${API_URL}/publico/acompanhar/${token}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setDados(json);
      } catch (e) {
        setErro(e.message);
      }
    };

    buscar();
    const interval = setInterval(buscar, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!(dados?.status === 'em_entrega' && dados.localizacao && mapContainer.current && MAPBOX_TOKEN)) return;

    let cancelled = false;

    const carregarMapa = async () => {
      const mapboxModule = await import('mapbox-gl');
      await import('mapbox-gl/dist/mapbox-gl.css');
      if (cancelled) return;

      const mapboxgl = mapboxModule.default || mapboxModule;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      mapboxRef.current = mapboxgl;

      const lngLat = [dados.localizacao.longitude, dados.localizacao.latitude];

      if (!map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: lngLat,
          zoom: 15,
        });

        marker.current = new mapboxgl.Marker().setLngLat(lngLat).addTo(map.current);
      } else {
        map.current.setCenter(lngLat);
        marker.current?.setLngLat(lngLat);
      }
    };

    carregarMapa().catch((e) => setErro(e?.message || 'Não foi possível carregar o mapa.'));
    return () => { cancelled = true; };
  }, [dados]);

  useEffect(() => {
    return () => {
      try { map.current?.remove?.(); } catch {}
      map.current = null;
      marker.current = null;
    };
  }, []);

  if (erro?.includes('entregue')) {
    return <Alert severity="success">✅ Pedido entregue com sucesso!</Alert>;
  }

  if (erro) return <Alert severity="error">❌ {erro}</Alert>;
  if (!dados) return <CircularProgress />;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Entrega de {dados.cliente}
      </Typography>
      <Typography variant="body1">Entregador: {dados.entregador || 'Motoboy'}</Typography>
      <Typography>Status: {dados.status}</Typography>

      {dados.status === 'em_entrega' && MAPBOX_TOKEN && (
        <Box ref={mapContainer} sx={{ height: 400, mt: 2, borderRadius: 2, overflow: 'hidden' }} />
      )}

      {dados.status === 'em_entrega' && !MAPBOX_TOKEN && (
        <Alert severity="info" sx={{ mt: 2 }}>
          A entrega está em rota. O mapa será exibido quando o token do Mapbox estiver configurado.
        </Alert>
      )}

      {dados.status === 'entregue' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ✅ Pedido entregue com sucesso! Obrigado por usar o Movyo.
        </Alert>
      )}
    </Box>
  );
}
