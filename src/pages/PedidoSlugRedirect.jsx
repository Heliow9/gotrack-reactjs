import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Avatar, Stack, LinearProgress } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import axios from "axios";
import { Helmet } from "react-helmet";

import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

const PedidoSlugRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchRestaurante = async () => {
      try {
        const res = await axios.get(`${API_URL}/restaurantes/${slug}`);
        const restaurante = res.data?.restaurante || res.data;

        if (restaurante?._id) {
          localStorage.setItem("restauranteSelecionado", JSON.stringify(restaurante));
          document.title = restaurante.nome ? `${restaurante.nome} - Faça seu pedido` : "Movyo Delivery";
          if (mounted) navigate("/p", { replace: true });
        } else if (mounted) {
          navigate("/erro", { replace: true });
        }
      } catch (error) {
        console.error("Erro ao carregar restaurante:", error);
        if (mounted) navigate("/erro", { replace: true });
      }
    };

    fetchRestaurante();
    return () => {
      mounted = false;
    };
  }, [slug, navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Helmet><title>Movyo Delivery</title></Helmet>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 3,
          borderRadius: 4,
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
        }}
      >
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Avatar sx={{ width: 64, height: 64, bgcolor: "#fff3eb", color: "#ff7a3d" }}>
            <StorefrontIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={1000}>Abrindo sua loja</Typography>
            <Typography variant="body2" color="text.secondary">
              Só um instante enquanto carregamos o cardápio.
            </Typography>
          </Box>
          <LinearProgress sx={{ width: "100%", borderRadius: 999, height: 7 }} />
        </Stack>
      </Paper>
    </Box>
  );
};

export default PedidoSlugRedirect;
