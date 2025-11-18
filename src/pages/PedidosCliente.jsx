// pages/PedidosCliente.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Container, Paper, Divider, CircularProgress,
  AppBar, Toolbar, List, ListItem, Chip, Button
} from "@mui/material";
import {
  CheckCircleOutline,
  CancelOutlined,
  LocalShipping,
  AccessTime,
  HourglassBottom
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://168.75.78.51/api";


const PedidosCliente = () => {
  const { telefone } = useParams();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!telefone) return;
    localStorage.setItem("telefoneCliente", telefone);

    const fetchPedidos = async () => {
      try {
        const res = await axios.get(`${API_URL}/publico/pedidos/${telefone}`);
        setPedidos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [telefone]);

  const parseValor = (valor) => {
    if (valor == null || valor === "") return 0;
    if (typeof valor === "number") return valor;
    if (typeof valor === "string") {
      const clean = valor.replace(/[^\d,.-]/g, "").replace(",", ".");
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const ativos = pedidos.filter(p => {
    const status = (p.status || "").toLowerCase();
    return !["entregue", "cancelado", "concluido"].includes(status);
  });

  const concluidos = pedidos.filter(p => {
    const status = (p.status || "").toLowerCase();
    return ["entregue", "cancelado", "concluido"].includes(status);
  });

  const renderPedido = (pedido) => {
    const rawStatus = (pedido.status || "").toLowerCase();

    const statusMap = {
      aguardando_pagamento: { label: "Aguardando Pagamento", color: "warning", icon: <HourglassBottom fontSize="small" /> },
      em_producao: { label: "Em Produção", color: "warning", icon: <AccessTime fontSize="small" /> },
      em_entrega: { label: "Em Entrega", color: "primary", icon: <LocalShipping fontSize="small" /> },
      entregue: { label: "Concluído", color: "success", icon: <CheckCircleOutline fontSize="small" /> },
      concluido: { label: "Concluído", color: "success", icon: <CheckCircleOutline fontSize="small" /> },
      cancelado: { label: "Cancelado", color: "error", icon: <CancelOutlined fontSize="small" /> },
      pendente: { label: "Pendente", color: "default", icon: <HourglassBottom fontSize="small" /> },
    };

    const statusInfo = statusMap[rawStatus] || {
      label: rawStatus || "Desconhecido",
      color: "default",
      icon: <HourglassBottom fontSize="small" />
    };

    return (
      <Paper
        key={pedido._id}
        elevation={2}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          borderLeft: `5px solid`,
          borderColor:
            statusInfo.color === "success"
              ? "success.main"
              : statusInfo.color === "error"
                ? "error.main"
                : statusInfo.color === "primary"
                  ? "primary.main"
                  : statusInfo.color === "warning"
                    ? "warning.main"
                    : "grey.400",
          backgroundColor: "#fff"
        }}
      >
        <ListItem
          disablePadding
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Pedido {pedido.numeroPedido || pedido._id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: R$ {parseValor(pedido.valorTotal).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pedido.criadoEm ? new Date(pedido.criadoEm).toLocaleString("pt-BR") : ""}
            </Typography>
          </Box>
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            color={statusInfo.color}
            variant="filled"
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        {Array.isArray(pedido.itens) && pedido.itens.map((item, i) => (
          <Box key={i} sx={{ ml: 1, mb: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              • {item.quantidade}x {item.nome} — R$ {parseValor(item.precoTotal).toFixed(2)}
            </Typography>

            {item.saboresSelecionados?.length > 0 && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                Sabores: {item.saboresSelecionados.join(" / ")}
              </Typography>
            )}

            {item.bordaSelecionada && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                Borda: {item.bordaSelecionada.nome} (+R$ {parseValor(item.bordaSelecionada.preco).toFixed(2)})
              </Typography>
            )}

            {item.adicionalSelecionado && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                Adicional: {item.adicionalSelecionado.nome} (+R$ {parseValor(item.adicionalSelecionado.preco).toFixed(2)})
              </Typography>
            )}

            {item.complementosSelecionados?.length > 0 && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                Complementos:{" "}
                {item.complementosSelecionados.map((c, idx) => (
                  <span key={idx}>
                    {c.nome} (+R$ {parseValor(c.preco).toFixed(2)}){idx < item.complementosSelecionados.length - 1 ? ", " : ""}
                  </span>
                ))}
              </Typography>
            )}

            {item.observacao && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                Observações: {item.observacao}
              </Typography>
            )}
          </Box>
        ))}

      </Paper>
    );
  };

  return (
    <Box>
 <AppBar position="sticky" color="success">
  <Toolbar sx={{ display: "flex", alignItems: "center" }}>
    <Button
      color="inherit"
      onClick={() => navigate("/pedido")}
      sx={{ mr: 2, minWidth: "auto" }}
    >
      ⬅
    </Button>
    <Typography variant="h6" fontWeight="bold">Meus Pedidos</Typography>
  </Toolbar>
</AppBar>

      <Container sx={{ py: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Pedidos Ativos
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : ativos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum pedido ativo encontrado.
          </Typography>
        ) : (
          <List disablePadding>
            {ativos.map(renderPedido)}
          </List>
        )}

        <Divider sx={{ my: 4 }} textAlign="left">
          Pedidos Concluídos
        </Divider>

        {concluidos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum pedido concluído ou cancelado.
          </Typography>
        ) : (
          <List disablePadding>
            {concluidos.map(renderPedido)}
          </List>
        )}

        <Button
          fullWidth
          variant="contained"
          color="success"
          sx={{ mt: 4, py: 1.5 }}
          onClick={() => navigate("/pedido")}
        >
          Fazer Novo Pedido
        </Button>
      </Container>
    </Box>
  );
};

export default PedidosCliente;
