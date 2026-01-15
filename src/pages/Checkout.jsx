// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Divider,
  CircularProgress,
  AppBar,
  Toolbar,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Snackbar,
  Alert,
  Grid,
  Chip,
  IconButton,
  InputAdornment,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as turf from "@turf/turf";
import { Helmet } from "react-helmet";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PixIcon from "@mui/icons-material/Pix";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const API_URL = import.meta.env.VITE_API_URL || "https://api.movyo.delivery/api";
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ";

// sem pizza 🙏
const DEFAULT_IMAGE_URL = "";

// ✅ ajuste aqui se sua rota pública de status for diferente
const PIX_STATUS_PATH = "/publico/pix/status";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const money = (v) => {
  const num = Number(v || 0);
  return num.toFixed(2);
};

const Checkout = () => {
  const navigate = useNavigate();

  // DADOS DO CLIENTE
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");

  // ENDEREÇOS
  const [enderecosCliente, setEnderecosCliente] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(-1);
  const [endereco, setEndereco] = useState({
    apelido: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    complemento: "",
  });

  // CONTROLES
  const [carregando, setCarregando] = useState(false);
  const [clienteCarregado, setClienteCarregado] = useState(false);
  const [frete, setFrete] = useState(0);
  const [coordenadasCliente, setCoordenadasCliente] = useState(null);

  // PIX
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeTexto, setQrCodeTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [pixStatus, setPixStatus] = useState(null);
  const [verificandoPix, setVerificandoPix] = useState(false);

  // Pedido
  const [resumoPedido, setResumoPedido] = useState({
    itens: [],
    total: 0,
    frete: 0,
    _id: null,
  });

  const [formaPagamento, setFormaPagamento] = useState("Pix");

  // RESUMO PRÉ-PAGAMENTO (CARRINHO)
  const [itensPreview, setItensPreview] = useState([]);
  const [subtotalPreview, setSubtotalPreview] = useState(0);

  // UI
  const [pixCodeOpen, setPixCodeOpen] = useState(false);
  const [resumoOpen, setResumoOpen] = useState(true);
  const [confirmEditarPix, setConfirmEditarPix] = useState(false);

  // ERROS / FEEDBACK
  const [cepErro, setCepErro] = useState(false);
  const [cepHelper, setCepHelper] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // ✅ normaliza restaurante do localStorage
  const restauranteRaw = JSON.parse(localStorage.getItem("restauranteSelecionado") || "null");
  const restaurante = restauranteRaw?.restaurante ?? restauranteRaw;

  // polling PIX
  const pollRef = useRef(null);

  const toast = (severity, message) => setSnackbar({ open: true, severity, message });

  const limparPollingPix = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => limparPollingPix();
  }, []);

  // ========= HELPERS =========

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (match, ddd, p1, p2) => {
        if (!ddd) return numeros;
        if (!p1) return `(${ddd}`;
        if (!p2) return `(${ddd}) ${p1}`;
        return `(${ddd}) ${p1}-${p2}`;
      });
    }
    return numeros.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (match, ddd, p1, p2) => {
      if (!ddd) return numeros;
      if (!p1) return `(${ddd}`;
      if (!p2) return `(${ddd}) ${p1}`;
      return `(${ddd}) ${p1}-${p2}`;
    });
  };

  const formatarCEP = (valor) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
  };

  const calcularValorItem = (item) => {
    let total = (item.precoUnitario || 0) * (item.quantidade || 1);

    if (item.bordaSelecionada) total += parseFloat(item.bordaSelecionada.preco || 0) * (item.quantidade || 1);
    if (item.adicionalSelecionado) total += parseFloat(item.adicionalSelecionado.preco || 0) * (item.quantidade || 1);

    if (Array.isArray(item.complementosSelecionados)) {
      item.complementosSelecionados.forEach((c) => {
        total += parseFloat(c.preco || 0) * (item.quantidade || 1);
      });
    }

    if (item.tiposExtrasSelecionados) {
      Object.values(item.tiposExtrasSelecionados).forEach((itens) => {
        itens.forEach((extra) => {
          total += parseFloat(extra?.preco || 0) * (item.quantidade || 1);
        });
      });
    }

    return total;
  };

  const telLimpo = useMemo(() => telefone.replace(/\D/g, ""), [telefone]);

  // ========= CARRINHO + RESTAURA PIX PENDENTE =========

  useEffect(() => {
    const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");
    setItensPreview(carrinho);

    const subtotal = carrinho.reduce((acc, item) => acc + calcularValorItem(item), 0);
    setSubtotalPreview(subtotal);

    // ✅ restaura PIX pendente (se existir)
    try {
      const pend = JSON.parse(localStorage.getItem("pix_pendente") || "null");
      if (pend?._id && (pend?.qrCodeTexto || pend?.qrCodeUrl)) {
        setResumoPedido((prev) => ({
          ...prev,
          _id: pend._id,
          total: pend.total || 0,
          frete: pend.frete || 0,
        }));
        setQrCodeTexto(pend.qrCodeTexto || "");
        setQrCodeUrl(pend.qrCodeUrl || "");
        setPixStatus(pend.pixStatus || "pending");
        setFormaPagamento("Pix");
      }
    } catch { }
  }, []);

  // ========= REGRA: TRAVAR FORMULÁRIO SÓ QUANDO PIX GERADO E PENDENTE =========

  const isPix = (formaPagamento || "").toLowerCase() === "pix";
  const pixPendente = Boolean(resumoPedido?._id) && isPix && Boolean(qrCodeTexto || qrCodeUrl);
  const travarFormulario = pixPendente;

  // ========= BUSCAR CLIENTE =========

  const buscarCliente = async () => {
    const t = telLimpo;
    if (t.length < 10) return;

    try {
      const res = await axios.get(`${API_URL}/clientes/${t}`);
      if (res.data) {
        setNome(res.data.nome || "");
        const ends = res.data.enderecos || [];
        setEnderecosCliente(ends);

        if (ends.length > 0) {
          setEnderecoSelecionado(0);
          setEndereco(ends[0]);
        }
      } else {
        setEnderecosCliente([]);
      }
      setClienteCarregado(true);
    } catch {
      setEnderecosCliente([]);
      setClienteCarregado(true);
    }
  };

  // ========= CEP =========

  const buscarEnderecoPorCep = async (cepNumerico) => {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
      const data = await res.json();
      if (data.erro) return null;
      return {
        rua: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      };
    } catch {
      return null;
    }
  };

  // ========= GEOCODIFICA =========

  const geocodificarEndereco = async () => {
    const fullAddress = `${endereco.rua} ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}, ${endereco.cep}, Brazil`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      fullAddress
    )}.json?access_token=${MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data?.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      setCoordenadasCliente({ lng, lat });
      return [lng, lat];
    }
    throw new Error("Endereço não localizado");
  };

  // ========= FRETE =========

  const calcularFrete = async (lng, lat) => {
    try {
      const res = await axios.get(`${API_URL}/frete/dados/${restaurante._id}`);
      const { areas = [], faixasRaio = [], localizacaoRestaurante } = res.data;

      const pontoCliente = turf.point([lng, lat]);

      // 1) Áreas
      if (Array.isArray(areas) && areas.length > 0) {
        for (const area of areas) {
          if (!area?.coordenadas) continue;
          const poligono = turf.polygon(area.coordenadas);
          if (turf.booleanPointInPolygon(pontoCliente, poligono)) {
            return area.valor || 0;
          }
        }
      }

      // 2) Raio
      if (
        localizacaoRestaurante &&
        typeof localizacaoRestaurante.longitude === "number" &&
        typeof localizacaoRestaurante.latitude === "number" &&
        Array.isArray(faixasRaio) &&
        faixasRaio.length > 0
      ) {
        const pontoRestaurante = turf.point([
          localizacaoRestaurante.longitude,
          localizacaoRestaurante.latitude,
        ]);
        const distanciaKm = turf.distance(pontoRestaurante, pontoCliente);
        const faixa = faixasRaio.find((f) => distanciaKm <= f.ate);
        return faixa ? faixa.valor || 0 : 0;
      }

      return 0;
    } catch {
      return 0;
    }
  };

  // frete automático
  useEffect(() => {
    const calcularFreteEndereco = async () => {
      if (!restaurante?._id) return;
      if (!endereco.rua || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.estado) return;

      try {
        const [lng, lat] = await geocodificarEndereco();
        const valorFrete = await calcularFrete(lng, lat);
        setFrete(valorFrete);
      } catch {
        setFrete(0);
      }
    };

    // não recalcula frete enquanto Pix pendente (evita “piscar” resumo)
    if (!pixPendente) calcularFreteEndereco();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado, restaurante?._id]);

  // ========= ENDEREÇO =========

  const handleEnderecoChange = (index) => {
    setEnderecoSelecionado(index);
    setEndereco(enderecosCliente[index]);
    setFrete(0);
    setCoordenadasCliente(null);
  };

  const adicionarEnderecoNovo = () => {
    setEnderecoSelecionado(-1);
    setEndereco({
      apelido: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      complemento: "",
    });
    setFrete(0);
    setCoordenadasCliente(null);
  };

  // ========= PIX =========

  const consultarStatusPix = async (pedidoId) => {
    const { data } = await axios.get(`${API_URL}${PIX_STATUS_PATH}/${pedidoId}`);
    return data;
  };

  const iniciarPollingPix = (pedidoId) => {
    limparPollingPix();
    const startedAt = Date.now();

    pollRef.current = setInterval(async () => {
      try {
        setVerificandoPix(true);
        const st = await consultarStatusPix(pedidoId);
        const status = st?.status || st?.payment_status || st?.statusPagamento || null;
        if (status) setPixStatus(status);

        if (status === "approved" || status === "pago" || status === "paid") {
          limparPollingPix();
          setVerificandoPix(false);

          localStorage.removeItem("carrinho");
          localStorage.removeItem("pix_pendente");

          toast("success", "Pagamento aprovado! ✅ Redirecionando...");
          setTimeout(() => navigate(`/meus-pedidos/${telLimpo}`), 650);
          return;
        }

        // timeout suave
        if (Date.now() - startedAt > 5 * 60 * 1000) {
          limparPollingPix();
          setVerificandoPix(false);
        }
      } catch {
        setVerificandoPix(false);
      }
    }, 2500);
  };

  const resetarPixParaEditar = () => {
    limparPollingPix();
    localStorage.removeItem("pix_pendente");
    setResumoPedido({ itens: [], total: 0, frete: 0, _id: null });
    setQrCodeTexto("");
    setQrCodeUrl("");
    setPixStatus(null);
    setVerificandoPix(false);
    toast("info", "Você pode editar os dados e gerar um novo Pix.");
  };

  // ========= FINALIZAR =========

  const finalizarPedido = async () => {
    const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");

    if (!restaurante?._id) {
      toast("error", "Restaurante não identificado. Volte para a vitrine.");
      return;
    }

    if (telLimpo.length < 10 || !nome?.trim() || !endereco.rua?.trim() || carrinho.length === 0) {
      toast("warning", "Preencha telefone, nome, endereço de entrega e tenha itens no carrinho.");
      return;
    }

    setCarregando(true);
    try {
      const valorProdutos = carrinho.reduce((acc, item) => acc + calcularValorItem(item), 0);

      const [lng, lat] = await geocodificarEndereco();
      const valorFrete = await calcularFrete(lng, lat);
      const valorTotal = valorProdutos + valorFrete;

      setFrete(valorFrete);

      const carrinhoFormatado = carrinho.map((item) => ({
        ...item,
        amount: Math.round((calcularValorItem(item) || 0) * 100),
        description: item.nome,
        quantity: item.quantidade,
      }));

      const freteItem = {
        nome: "Entrega",
        quantidade: 1,
        precoUnitario: valorFrete,
        precoTotal: valorFrete,
        amount: Math.round(valorFrete * 100),
        description: "Entrega",
        quantity: 1,
      };

      const carrinhoComFrete = [...carrinhoFormatado, freteItem];

      const resp = await axios.post(`${API_URL}/pedidos/`, {
        itens: carrinhoComFrete,
        telefoneCliente: telLimpo,
        nomeCliente: nome,
        enderecoCliente: `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}`,
        residenciaNumero: endereco.numero,
        residenciaComplemento: endereco.complemento || "",
        residenciaReferencia: "",
        residenciaBairro: endereco.bairro,
        residenciaCep: endereco.cep,
        latitudeCliente: lat,
        longitudeCliente: lng,
        valorTotal,
        restaurante: restaurante._id,
        formadePagamento: formaPagamento,
        origem: "vitrine",
        valorFrete,
      });

      // PIX
      if ((formaPagamento || "").toLowerCase() === "pix") {
        const pedidoId = resp.data?.pedidoId || resp.data?._id || null;

        const qrText = resp.data?.pix_qr_code || resp.data?.qr_code || "";
        const qrBase64 =
          resp.data?.pix_qr_code_base64 || // ✅ nome do seu backend
          resp.data?.qr_code_base64 ||
          resp.data?.pix_qr_code_url ||
          resp.data?.qr_code_url ||
          "";

        if (!pedidoId) {
          toast("error", "Pedido criado, mas não recebi o ID do pedido no retorno.");
          return;
        }
        if (!qrText && !qrBase64) {
          toast("error", "Pedido criado, mas não recebi o QR Code Pix.");
          return;
        }

        setResumoPedido({
          itens: carrinhoComFrete,
          total: valorTotal,
          frete: valorFrete,
          _id: pedidoId,
        });

        setQrCodeTexto(qrText);
        setQrCodeUrl(qrBase64);
        setPixStatus("pending");

        localStorage.setItem(
          "pix_pendente",
          JSON.stringify({
            _id: pedidoId,
            total: valorTotal,
            frete: valorFrete,
            qrCodeTexto: qrText,
            qrCodeUrl: qrBase64,
            pixStatus: "pending",
          })
        );

        // UX: abre “detalhes do código” fechado por padrão (mais limpo)
        setResumoOpen(true);
        setPixCodeOpen(true);
        toast("info", "Pix gerado! Vamos te levar até o pagamento.");

        // força o scroll (além do useEffect)
        setTimeout(() => {
          scrollToPix();
        }, 250);

        iniciarPollingPix(pedidoId);
        return;

      }

      // outros
      localStorage.removeItem("carrinho");
      toast("success", "Pedido realizado com sucesso!");
      navigate(`/meus-pedidos/${telLimpo}`);
    } catch (err) {
      console.error("Erro backend:", err?.response?.data || err);
      toast("error", "Erro ao finalizar pedido.");
    } finally {
      setCarregando(false);
    }
  };

  // ========= COPIAR =========

  const copiarPix = async () => {
    try {
      if (!qrCodeTexto) return;
      await navigator.clipboard.writeText(qrCodeTexto);
      setCopiado(true);
    } catch {
      toast("error", "Não consegui copiar o código Pix.");
    }
  };

  const verificarPagamentoAgora = async () => {
    if (!resumoPedido?._id) return;
    try {
      setVerificandoPix(true);
      const st = await consultarStatusPix(resumoPedido._id);
      const status = st?.status || st?.payment_status || st?.statusPagamento || null;
      if (status) setPixStatus(status);

      if (status === "approved" || status === "pago" || status === "paid") {
        limparPollingPix();
        setVerificandoPix(false);

        localStorage.removeItem("carrinho");
        localStorage.removeItem("pix_pendente");

        toast("success", "Pagamento aprovado! ✅ Redirecionando...");
        setTimeout(() => navigate(`/meus-pedidos/${telLimpo}`), 650);
      } else {
        toast("info", "Ainda não identificou como pago. Se você já pagou, aguarde alguns segundos e tente novamente.");
      }
    } catch {
      toast("error", "Falha ao consultar status do Pix.");
    } finally {
      setVerificandoPix(false);
    }
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const totalPreview = subtotalPreview + frete;

  const chipPix = useMemo(() => {
    const s = String(pixStatus || "").toLowerCase();
    if (!s) return null;

    if (s === "approved" || s === "paid" || s === "pago") return { label: "Pago ✅", color: "success" };
    if (s === "pending" || s === "in_process" || s === "authorized") return { label: "Aguardando", color: "warning" };
    if (s === "rejected" || s === "cancelled" || s === "canceled") return { label: "Não aprovado", color: "error" };

    return { label: `Status: ${pixStatus}`, color: "default" };
  }, [pixStatus]);

  const chipIcon = useMemo(() => {
    if (!chipPix) return undefined;
    if (chipPix.color === "success") return <CheckCircleIcon />;
    if (chipPix.color === "warning") return <HourglassBottomIcon />;
    if (chipPix.color === "error") return <ErrorOutlineIcon />;
    return undefined;
  }, [chipPix]);

  // itens do resumo: compactar (máx 6 linhas + “ver mais”)
  const resumoItens = useMemo(() => {
    const base = itensPreview || [];
    return base.map((it) => ({
      key: `${it?.produtoId || it?._id || it?.nome || "item"}-${Math.random()}`,
      nome: it?.nome || "Item",
      qtd: Number(it?.quantidade || 1),
      total: calcularValorItem(it),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensPreview]);

  const maxResumo = 6;
  const resumoMostrado = resumoOpen ? resumoItens : resumoItens.slice(0, maxResumo);
  const temMaisResumo = resumoItens.length > maxResumo;

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" sx={{ backgroundColor: "#f5f5f7" }}>
      <Helmet>{restaurante ? <title>{restaurante.nome} - Checkout</title> : <title>Checkout</title>}</Helmet>

      {/* APPBAR */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background: "linear-gradient(90deg, #ff4b8b 0%, #ff7a3d 45%, #ffb347 100%)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={2} minWidth={0}>
            <Avatar src={restaurante?.logoUrl || DEFAULT_IMAGE_URL} sx={{ width: 34, height: 34 }}>
              {!restaurante?.logoUrl && restaurante?.nome ? restaurante.nome[0].toUpperCase() : null}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="subtitle1" fontWeight="bold" noWrap>
                {restaurante?.nome || "Restaurante"}
              </Typography>
              {restaurante && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }} noWrap>
                  {restaurante.enderecoBairro} • {restaurante.enderecoCidade || ""}
                </Typography>
              )}
            </Box>
          </Box>

          <Button color="inherit" onClick={() => navigate("/carrinho")} sx={{ textTransform: "none" }}>
            Voltar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2.5, flex: 1 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Finalizar Pedido
        </Typography>

        {/* ✅ PIX TOP CARD (compacto) */}
        {resumoPedido._id && isPix && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 3,
              border: "1px solid #eee",
              background: "linear-gradient(180deg, rgba(255,75,139,0.10) 0%, rgba(255,179,71,0.12) 100%)",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Stack spacing={0.25} minWidth={0}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <QrCode2Icon fontSize="small" />
                  <Typography fontWeight={900} noWrap>
                    Pix do pedido
                  </Typography>
                  {chipPix && (
                    <Chip
                      label={chipPix.label}
                      color={chipPix.color}
                      variant="filled"
                      size="small"
                      sx={{ fontWeight: 900 }}
                      icon={chipIcon}
                    />
                  )}
                  {verificandoPix && <CircularProgress size={16} />}
                </Stack>

                <Typography variant="caption" color="text.secondary" noWrap>
                  Pedido <b>{resumoPedido._id}</b> • Total <b>R$ {money(resumoPedido.total || totalPreview)}</b>
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={verificarPagamentoAgora}
                  disabled={verificandoPix}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 2,
                    background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                    "&:hover": { opacity: 0.95, background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)" },
                  }}
                >
                  {verificandoPix ? <CircularProgress size={18} /> : "Verificar"}
                </Button>

                <Tooltip title="Copiar código Pix">
                  <span>
                    <IconButton
                      onClick={copiarPix}
                      disabled={!qrCodeTexto}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.65)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.85)" },
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title={pixCodeOpen ? "Ocultar QR / código" : "Mostrar QR / código"}>
                  <IconButton
                    size="small"
                    onClick={() => setPixCodeOpen((v) => !v)}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.65)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.85)" },
                    }}
                  >
                    {pixCodeOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Collapse in={pixCodeOpen} timeout={250}>
              <Divider sx={{ my: 1.2 }} />

              <Grid container spacing={1.2} alignItems="stretch">
                <Grid item xs={12} sm={5}>
                  <Paper
                    variant="outlined"
                    sx={{
                      height: "100%",
                      p: 1.2,
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                      borderColor: "rgba(255,122,61,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 160,
                    }}
                  >
                    {qrCodeUrl ? (
                      <img
                        src={`data:image/png;base64,${qrCodeUrl}`}
                        alt="QR Code Pix"
                        style={{ width: "100%", maxWidth: 160, height: "auto", objectFit: "contain", display: "block" }}
                      />
                    ) : (
                      <Box textAlign="center">
                        <Typography variant="subtitle2" fontWeight={900}>
                          QR indisponível
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Use o botão de copiar.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={7}>
                  <Paper
                    variant="outlined"
                    sx={{
                      height: "100%",
                      p: 1.2,
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                      borderColor: "rgba(255,122,61,0.25)",
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Typography variant="subtitle2" fontWeight={900}>
                        Código Pix
                      </Typography>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={copiarPix}
                        disabled={!qrCodeTexto}
                        startIcon={<ContentCopyIcon fontSize="small" />}
                        sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                      >
                        Copiar
                      </Button>
                    </Stack>

                    {/* Mostra só um “preview” compacto; detalhes ficam no Dialog */}
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        bgcolor: "#fafafa",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: 12,
                        lineHeight: 1.4,
                        maxHeight: 86,
                        overflow: "hidden",
                        wordBreak: "break-all",
                      }}
                    >
                      {qrCodeTexto || "—"}
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setPixCodeOpen(true)}
                        sx={{ textTransform: "none", fontWeight: 800, opacity: 0.85 }}
                        disabled
                      >
                        {/* placeholder (mantém layout bonito) */}
                      </Button>

                      <Button
                        size="small"
                        onClick={() => setConfirmEditarPix(true)}
                        startIcon={<EditIcon fontSize="small" />}
                        sx={{ textTransform: "none", fontWeight: 900 }}
                      >
                        Editar dados / gerar novo Pix
                      </Button>
                    </Stack>

                    <Alert
                      severity="info"
                      sx={{
                        mt: 1,
                        py: 0.5,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.75)",
                      }}
                    >
                      Confirmou? Se o status não atualizar, toque em <b>Verificar</b>.
                    </Alert>
                  </Paper>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        )}

        <Paper
          sx={{
            p: 2.2,
            borderRadius: 3,
            boxShadow: "0px 2px 8px rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* DADOS DO CLIENTE */}
          <TextField
            label="Telefone"
            fullWidth
            margin="normal"
            value={telefone}
            onChange={(e) => {
              setTelefone(formatarTelefone(e.target.value));
              setClienteCarregado(false);
            }}
            onBlur={buscarCliente}
            disabled={travarFormulario}
          />
          <TextField
            label="Nome"
            fullWidth
            margin="normal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={travarFormulario}
          />

          <Divider sx={{ my: 2 }} />

          {/* ENDEREÇOS SALVOS */}
          {enderecosCliente.length > 0 && (
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl fullWidth margin="normal" disabled={travarFormulario}>
                <InputLabel id="endereco-select-label">Selecionar Endereço</InputLabel>
                <Select
                  labelId="endereco-select-label"
                  value={enderecoSelecionado}
                  label="Selecionar Endereço"
                  onChange={(e) => handleEnderecoChange(e.target.value)}
                >
                  {enderecosCliente.map((end, index) => (
                    <MenuItem key={index} value={index}>
                      {end.apelido || `${end.rua}, ${end.numero} - ${end.bairro}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                onClick={adicionarEnderecoNovo}
                variant="outlined"
                sx={{ mt: 2, whiteSpace: "nowrap", textTransform: "none" }}
                disabled={travarFormulario}
              >
                + Novo
              </Button>
            </Stack>
          )}

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
            Endereço de Entrega
          </Typography>

          <TextField
            label="Apelido"
            fullWidth
            margin="dense"
            value={endereco.apelido || ""}
            onChange={(e) => setEndereco({ ...endereco, apelido: e.target.value })}
            disabled={travarFormulario}
          />

          <TextField
            label="CEP"
            fullWidth
            margin="dense"
            value={endereco.cep || ""}
            error={cepErro}
            helperText={cepHelper}
            disabled={travarFormulario}
            onChange={async (e) => {
              const cepMascarado = formatarCEP(e.target.value);
              const cepNumerico = cepMascarado.replace(/\D/g, "");
              setEndereco((prev) => ({ ...prev, cep: cepMascarado }));
              setCepErro(false);
              setCepHelper("");

              if (cepNumerico.length === 8) {
                const resultado = await buscarEnderecoPorCep(cepNumerico);
                if (resultado) {
                  setEndereco((prev) => ({ ...prev, ...resultado, cep: cepMascarado }));
                } else {
                  setCepErro(true);
                  setCepHelper("CEP inválido ou não encontrado.");
                }
              }
            }}
          />

          <TextField
            label="Rua"
            fullWidth
            margin="dense"
            value={endereco.rua || ""}
            onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })}
            disabled={travarFormulario}
          />
          <TextField
            label="Número"
            fullWidth
            margin="dense"
            value={endereco.numero || ""}
            onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
            disabled={travarFormulario}
          />
          <TextField
            label="Complemento"
            fullWidth
            margin="dense"
            value={endereco.complemento || ""}
            onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
            disabled={travarFormulario}
          />
          <TextField
            label="Bairro"
            fullWidth
            margin="dense"
            value={endereco.bairro || ""}
            onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
            disabled={travarFormulario}
          />
          <TextField
            label="Cidade"
            fullWidth
            margin="dense"
            value={endereco.cidade || ""}
            onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
            disabled={travarFormulario}
          />
          <TextField
            label="Estado"
            fullWidth
            margin="dense"
            value={endereco.estado || ""}
            onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
            disabled={travarFormulario}
          />

          <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 600 }}>
            Frete estimado: R$ {money(frete)}
          </Typography>

          {/* ✅ RESUMO (compacto, não gigante) */}
          {itensPreview.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 1.4,
                bgcolor: "#fafafa",
                borderRadius: 2.5,
                border: "1px solid #e9e9e9",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <ReceiptLongIcon fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={900}>
                    Resumo
                  </Typography>
                </Stack>

                {temMaisResumo && (
                  <Button
                    size="small"
                    onClick={() => setResumoOpen((v) => !v)}
                    startIcon={resumoOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ textTransform: "none", fontWeight: 900 }}
                  >
                    {resumoOpen ? "Menos" : "Mais"}
                  </Button>
                )}
              </Stack>

              <List dense sx={{ py: 0.5 }}>
                {resumoMostrado.map((it, idx) => (
                  <ListItem key={`${it.key}-${idx}`} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                          <Typography variant="body2" fontWeight={800} noWrap sx={{ maxWidth: "70%" }}>
                            {it.qtd}x {it.nome}
                          </Typography>
                          <Typography variant="body2" fontWeight={900}>
                            R$ {money(it.total)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}

                {!resumoOpen && temMaisResumo && (
                  <ListItem disableGutters sx={{ py: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      + {resumoItens.length - maxResumo} itens…
                    </Typography>
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 1 }} />

              <Stack spacing={0.4}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2" fontWeight={800}>
                    R$ {money(subtotalPreview)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Frete
                  </Typography>
                  <Typography variant="body2" fontWeight={800}>
                    R$ {money(frete)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.4 }}>
                  <Typography variant="body1" fontWeight={900}>
                    Total
                  </Typography>
                  <Typography variant="body1" fontWeight={900}>
                    R$ {money(totalPreview)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* PAGAMENTO (só aparece antes de gerar Pix) */}
          {!resumoPedido._id && (
            <Box mt={3}>
              <Grid container spacing={2} alignItems="flex-start" justifyContent="space-between">
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Forma de Pagamento
                  </Typography>

                  <RadioGroup value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                    <FormControlLabel
                      value="Pix"
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <PixIcon color={formaPagamento === "Pix" ? "primary" : "action"} />
                          <Typography>Pix</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="CartaoCredito"
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <CreditCardIcon color={formaPagamento === "CartaoCredito" ? "primary" : "action"} />
                          <Typography>Cartão de Crédito</Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display="flex" justifyContent="flex-end" gap={2} mt={{ xs: 1, md: 4 }}>
                    <Button variant="outlined" onClick={() => navigate("/carrinho")} sx={{ textTransform: "none" }}>
                      Voltar
                    </Button>

                    <Button
                      variant="contained"
                      onClick={finalizarPedido}
                      disabled={carregando}
                      sx={{
                        textTransform: "none",
                        fontWeight: 900,
                        borderRadius: 2,
                        background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                        "&:hover": {
                          opacity: 0.95,
                          background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                        },
                      }}
                    >
                      {carregando ? <CircularProgress size={22} /> : "Finalizar pedido"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Se Pix pendente: dica compacta (sem gigantismo) */}
          {pixPendente && (
            <Alert
              severity="info"
              sx={{
                mt: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
            >
              Pagamento Pix pendente. Você pode copiar o código e pagar no app do banco.
              {` `}
              Quando pagar, o status atualiza automaticamente — ou toque em <b>Verificar</b>.
            </Alert>
          )}
        </Paper>
      </Container>

      {/* CONFIRMAR: EDITAR DADOS / NOVO PIX */}
      <Dialog open={confirmEditarPix} onClose={() => setConfirmEditarPix(false)}>
        <DialogTitle>Editar dados?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Isso vai remover o Pix pendente do navegador e destravar os campos para você editar.
            O pedido já criado no backend continuará existindo (se quiser, você pode cancelá-lo no painel).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEditarPix(false)} sx={{ textTransform: "none" }}>
            Voltar
          </Button>
          <Button
            onClick={() => {
              setConfirmEditarPix(false);
              resetarPixParaEditar();
            }}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
              "&:hover": { opacity: 0.95, background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)" },
            }}
          >
            Destravar e editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR PIX COPIADO */}
      <Snackbar
        open={copiado}
        autoHideDuration={1800}
        onClose={() => setCopiado(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setCopiado(false)} severity="success" sx={{ width: "100%" }}>
          Código Pix copiado!
        </Alert>
      </Snackbar>

      {/* SNACKBAR GERAL */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Checkout;
