import React, { useEffect, useRef, useState } from "react";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000/api";
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ";

// sem pizza 🙏
const DEFAULT_IMAGE_URL = "";

// ✅ ajuste aqui se sua rota pública de status for diferente
// Ex.: "/publico/pix/status/:pedidoId" (ficará: `${API_URL}${PIX_STATUS_PATH}/${id}`)
const PIX_STATUS_PATH = "/publico/pix/status";

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

  // ERROS / FEEDBACK
  const [cepErro, setCepErro] = useState(false);
  const [cepHelper, setCepHelper] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const restaurante = JSON.parse(localStorage.getItem("restauranteSelecionado"));

  // polling PIX
  const pollRef = useRef(null);

  const toast = (severity, message) => {
    setSnackbar({ open: true, severity, message });
  };

  const limparPollingPix = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => limparPollingPix();
  }, []);

  // ========= HELPERS DE MÁSCARA =========

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length <= 10) {
      // fixo
      return numeros.replace(
        /(\d{0,2})(\d{0,4})(\d{0,4})/,
        (match, ddd, p1, p2) => {
          if (!ddd) return numeros;
          if (!p1) return `(${ddd}`;
          if (!p2) return `(${ddd}) ${p1}`;
          return `(${ddd}) ${p1}-${p2}`;
        }
      );
    } else {
      // celular
      return numeros.replace(
        /(\d{0,2})(\d{0,5})(\d{0,4})/,
        (match, ddd, p1, p2) => {
          if (!ddd) return numeros;
          if (!p1) return `(${ddd}`;
          if (!p2) return `(${ddd}) ${p1}`;
          return `(${ddd}) ${p1}-${p2}`;
        }
      );
    }
  };

  const formatarCEP = (valor) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
  };

  // ========= CÁLCULO DE VALOR DO ITEM =========

  const calcularValorItem = (item) => {
    let total = (item.precoUnitario || 0) * item.quantidade;

    if (item.bordaSelecionada) {
      total += parseFloat(item.bordaSelecionada.preco || 0) * item.quantidade;
    }

    if (item.adicionalSelecionado) {
      total += parseFloat(item.adicionalSelecionado.preco || 0) * item.quantidade;
    }

    if (Array.isArray(item.complementosSelecionados)) {
      item.complementosSelecionados.forEach((c) => {
        total += parseFloat(c.preco || 0) * item.quantidade;
      });
    }

    if (item.tiposExtrasSelecionados) {
      Object.values(item.tiposExtrasSelecionados).forEach((itens) => {
        itens.forEach((extra) => {
          total += parseFloat(extra?.preco || 0) * item.quantidade;
        });
      });
    }

    return total;
  };

  // ========= CARREGA CARRINHO PARA RESUMO PRÉ-PAGAMENTO =========

  useEffect(() => {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    setItensPreview(carrinho);

    const subtotal = carrinho.reduce((acc, item) => acc + calcularValorItem(item), 0);
    setSubtotalPreview(subtotal);

    // ✅ se existe pedido PIX pendente salvo, tenta restaurar (opcional mas útil)
    try {
      const pend = JSON.parse(localStorage.getItem("pix_pendente") || "null");
      if (pend?._id && pend?.qrCodeTexto) {
        setResumoPedido((prev) => ({ ...prev, _id: pend._id, total: pend.total || 0, frete: pend.frete || 0 }));
        setQrCodeTexto(pend.qrCodeTexto);
        setQrCodeUrl(pend.qrCodeUrl || "");
        setPixStatus(pend.pixStatus || "pending");
      }
    } catch {}
  }, []);

  // ========= BUSCAR CLIENTE PELO TELEFONE =========

  const buscarCliente = async () => {
    const telLimpo = telefone.replace(/\D/g, "");
    if (telLimpo.length < 10) return;

    try {
      const res = await axios.get(`${API_URL}/clientes/${telLimpo}`);
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
    } catch (err) {
      console.log("Cliente não encontrado.");
      setEnderecosCliente([]);
      setClienteCarregado(true);
    }
  };

  // ========= BUSCAR ENDEREÇO POR CEP =========

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
    } catch (err) {
      console.error("Erro ao buscar endereço por CEP:", err);
      return null;
    }
  };

  // ========= GEOCODIFICA ENDEREÇO (MAPBOX) =========

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

  // ========= CÁLCULO DE FRETE (ÁREA > RAIO) =========

  const calcularFrete = async (lng, lat) => {
    try {
      const res = await axios.get(`${API_URL}/frete/dados/${restaurante._id}`);
      const { areas = [], faixasRaio = [], localizacaoRestaurante } = res.data;

      const pontoCliente = turf.point([lng, lat]);

      // 1) Se cair em alguma ÁREA, usa o valor da área
      if (Array.isArray(areas) && areas.length > 0) {
        for (const area of areas) {
          if (!area?.coordenadas) continue;
          const poligono = turf.polygon(area.coordenadas);
          if (turf.booleanPointInPolygon(pontoCliente, poligono)) {
            return area.valor || 0;
          }
        }
      }

      // 2) Se não tiver área ou não cair em nenhuma, usa RAIO
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
    } catch (err) {
      console.error("Erro ao calcular frete:", err);
      return 0;
    }
  };

  // ========= FRETE AUTOMÁTICO QUANDO ENDEREÇO MUDA =========

  useEffect(() => {
    const calcularFreteEndereco = async () => {
      if (
        !restaurante ||
        !endereco.rua ||
        !endereco.numero ||
        !endereco.bairro ||
        !endereco.cidade ||
        !endereco.estado
      ) {
        return;
      }

      try {
        const [lng, lat] = await geocodificarEndereco();
        const valorFrete = await calcularFrete(lng, lat);
        setFrete(valorFrete);
      } catch (err) {
        console.error("Erro ao calcular frete automático:", err);
        setFrete(0);
      }
    };

    calcularFreteEndereco();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado]);

  // ========= TROCA / NOVO ENDEREÇO =========

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

  // ========= PIX: STATUS =========

  const consultarStatusPix = async (pedidoId) => {
    const { data } = await axios.get(`${API_URL}${PIX_STATUS_PATH}/${pedidoId}`);
    // backend exemplo: { ok: true, status, ... }
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

        // ✅ pagou
        if (status === "approved" || status === "pago" || status === "paid") {
          limparPollingPix();
          setVerificandoPix(false);

          // ✅ agora sim limpa carrinho e pendência
          localStorage.removeItem("carrinho");
          localStorage.removeItem("pix_pendente");

          toast("success", "Pagamento aprovado! ✅ Redirecionando...");
          setTimeout(() => {
            const telLimpo = telefone.replace(/\D/g, "");
            navigate(`/meus-pedidos?telefone=${telLimpo}`);
          }, 650);
          return;
        }

        // timeout suave
        if (Date.now() - startedAt > 5 * 60 * 1000) {
          limparPollingPix();
          setVerificandoPix(false);
          toast("info", "Se já pagou, clique em 'Verificar pagamento'.");
        }
      } catch (e) {
        // falha temporária ok
        setVerificandoPix(false);
      }
    }, 2500);
  };

  // ========= FINALIZAR PEDIDO =========

  const finalizarPedido = async () => {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const telLimpo = telefone.replace(/\D/g, "");

    if (!telLimpo || !nome || !endereco.rua || carrinho.length === 0) {
      toast("warning", "Preencha telefone, nome, endereço de entrega e tenha itens no carrinho.");
      return;
    }

    setCarregando(true);
    try {
      // monta array de endereços para salvar (mantém antigos!)
      let enderecosParaSalvar = [...enderecosCliente];
      if (enderecoSelecionado >= 0) {
        enderecosParaSalvar[enderecoSelecionado] = endereco;
      } else {
        enderecosParaSalvar.push(endereco);
      }

      // await axios.post(`${API_URL}/publico/cliente`, {
      //   nome,
      //   telefone: telLimpo,
      //   enderecos: enderecosParaSalvar,
      // });

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

      // ✅ Se for Pix: mostra QR e não navega ainda
      if ((formaPagamento || "").toLowerCase() === "pix") {
        const pedido = resp.data?.pedido || resp.data?.pedidoCriado || resp.data?.data?.pedido || null;
        const pedidoId = pedido?._id || resp.data?._id || resp.data?.pedidoId || null;

        const qrText = resp.data?.pix_qr_code || resp.data?.qr_code || pedido?.pixInfo?.qr_code || "";
        const qrBase64 = resp.data?.pix_qr_code_url || resp.data?.qr_code_url || pedido?.pixInfo?.qr_code_url || "";

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

        // ✅ salva pendência (se cliente fechar a aba, consegue voltar)
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

        toast("info", "Pedido criado! Agora faça o pagamento no Pix.");
        iniciarPollingPix(pedidoId);
        return;
      }

      // ✅ Pedido cartão (ou outros): mantém seu fluxo atual
      localStorage.removeItem("carrinho");
      toast("success", "Pedido realizado com sucesso!");
      navigate(`/meus-pedidos?telefone=${telLimpo}`);
    } catch (err) {
      console.error("Erro backend:", err?.response?.data || err);
      toast("error", "Erro ao finalizar pedido.");
    } finally {
      setCarregando(false);
    }
  };

  // ========= COPIAR PIX =========

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeTexto);
      setCopiado(true);
    } catch (err) {
      console.error("Erro ao copiar código:", err);
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
        const telLimpo = telefone.replace(/\D/g, "");
        setTimeout(() => navigate(`/meus-pedidos?telefone=${telLimpo}`), 650);
      } else {
        toast("info", "Ainda não identificado como pago. Se já pagou, aguarde alguns segundos.");
      }
    } catch (e) {
      toast("error", "Falha ao consultar status do Pix.");
    } finally {
      setVerificandoPix(false);
    }
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const totalPreview = subtotalPreview + frete;

  const chipPix = (() => {
    const s = String(pixStatus || "").toLowerCase();
    if (!s) return null;
    if (s === "approved" || s === "paid" || s === "pago") return { label: "Pago ✅", color: "success" };
    if (s === "pending" || s === "in_process" || s === "in_process" || s === "authorized")
      return { label: "Aguardando pagamento", color: "warning" };
    if (s === "rejected" || s === "cancelled" || s === "canceled") return { label: "Não aprovado", color: "error" };
    return { label: `Status: ${pixStatus}`, color: "default" };
  })();

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" sx={{ backgroundColor: "#f5f5f7" }}>
      <Helmet>
        {restaurante ? <title>{restaurante.nome} - Checkout</title> : <title>Checkout</title>}
      </Helmet>

      {/* APPBAR */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background: "linear-gradient(90deg, #ff4b8b 0%, #ff7a3d 45%, #ffb347 100%)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={restaurante?.logoUrl || DEFAULT_IMAGE_URL}>
              {!restaurante?.logoUrl && restaurante?.nome ? restaurante.nome[0].toUpperCase() : null}
            </Avatar>
            <Box>
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

      <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Finalizar Pedido
        </Typography>

        <Paper
          sx={{
            p: 3,
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
            disabled={!!resumoPedido._id} // trava após gerar PIX
          />
          <TextField
            label="Nome"
            fullWidth
            margin="normal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={!!resumoPedido._id}
          />

          <Divider sx={{ my: 2 }} />

          {/* ENDEREÇOS SALVOS */}
          {enderecosCliente.length > 0 && (
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl fullWidth margin="normal" disabled={!!resumoPedido._id}>
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
                disabled={!!resumoPedido._id}
              >
                + Novo Endereço
              </Button>
            </Stack>
          )}

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
            Endereço de Entrega
          </Typography>

          {/* ENDEREÇO DE ENTREGA */}
          <TextField
            label="Apelido"
            fullWidth
            margin="dense"
            value={endereco.apelido || ""}
            onChange={(e) => setEndereco({ ...endereco, apelido: e.target.value })}
            disabled={!!resumoPedido._id}
          />

          <TextField
            label="CEP"
            fullWidth
            margin="dense"
            value={endereco.cep || ""}
            error={cepErro}
            helperText={cepHelper}
            disabled={!!resumoPedido._id}
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
            disabled={!!resumoPedido._id}
          />
          <TextField
            label="Número"
            fullWidth
            margin="dense"
            value={endereco.numero || ""}
            onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
            disabled={!!resumoPedido._id}
          />
          <TextField
            label="Complemento"
            fullWidth
            margin="dense"
            value={endereco.complemento || ""}
            onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
            disabled={!!resumoPedido._id}
          />
          <TextField
            label="Bairro"
            fullWidth
            margin="dense"
            value={endereco.bairro || ""}
            onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
            disabled={!!resumoPedido._id}
          />
          <TextField
            label="Cidade"
            fullWidth
            margin="dense"
            value={endereco.cidade || ""}
            onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
            disabled={!!resumoPedido._id}
          />
          <TextField
            label="Estado"
            fullWidth
            margin="dense"
            value={endereco.estado || ""}
            onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
            disabled={!!resumoPedido._id}
          />

          {/* FRETE */}
          <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 500 }}>
            Frete estimado: R$ {frete.toFixed(2)}
          </Typography>

          {/* MAPA DO ENDEREÇO */}
          {coordenadasCliente && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Localização aproximada:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  borderColor: "#e0e0e0",
                }}
              >
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff4b8b(${coordenadasCliente.lng},${coordenadasCliente.lat})/${coordenadasCliente.lng},${coordenadasCliente.lat},15,0/600x300?access_token=${MAPBOX_TOKEN}`}
                  alt="Mapa do endereço"
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Paper>
            </Box>
          )}

          {/* RESUMO DO PEDIDO */}
          {itensPreview.length > 0 && !resumoPedido._id && (
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "#fafafa",
                borderRadius: 2,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Resumo do Pedido
              </Typography>

              {itensPreview.map((item, idx) => (
                <Box key={idx} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    • {item.quantidade}x {item.nome} — R$ {calcularValorItem(item).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 1.5 }} />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">R$ {subtotalPreview.toFixed(2)}</Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="body2">Frete</Typography>
                <Typography variant="body2">R$ {frete.toFixed(2)}</Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mt={1.2}>
                <Typography variant="body1" fontWeight="bold">
                  Total estimado
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  R$ {totalPreview.toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* SEÇÃO DE PAGAMENTO / BOTÕES (ANTES DO PIX) */}
          {!resumoPedido._id && (
            <Box mt={4}>
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
                  <Box display="flex" justifyContent="flex-end" gap={2} mt={{ xs: 2, md: 4 }}>
                    <Button variant="outlined" onClick={() => navigate("/carrinho")}>
                      Voltar
                    </Button>

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={finalizarPedido}
                      disabled={carregando}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                        "&:hover": {
                          opacity: 0.9,
                          background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                        },
                      }}
                    >
                      {carregando ? <CircularProgress size={24} /> : "Finalizar pedido"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ✅ BLOCO PIX (DEPOIS QUE GEROU) */}
          {resumoPedido._id && (formaPagamento || "").toLowerCase() === "pix" && (
            <Box mt={3}>
              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                <Typography variant="h6" fontWeight={800}>
                  Pagamento via Pix
                </Typography>

                {chipPix && <Chip label={chipPix.label} color={chipPix.color} variant="filled" />}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Escaneie o QR Code ou copie o código Pix. Assim que o pagamento for aprovado, você será redirecionado.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  borderColor: "#e0e0e0",
                  bgcolor: "#fff",
                }}
              >
                {qrCodeUrl ? (
                  <Box display="flex" justifyContent="center">
                    <img
                      src={`data:image/png;base64,${qrCodeUrl}`}
                      alt="QR Code Pix"
                      style={{ width: 260, height: 260, objectFit: "contain" }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    QR Code não veio em base64. Você ainda pode copiar o código abaixo.
                  </Typography>
                )}

                <TextField
                  label="Código Pix (copia e cola)"
                  fullWidth
                  margin="normal"
                  value={qrCodeTexto || ""}
                  multiline
                  minRows={3}
                  InputProps={{ readOnly: true }}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
                  <Button variant="outlined" onClick={copiarPix} disabled={!qrCodeTexto}>
                    Copiar Pix
                  </Button>

                  <Button
                    variant="contained"
                    onClick={verificarPagamentoAgora}
                    disabled={verificandoPix}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                      "&:hover": {
                        opacity: 0.9,
                        background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                      },
                    }}
                  >
                    {verificandoPix ? <CircularProgress size={20} /> : "Verificar pagamento"}
                  </Button>
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Pedido: {resumoPedido._id}
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Container>

      {/* SNACKBAR PIX COPIADO */}
      <Snackbar
        open={copiado}
        autoHideDuration={2000}
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
