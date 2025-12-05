// Checkout.jsx com cálculo automático de frete, envio de localização, verificação do status de pagamento
// + melhorias de UI, máscara de telefone/CEP, mapa e correções de lógica

import React, { useState, useEffect } from "react";
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
const DEFAULT_IMAGE_URL =
  "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

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

  // PIX / PAGAMENTO
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeTexto, setQrCodeTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [resumoPedido, setResumoPedido] = useState({
    itens: [],
    total: 0,
    frete: 0,
    _id: null,
  });
  const [formaPagamento, setFormaPagamento] = useState("Pix");

  // ERROS / FEEDBACK
  const [cepErro, setCepErro] = useState(false);
  const [cepHelper, setCepHelper] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const restaurante = JSON.parse(
    localStorage.getItem("restauranteSelecionado")
  );

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
      const res = await fetch(
        `https://viacep.com.br/ws/${cepNumerico}/json/`
      );
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

  // ========= CÁLCULO DE FRETE (ÁREA / RAIO) =========

  const calcularFrete = async (lng, lat) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/frete/dados/${restaurante._id}`
      );
      const { tipo, areas, faixasRaio, localizacaoRestaurante } = res.data;

      const pontoCliente = turf.point([lng, lat]);

      if (tipo === "area") {
        for (const area of areas) {
          const poligono = turf.polygon(area.coordenadas);
          if (turf.booleanPointInPolygon(pontoCliente, poligono)) {
            return area.valor;
          }
        }
      }

      const pontoRestaurante = turf.point([
        localizacaoRestaurante.longitude,
        localizacaoRestaurante.latitude,
      ]);
      const distanciaKm = turf.distance(pontoRestaurante, pontoCliente);
      const faixa = faixasRaio.find((f) => distanciaKm <= f.ate);
      return faixa ? faixa.valor : 0;
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
        !clienteCarregado ||
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
  }, [
    restaurante,
    clienteCarregado,
    endereco.rua,
    endereco.numero,
    endereco.bairro,
    endereco.cidade,
    endereco.estado,
  ]);

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

  // ========= FINALIZAR PEDIDO =========

  const finalizarPedido = async () => {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const telLimpo = telefone.replace(/\D/g, "");

    if (!telLimpo || !nome || !endereco.rua || carrinho.length === 0) {
      setSnackbar({
        open: true,
        message:
          "Preencha telefone, nome, endereço de entrega e tenha itens no carrinho.",
        severity: "warning",
      });
      return;
    }

    setCarregando(true);
    try {
      // monta array de endereços para salvar (mantém antigos!)
      let enderecosParaSalvar = [...enderecosCliente];
      if (enderecoSelecionado >= 0) {
        // atualiza o endereço selecionado com possíveis alterações
        enderecosParaSalvar[enderecoSelecionado] = endereco;
      } else {
        // novo endereço
        enderecosParaSalvar.push(endereco);
      }

      await axios.post(`${API_URL}/publico/cliente`, {
        nome,
        telefone: telLimpo,
        enderecos: enderecosParaSalvar,
      });

      const calcularValorItem = (item) => {
        let total = (item.precoUnitario || 0) * item.quantidade;

        if (item.bordaSelecionada) {
          total +=
            parseFloat(item.bordaSelecionada.preco || 0) * item.quantidade;
        }

        if (item.adicionalSelecionado) {
          total +=
            parseFloat(item.adicionalSelecionado.preco || 0) *
            item.quantidade;
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

      const valorProdutos = carrinho.reduce(
        (acc, item) => acc + calcularValorItem(item),
        0
      );

      const [lng, lat] = await geocodificarEndereco();
      const valorFrete = await calcularFrete(lng, lat);
      const valorTotal = valorProdutos + valorFrete;
      setFrete(valorFrete);

      const carrinhoFormatado = carrinho.map((item) => ({
        ...item,
        amount: Math.round((item.precoTotal || 0) * 100),
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

      const response = await axios.post(`${API_URL}/publico/pedido`, {
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

      setResumoPedido({
        itens: carrinhoComFrete,
        total: valorTotal,
        frete: valorFrete,
        _id: response.data._id,
      });
      setQrCodeTexto(response.data.pix_qr_code);
      setQrCodeUrl(response.data.pix_qr_code_url);

      localStorage.removeItem("carrinho");

      setSnackbar({
        open: true,
        message: "Pedido criado! Conclua o pagamento via Pix.",
        severity: "success",
      });
    } catch (err) {
      console.error("Erro backend:", err?.response?.data || err);
      setSnackbar({
        open: true,
        message: "Erro ao finalizar pedido.",
        severity: "error",
      });
    } finally {
      setCarregando(false);
    }
  };

  // ========= POLLING STATUS DO PAGAMENTO =========

  useEffect(() => {
    let interval;
    if (resumoPedido?._id) {
      interval = setInterval(async () => {
        try {
          const { data } = await axios.get(
            `${API_URL}/api/pedidos/status/${resumoPedido._id}`
          );
          if (data.status === "pago") {
            clearInterval(interval);
            setSnackbar({
              open: true,
              message:
                "✅ Pagamento confirmado! Seu pedido está sendo preparado.",
              severity: "success",
            });
            const telLimpo = telefone.replace(/\D/g, "");
            navigate(`/meus-pedidos?telefone=${telLimpo}`);
          }
        } catch (err) {
          console.error("Erro ao verificar status do pagamento:", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [resumoPedido._id, navigate, telefone]);

  // ========= COPIAR PIX =========

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeTexto);
      setCopiado(true);
    } catch (err) {
      console.error("Erro ao copiar código:", err);
    }
  };

  const handleSnackbarClose = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const subtotal = resumoPedido.total - (resumoPedido.frete || 0);

  // ========= RENDER =========

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{ backgroundColor: "#f5f5f7" }}
    >
      <Helmet>
        {restaurante ? (
          <title>{restaurante.nome} - Checkout</title>
        ) : (
          <title>Checkout</title>
        )}
      </Helmet>

      {/* APPBAR NO PADRÃO MOVYO (igual carrinho) */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background:
            "linear-gradient(90deg, #ff4b8b 0%, #ff7a3d 45%, #ffb347 100%)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={restaurante?.logoUrl || DEFAULT_IMAGE_URL} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" noWrap>
                {restaurante?.nome || "Restaurante"}
              </Typography>
              {restaurante && (
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                  noWrap
                >
                  {restaurante.enderecoBairro} •{" "}
                  {restaurante.enderecoCidade || ""}
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            color="inherit"
            onClick={() => navigate("/carrinho")}
            sx={{ textTransform: "none" }}
          >
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
          />
          <TextField
            label="Nome"
            fullWidth
            margin="normal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Divider sx={{ my: 2 }} />

          {/* ENDEREÇOS SALVOS */}
          {enderecosCliente.length > 0 && (
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl fullWidth margin="normal">
                <InputLabel id="endereco-select-label">
                  Selecionar Endereço
                </InputLabel>
                <Select
                  labelId="endereco-select-label"
                  value={enderecoSelecionado}
                  label="Selecionar Endereço"
                  onChange={(e) => handleEnderecoChange(e.target.value)}
                >
                  {enderecosCliente.map((end, index) => (
                    <MenuItem key={index} value={index}>
                      {end.apelido ||
                        `${end.rua}, ${end.numero} - ${end.bairro}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={adicionarEnderecoNovo}
                variant="outlined"
                sx={{ mt: 2, whiteSpace: "nowrap", textTransform: "none" }}
              >
                + Novo Endereço
              </Button>
            </Stack>
          )}

          <Typography
            variant="subtitle1"
            fontWeight="bold"
            gutterBottom
            sx={{ mt: 1 }}
          >
            Endereço de Entrega
          </Typography>

          {/* ENDEREÇO DE ENTREGA */}
          <TextField
            label="Apelido"
            fullWidth
            margin="dense"
            value={endereco.apelido || ""}
            onChange={(e) =>
              setEndereco({ ...endereco, apelido: e.target.value })
            }
          />

          <TextField
            label="CEP"
            fullWidth
            margin="dense"
            value={endereco.cep || ""}
            error={cepErro}
            helperText={cepHelper}
            onChange={async (e) => {
              const cepMascarado = formatarCEP(e.target.value);
              const cepNumerico = cepMascarado.replace(/\D/g, "");
              setEndereco((prev) => ({ ...prev, cep: cepMascarado }));
              setCepErro(false);
              setCepHelper("");

              if (cepNumerico.length === 8) {
                const resultado = await buscarEnderecoPorCep(cepNumerico);
                if (resultado) {
                  setEndereco((prev) => ({
                    ...prev,
                    ...resultado,
                    cep: cepMascarado,
                  }));
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
            onChange={(e) =>
              setEndereco({ ...endereco, rua: e.target.value })
            }
          />
          <TextField
            label="Número"
            fullWidth
            margin="dense"
            value={endereco.numero || ""}
            onChange={(e) =>
              setEndereco({ ...endereco, numero: e.target.value })
            }
          />
          <TextField
            label="Complemento"
            fullWidth
            margin="dense"
            value={endereco.complemento || ""}
            onChange={(e) =>
              setEndereco({ ...endereco, complemento: e.target.value })
            }
          />
          <TextField
            label="Bairro"
            fullWidth
            margin="dense"
            value={endereco.bairro || ""}
            onChange={(e) =>
              setEndereco({ ...endereco, bairro: e.target.value })
            }
          />
          <TextField
            label="Cidade"
            fullWidth
            margin="dense"
            value={endereco.cidade || ""}
            onChange={(e) =>
              setEndereco({ ...endereco, cidade: e.target.value })
            }
          />
          <TextField
            label="Estado"
            fullWidth
            margin="dense"
            value={endereco.estado || ""}
            onChange={(e) =>
              setEndereco({ ...endereco, estado: e.target.value })
            }
          />

          {frete > 0 && (
            <Typography
              variant="body2"
              color="success.main"
              sx={{ mt: 1, fontWeight: 500 }}
            >
              Frete estimado: R$ {frete.toFixed(2)}
            </Typography>
          )}

          {/* MAPA DO ENDEREÇO (CARD BRANCO, ALTURA MÉDIA) */}
          {coordenadasCliente && (
            <Box mt={2}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
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
                    height: 180, // altura média
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Paper>
            </Box>
          )}

          {/* SEÇÃO DE PAGAMENTO E BOTÕES (ANTES DO PIX) */}
          {!resumoPedido._id && (
            <Box mt={4}>
              <Grid
                container
                spacing={2}
                alignItems="flex-start"
                justifyContent="space-between"
              >
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Forma de Pagamento
                  </Typography>

                  <RadioGroup
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                  >
                    <FormControlLabel
                      value="Pix"
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <PixIcon
                            color={
                              formaPagamento === "Pix" ? "primary" : "action"
                            }
                          />
                          <Typography>Pix</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="CartaoCredito"
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <CreditCardIcon
                            color={
                              formaPagamento === "CartaoCredito"
                                ? "primary"
                                : "action"
                            }
                          />
                          <Typography>Cartão de Crédito</Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    gap={2}
                    mt={{ xs: 2, md: 4 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/carrinho")}
                    >
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
                        background:
                          "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                        "&:hover": {
                          opacity: 0.9,
                          background:
                            "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                        },
                      }}
                    >
                      {carregando ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Gerar Pagamento"
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* PIX + RESUMO DO PEDIDO (DEPOIS DE GERAR) */}
          {qrCodeUrl && formaPagamento === "Pix" && (
            <Box mt={4} textAlign="center">
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6">Pagamento via Pix</Typography>
              <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{ width: 230, marginTop: 8 }}
              />
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  wordBreak: "break-all",
                  backgroundColor: "#f5f5f5",
                  p: 1,
                  borderRadius: 1,
                }}
              >
                {qrCodeTexto}
              </Typography>

              <Button
                onClick={copiarPix}
                variant="outlined"
                size="small"
                sx={{ mt: 1, textTransform: "none" }}
              >
                Copiar código Pix
              </Button>

              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  p: 2,
                  textAlign: "left",
                  bgcolor: "#fafafa",
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Resumo do Pedido
                </Typography>
                <Typography variant="body2">
                  <strong>Nome:</strong> {nome}
                </Typography>
                <Typography variant="body2">
                  <strong>Telefone:</strong> {telefone}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Endereço:</strong>
                  <br />
                  {endereco.rua}, {endereco.numero} - {endereco.bairro}
                  <br />
                  {endereco.cidade} - {endereco.estado}, {endereco.cep}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 1 }}
                  color="text.secondary"
                >
                  Tempo médio de entrega: 40–60 min
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Subtotal:</strong> R$ {subtotal.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  <strong>Frete:</strong> R$ {frete.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Total a pagar:</strong> R${" "}
                  {resumoPedido.total.toFixed(2)}
                </Typography>

                <Box mt={2}>
                  <Typography variant="subtitle2">Itens:</Typography>
                  {resumoPedido.itens.map((item, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        • {item.quantidade}x {item.nome} — R${" "}
                        {item.precoTotal.toFixed(2)}
                      </Typography>

                      {item.saboresSelecionados?.length > 0 && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Sabores: {item.saboresSelecionados.join(" / ")}
                        </Typography>
                      )}

                      {item.bordaSelecionada && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Borda: {item.bordaSelecionada.nome} (+R${" "}
                          {item.bordaSelecionada.preco.toFixed(2)})
                        </Typography>
                      )}

                      {item.adicionalSelecionado && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Adicional: {item.adicionalSelecionado.nome} (+R${" "}
                          {item.adicionalSelecionado.preco.toFixed(2)})
                        </Typography>
                      )}

                      {item.complementosSelecionados?.length > 0 && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Complementos:{" "}
                          {item.complementosSelecionados.map((c, i) => (
                            <span key={i}>
                              {c.nome} (+R$ {c.preco.toFixed(2)})
                              {i <
                              item.complementosSelecionados.length - 1
                                ? ", "
                                : ""}
                            </span>
                          ))}
                        </Typography>
                      )}

                      {item.tiposExtrasSelecionados &&
                        Object.entries(
                          item.tiposExtrasSelecionados
                        ).map(([tipoNome, itens]) =>
                          itens
                            .filter(
                              (extra) =>
                                parseFloat(extra?.preco || 0) > 0
                            )
                            .map((extra, i) => (
                              <Typography
                                key={`${tipoNome}-${i}`}
                                variant="body2"
                                sx={{
                                  ml: 2,
                                  fontSize: "0.8rem",
                                  color: "text.secondary",
                                }}
                              >
                                {tipoNome}: {extra.nome} (+R${" "}
                                {parseFloat(extra.preco).toFixed(2)})
                              </Typography>
                            ))
                        )}

                      {item.observacao && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Observações: {item.observacao}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
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
        <Alert
          onClose={() => setCopiado(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Código Pix copiado!
        </Alert>
      </Snackbar>

      {/* SNACKBAR GERAL */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Checkout;
