import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Divider,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Paper,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import StoreIcon from "@mui/icons-material/Store";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SettingsIcon from "@mui/icons-material/Settings";
import LinkIcon from "@mui/icons-material/Link";
import PixIcon from "@mui/icons-material/QrCode2";

import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import axios from "axios";

const MAPBOX_API_KEY =
  "pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ";

const Configuracoes = () => {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    logoUrl: "",
    horarioInicio: "",
    horarioFim: "",
    pedidosPorEntregador: "",
    chavePix: "",
    enderecoCep: "",
    enderecoRua: "",
    enderecoNumero: "",
    enderecoBairro: "",
    enderecoCidade: "",
    enderecoEstado: "",
    localizacao: {
      latitude: null,
      longitude: null,
    },
    anotaaiStatus: false,
    anotaaiUrl: "",
    anotaaiIdentificador: "",
    anotaaiToken: "",
    ifoodStatus: false,
    ifoodIdentificador: "",
    ifoodPrecisaConfirmacao: false,
    ifoodIgnorarPronto: false,
    ifoodAccessToken: "",
  });

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 🔄 carrega dados do restaurante
  useEffect(() => {
    async function fetchConfig() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3001/api/restaurantes/me",
          {
            headers: { Authorization: token },
          }
        );

        if (response.data) {
          setForm((prev) => ({
            ...prev,
            ...response.data,
            enderecoCep: response.data.enderecoCep || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar dados do restaurante:", error);
        setSnackbar({
          open: true,
          message: "Erro ao carregar dados do restaurante.",
          severity: "error",
        });
      } finally {
        setLoadingInitial(false);
      }
    }

    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buscarEnderecoPorCep = async () => {
    const cep = (form.enderecoCep || "").replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (res.data && !res.data.erro) {
        setForm((prev) => ({
          ...prev,
          enderecoRua: res.data.logradouro,
          enderecoBairro: res.data.bairro,
          enderecoCidade: res.data.localidade,
          enderecoEstado: res.data.uf,
        }));
      } else {
        setSnackbar({
          open: true,
          message: "CEP inválido ou não encontrado.",
          severity: "warning",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar endereço pelo CEP:", error);
      setSnackbar({
        open: true,
        message: "Erro ao buscar endereço pelo CEP.",
        severity: "error",
      });
    }
  };

  const buscarCoordenadasEndereco = async (formAtualizado) => {
    const {
      enderecoRua,
      enderecoNumero,
      enderecoBairro,
      enderecoCidade,
      enderecoEstado,
    } = formAtualizado;

    if (!enderecoRua || !enderecoNumero) return null;

    const enderecoCompleto = `${enderecoRua}, ${enderecoNumero}, ${enderecoBairro}, ${enderecoCidade} - ${enderecoEstado}`;

    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          enderecoCompleto
        )}.json`,
        {
          params: {
            access_token: MAPBOX_API_KEY,
            limit: 1,
            language: "pt-BR",
          },
        }
      );

      if (res.data && res.data.features.length > 0) {
        const [lon, lat] = res.data.features[0].center;
        return {
          latitude: lat,
          longitude: lon,
        };
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas no Mapbox:", error);
    }

    return null;
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);

      const formComEnderecoAtualizado = {
        ...form,
        enderecoRua: form.enderecoRua || "",
        enderecoNumero: form.enderecoNumero || "",
        enderecoBairro: form.enderecoBairro || "",
        enderecoCidade: form.enderecoCidade || "",
        enderecoEstado: form.enderecoEstado || "",
      };

      const coordenadas = await buscarCoordenadasEndereco(
        formComEnderecoAtualizado
      );
      const token = localStorage.getItem("token");

      const payload = {
        ...form,
        ...formComEnderecoAtualizado,
        localizacao: coordenadas ?? form.localizacao,
      };

      await axios.put(
        "http://168.75.78.51/api/api/restaurantes/configuracoes",
        payload,
        { headers: { Authorization: token } }
      );

      setSnackbar({
        open: true,
        message: "Configurações salvas com sucesso!",
        severity: "success",
      });

      console.log("📍 Coordenadas encontradas:", coordenadas);
      console.log("📦 Payload enviado:", payload);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setSnackbar({
        open: true,
        message: "Erro ao salvar configurações.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <Box
        sx={{
          minHeight: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 🎯 centro do mini mapa
  const hasCoords =
    form.localizacao &&
    form.localizacao.latitude &&
    form.localizacao.longitude;

  const mapCenter = hasCoords
    ? {
        longitude: form.localizacao.longitude,
        latitude: form.localizacao.latitude,
      }
    : {
        // fallback: Recife
        longitude: -34.8808,
        latitude: -8.0476,
      };

  // ⚙️ flags para travar campos de integrações
  const disableAnotaAIFields = !form.anotaaiStatus;
  const disableIfoodFields = !form.ifoodStatus;

  return (
    <>
      {/* wrapper com rolagem interna */}
      <Box
        sx={{
          maxHeight: { xs: "none", md: "calc(100vh - 180px)" },
          overflowY: "auto",
          pr: { xs: 0, md: 1.5 },
          pb: 3,
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(148,163,184,0.7)",
            borderRadius: 999,
          },
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: "#083358", mb: 0.5 }}
          >
            Configurações do restaurante
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Ajuste informações básicas, endereço, horário de funcionamento e
            integrações com outros sistemas.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Coluna esquerda */}
          <Grid item xs={12} md={7}>
            {/* Informações básicas */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <StoreIcon sx={{ color: "#0f172a" }} />
                <Typography sx={{ fontWeight: 700 }}>
                  Informações básicas
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}
              >
                Nome, contato e identidade visual do seu restaurante.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Nome do restaurante"
                    name="nome"
                    fullWidth
                    value={form.nome}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Telefone"
                    name="telefone"
                    fullWidth
                    value={form.telefone}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Chave Pix (CNPJ, e-mail ou aleatória)"
                    name="chavePix"
                    fullWidth
                    value={form.chavePix}
                    onChange={handleChange}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PixIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Logo URL"
                    name="logoUrl"
                    fullWidth
                    value={form.logoUrl}
                    onChange={handleChange}
                    size="small"
                    helperText="Use uma URL pública da sua logo"
                  />
                </Grid>

                {form.logoUrl && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        borderRadius: 2,
                        border: "1px dashed rgba(148,163,184,0.6)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Pré-visualização:
                      </Typography>
                      <Box
                        component="img"
                        src={form.logoUrl}
                        alt="Logo preview"
                        sx={{
                          width: 40,
                          height: 40,
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Endereço + mini mapa */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <RoomIcon sx={{ color: "#0f172a" }} />
                <Typography sx={{ fontWeight: 700 }}>
                  Endereço do restaurante
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}
              >
                Usado para calcular a localização no mapa e rotas de entrega.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="CEP"
                    name="enderecoCep"
                    fullWidth
                    value={form.enderecoCep}
                    onChange={handleChange}
                    onBlur={buscarEnderecoPorCep}
                    size="small"
                    helperText="Ao sair do campo, buscamos o endereço."
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Rua"
                    name="enderecoRua"
                    fullWidth
                    value={form.enderecoRua}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Número"
                    name="enderecoNumero"
                    fullWidth
                    value={form.enderecoNumero}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Bairro"
                    name="enderecoBairro"
                    fullWidth
                    value={form.enderecoBairro}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Cidade"
                    name="enderecoCidade"
                    fullWidth
                    value={form.enderecoCidade}
                    disabled
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={1.5}>
                  <TextField
                    label="UF"
                    name="enderecoEstado"
                    fullWidth
                    value={form.enderecoEstado}
                    disabled
                    size="small"
                  />
                </Grid>
              </Grid>

              {hasCoords && (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mt: 1.5 }}
                >
                  Coordenadas atuais:{" "}
                  <strong>
                    {form.localizacao.latitude.toFixed(6)} /{" "}
                    {form.localizacao.longitude.toFixed(6)}
                  </strong>
                </Typography>
              )}

              {/* Mini mapa */}
              <Box
                sx={{
                  mt: 2,
                  height: 220,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(148,163,184,0.45)",
                }}
              >
                {hasCoords ? (
                  <Map
                    mapboxAccessToken={MAPBOX_API_KEY}
                    initialViewState={{
                      longitude: mapCenter.longitude,
                      latitude: mapCenter.latitude,
                      zoom: 15,
                    }}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                  >
                    <Marker
                      longitude={form.localizacao.longitude}
                      latitude={form.localizacao.latitude}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle, #ff3b8a 0%, #ff9b2d 70%)",
                          boxShadow: "0 0 0 4px rgba(248,113,113,0.35)",
                          border: "2px solid #fff",
                        }}
                      />
                    </Marker>
                  </Map>
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", textAlign: "center", px: 2 }}
                    >
                      Defina o endereço (rua + número) para visualizar a
                      localização do restaurante no mapa.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Horário + Sistema */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccessTimeIcon sx={{ color: "#0f172a" }} />
                <Typography sx={{ fontWeight: 700 }}>
                  Horário de funcionamento
                </Typography>
              </Box>

              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Início (hora)"
                    name="horarioInicio"
                    type="number"
                    fullWidth
                    value={form.horarioInicio}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Fim (hora)"
                    name="horarioFim"
                    type="number"
                    fullWidth
                    value={form.horarioFim}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SettingsIcon sx={{ color: "#0f172a" }} />
                <Typography sx={{ fontWeight: 700 }}>Sistema</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Máx. pedidos por entregador"
                    name="pedidosPorEntregador"
                    type="number"
                    fullWidth
                    value={form.pedidosPorEntregador}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Coluna direita: integrações */}
          <Grid item xs={12} md={5}>
            {/* AnotaAI */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <LinkIcon sx={{ color: "#0f172a" }} />
                <Typography sx={{ fontWeight: 700 }}>
                  Integração com AnotaAI
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5, mb: 1.5 }}
              >
                Receba pedidos automaticamente do AnotaAI.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.anotaaiStatus}
                    onChange={handleChange}
                    name="anotaaiStatus"
                  />
                }
                label="Integração ativa"
              />

              <Grid container spacing={2} mt={0.5}>
                <Grid item xs={12}>
                  <TextField
                    label="URL"
                    name="anotaaiUrl"
                    fullWidth
                    value={form.anotaaiUrl}
                    onChange={handleChange}
                    size="small"
                    disabled={disableAnotaAIFields}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Identificador"
                    name="anotaaiIdentificador"
                    fullWidth
                    value={form.anotaaiIdentificador}
                    onChange={handleChange}
                    size="small"
                    disabled={disableAnotaAIFields}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Token"
                    name="anotaaiToken"
                    fullWidth
                    value={form.anotaaiToken}
                    onChange={handleChange}
                    size="small"
                    disabled={disableAnotaAIFields}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* iFood */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <LinkIcon sx={{ color: "#0f172a" }} />
                <Typography sx={{ fontWeight: 700 }}>
                  Integração com iFood
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5, mb: 1.5 }}
              >
                Conecte sua loja iFood para receber e gerenciar pedidos aqui
                pelo painel.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.ifoodStatus}
                    onChange={handleChange}
                    name="ifoodStatus"
                  />
                }
                label="Integração ativa"
              />

              {!form.ifoodAccessToken ? (
                <Box mt={1} mb={2}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      const restauranteId = localStorage.getItem("_id");
                      window.location.href = `https://2e32-200-124-165-255.ngrok-free.app/api/ifood/auth/start/${restauranteId}`;
                    }}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                    disabled={disableIfoodFields}
                  >
                    Conectar com iFood
                  </Button>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                    mt={1}
                  >
                    Você será redirecionado para autorizar sua conta do iFood.
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="green" mt={1} mb={2}>
                  ✅ Conta do iFood conectada.
                </Typography>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Identificador iFood"
                    name="ifoodIdentificador"
                    fullWidth
                    value={form.ifoodIdentificador}
                    onChange={handleChange}
                    size="small"
                    disabled={disableIfoodFields}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.ifoodPrecisaConfirmacao}
                        onChange={handleChange}
                        name="ifoodPrecisaConfirmacao"
                        disabled={disableIfoodFields}
                      />
                    }
                    label="Exigir confirmação manual dos pedidos"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.ifoodIgnorarPronto}
                        onChange={handleChange}
                        name="ifoodIgnorarPronto"
                        disabled={disableIfoodFields}
                      />
                    }
                    label="Ignorar status 'pronto' vindo do iFood"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box textAlign="right">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSalvar}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 999,
              px: 3,
            }}
          >
            {saving ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : (
              "Salvar configurações"
            )}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Configuracoes;
