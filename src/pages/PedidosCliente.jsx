import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  CircularProgress,
  AppBar,
  Toolbar,
  Chip,
  Button,
  Stack,
  TextField,
  Avatar,
  Alert,
} from "@mui/material";
import {
  CheckCircleOutline,
  CancelOutlined,
  LocalShipping,
  AccessTime,
  HourglassBottom,
  ArrowBack,
  ReceiptLong,
  Search,
  Storefront,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";

import { API_BASE_URL } from "../config";

const API_URL = API_BASE_URL;

function parseValor(valor) {
  if (valor == null || valor === "") return 0;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === "string") {
    const clean = valor.replace(/[^\d,.-]/g, "");
    const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatBRL(valor) {
  return parseValor(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function getRestauranteAtual() {
  try {
    const raw = JSON.parse(localStorage.getItem("restauranteSelecionado") || "null");
    return raw?.restaurante || raw;
  } catch {
    return null;
  }
}

function getItemTotal(item) {
  const direto = parseValor(item?.precoTotal ?? item?.valorTotal ?? item?.total);
  if (direto > 0) return direto;
  return parseValor(item?.precoUnitario ?? item?.preco ?? item?.valor) * Number(item?.quantidade || 1);
}

const statusMap = {
  aguardando_pagamento: { label: "Aguardando pagamento", color: "warning", icon: <HourglassBottom fontSize="small" /> },
  pendente: { label: "Pendente", color: "warning", icon: <HourglassBottom fontSize="small" /> },
  recebido: { label: "Recebido", color: "info", icon: <ReceiptLong fontSize="small" /> },
  aceito: { label: "Aceito", color: "info", icon: <ReceiptLong fontSize="small" /> },
  em_preparo: { label: "Em preparo", color: "warning", icon: <AccessTime fontSize="small" /> },
  em_producao: { label: "Em produção", color: "warning", icon: <AccessTime fontSize="small" /> },
  pronto: { label: "Pronto", color: "primary", icon: <CheckCircleOutline fontSize="small" /> },
  saiu_para_entrega: { label: "Saiu para entrega", color: "primary", icon: <LocalShipping fontSize="small" /> },
  em_entrega: { label: "Em entrega", color: "primary", icon: <LocalShipping fontSize="small" /> },
  entregue: { label: "Concluído", color: "success", icon: <CheckCircleOutline fontSize="small" /> },
  concluido: { label: "Concluído", color: "success", icon: <CheckCircleOutline fontSize="small" /> },
  cancelado: { label: "Cancelado", color: "error", icon: <CancelOutlined fontSize="small" /> },
};

const finalizados = new Set(["entregue", "cancelado", "concluido"]);

const PedidosCliente = () => {
  const { telefone: telefoneParam } = useParams();
  const navigate = useNavigate();
  const restaurante = getRestauranteAtual();

  const [telefoneBusca, setTelefoneBusca] = useState(onlyDigits(telefoneParam || localStorage.getItem("telefoneCliente") || ""));
  const [telefoneAtivo, setTelefoneAtivo] = useState(onlyDigits(telefoneParam || ""));
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const slug = restaurante?.slugIdentificador || restaurante?.slug || "";
  const voltarLoja = () => navigate(slug ? `/${slug}` : "/p");

  const buscarPedidos = async (telefoneDigitado = telefoneBusca) => {
    const tel = onlyDigits(telefoneDigitado);
    if (tel.length < 8) {
      setErro("Informe o telefone usado no pedido.");
      return;
    }

    setErro("");
    setLoading(true);
    setTelefoneAtivo(tel);
    localStorage.setItem("telefoneCliente", tel);

    try {
      const res = await axios.get(`${API_URL}/publico/pedidos/${tel}`);
      const lista = Array.isArray(res.data) ? res.data : res.data?.pedidos || [];
      setPedidos(lista);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setPedidos([]);
      setErro("Não foi possível carregar seus pedidos agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tel = onlyDigits(telefoneParam || "");
    if (tel) buscarPedidos(tel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefoneParam]);

  const { ativos, concluidos } = useMemo(() => {
    const ativos = [];
    const concluidos = [];
    for (const p of pedidos) {
      const status = String(p.status || "").toLowerCase();
      (finalizados.has(status) ? concluidos : ativos).push(p);
    }
    return { ativos, concluidos };
  }, [pedidos]);

  const renderDetalhesItem = (item) => (
    <Stack spacing={0.25} sx={{ mt: 0.5 }}>
      {item.saboresSelecionados?.length > 0 && (
        <Typography variant="caption" color="text.secondary">Sabores: {item.saboresSelecionados.join(" / ")}</Typography>
      )}
      {item.bordaSelecionada?.nome && (
        <Typography variant="caption" color="text.secondary">Borda: {item.bordaSelecionada.nome} (+{formatBRL(item.bordaSelecionada.preco)})</Typography>
      )}
      {item.adicionalSelecionado?.nome && (
        <Typography variant="caption" color="text.secondary">Adicional: {item.adicionalSelecionado.nome} (+{formatBRL(item.adicionalSelecionado.preco)})</Typography>
      )}
      {item.complementosSelecionados?.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Complementos: {item.complementosSelecionados.map((c) => `${c.nome} (+${formatBRL(c.preco)})`).join(", ")}
        </Typography>
      )}
      {item.observacao && (
        <Typography variant="caption" color="text.secondary">Obs.: {item.observacao}</Typography>
      )}
    </Stack>
  );

  const renderPedido = (pedido) => {
    const rawStatus = String(pedido.status || "").toLowerCase();
    const statusInfo = statusMap[rawStatus] || { label: pedido.status || "Em análise", color: "default", icon: <HourglassBottom fontSize="small" /> };
    const total = parseValor(pedido.valorTotal ?? pedido.total ?? pedido.valor);
    const criadoEm = pedido.criadoEm || pedido.createdAt || pedido.dataCriacao;

    return (
      <Paper
        key={pedido._id || pedido.numeroPedido}
        elevation={0}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: "#fff",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={1000} noWrap>
              Pedido #{pedido.numeroPedido || String(pedido._id || "").slice(-6)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {criadoEm ? new Date(criadoEm).toLocaleString("pt-BR") : "Data indisponível"}
            </Typography>
          </Box>
          <Chip icon={statusInfo.icon} label={statusInfo.label} color={statusInfo.color} sx={{ fontWeight: 800 }} />
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack spacing={1.2}>
          {(pedido.itens || []).map((item, i) => (
            <Box key={i}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Typography variant="body2" fontWeight={900} sx={{ flex: 1 }}>
                  {Number(item.quantidade || 1)}x {item.nome}
                </Typography>
                <Typography variant="body2" fontWeight={1000} color="primary.main">
                  {formatBRL(getItemTotal(item))}
                </Typography>
              </Stack>
              {renderDetalhesItem(item)}
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary" fontWeight={800}>Total do pedido</Typography>
          <Typography variant="h6" color="primary.main" fontWeight={1000}>{formatBRL(total)}</Typography>
        </Stack>
      </Paper>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f7", pb: 4 }}>
      <Helmet>
        <title>{restaurante?.nome ? `${restaurante.nome} - Meus pedidos` : "Meus pedidos - Movyo"}</title>
      </Helmet>

      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#111827" }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Button color="inherit" onClick={voltarLoja} sx={{ minWidth: "auto", borderRadius: 999 }}>
            <ArrowBack />
          </Button>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={1000} noWrap>Meus pedidos</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,.72)" }} noWrap>
              {restaurante?.nome || "Acompanhe seu histórico"}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 2.5 }} maxWidth="sm">
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <Avatar sx={{ bgcolor: "#fff3eb", color: "#ff7a3d" }}>
              <Storefront />
            </Avatar>
            <Box>
              <Typography fontWeight={1000}>Buscar pedidos</Typography>
              <Typography variant="body2" color="text.secondary">Use o telefone informado no checkout.</Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              value={telefoneBusca}
              onChange={(e) => setTelefoneBusca(onlyDigits(e.target.value).slice(0, 13))}
              onKeyDown={(e) => { if (e.key === "Enter") buscarPedidos(); }}
              label="Telefone"
              placeholder="Ex: 81999999999"
              fullWidth
              size="small"
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <Search />}
              onClick={() => buscarPedidos()}
              disabled={loading}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 900 }}
            >
              Buscar
            </Button>
          </Stack>

          {erro && <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>{erro}</Alert>}
        </Paper>

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }} spacing={1}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">Carregando seus pedidos...</Typography>
          </Stack>
        ) : telefoneAtivo && pedidos.length === 0 ? (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, textAlign: "center", border: "1px solid rgba(15,23,42,0.08)" }}>
            <ReceiptLong sx={{ fontSize: 46, color: "text.secondary", mb: 1 }} />
            <Typography fontWeight={1000}>Nenhum pedido encontrado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
              Confira se o telefone é o mesmo usado na compra.
            </Typography>
            <Button variant="outlined" sx={{ mt: 2, borderRadius: 999 }} onClick={voltarLoja}>Voltar para loja</Button>
          </Paper>
        ) : (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
              <Typography variant="h6" fontWeight={1000}>Pedidos ativos</Typography>
              <Chip label={ativos.length} size="small" sx={{ fontWeight: 900 }} />
            </Stack>

            {ativos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Nenhum pedido ativo no momento.</Typography>
            ) : ativos.map(renderPedido)}

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
              <Typography variant="h6" fontWeight={1000}>Histórico</Typography>
              <Chip label={concluidos.length} size="small" sx={{ fontWeight: 900 }} />
            </Stack>

            {concluidos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Nenhum pedido finalizado ainda.</Typography>
            ) : concluidos.map(renderPedido)}
          </>
        )}

        <Button fullWidth variant="contained" sx={{ mt: 3, py: 1.4, borderRadius: 999, fontWeight: 1000 }} onClick={voltarLoja}>
          Fazer novo pedido
        </Button>
      </Container>
    </Box>
  );
};

export default PedidosCliente;
