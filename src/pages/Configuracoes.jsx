import React, { useEffect, useMemo, useState } from "react";
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
  Tabs,
  Tab,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";

import RoomIcon from "@mui/icons-material/Room";
import StoreIcon from "@mui/icons-material/Store";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SettingsIcon from "@mui/icons-material/Settings";
import LinkIcon from "@mui/icons-material/Link";
import PixIcon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://api.movyo.delivery";

const MAPBOX_API_KEY =
  "pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ";

// Agora no padrão do Electron
const DIAS = [
  { key: "segunda", label: "Seg" },
  { key: "terca", label: "Ter" },
  { key: "quarta", label: "Qua" },
  { key: "quinta", label: "Qui" },
  { key: "sexta", label: "Sex" },
  { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
];

const defaultHorariosFuncionamento = {
  segunda: { abre: "18:00", fecha: "23:00", fechado: false },
  terca: { abre: "18:00", fecha: "23:00", fechado: false },
  quarta: { abre: "18:00", fecha: "23:00", fechado: false },
  quinta: { abre: "18:00", fecha: "23:00", fechado: false },
  sexta: { abre: "18:00", fecha: "23:30", fechado: false },
  sabado: { abre: "18:00", fecha: "23:30", fechado: false },
  domingo: { abre: "18:00", fecha: "23:00", fechado: false },
};

export default function Configuracoes() {
  const [tab, setTab] = useState(0);

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    logoUrl: "",
    pedidosPorEntregador: "",
    chavePix: "",

    enderecoCep: "",
    enderecoRua: "",
    enderecoNumero: "",
    enderecoBairro: "",
    enderecoCidade: "",
    enderecoEstado: "",

    // ✅ agora do jeito certo
    horariosFuncionamento: defaultHorariosFuncionamento,

    localizacao: { latitude: null, longitude: null },

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

  // 🔄 carrega dados
  useEffect(() => {
    async function fetchConfig() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/api/restaurantes/me`, {
          headers: { Authorization: token },
        });

        if (response.data) {
          setForm((prev) => ({
            ...prev,
            ...response.data,
            enderecoCep: response.data.enderecoCep || "",
            horariosFuncionamento:
              response.data.horariosFuncionamento ||
              prev.horariosFuncionamento ||
              defaultHorariosFuncionamento,
          }));
        }
      } catch (error) {
        console.error(error);
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

  // handler simples
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
      console.error(error);
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
          params: { access_token: MAPBOX_API_KEY, limit: 1, language: "pt-BR" },
        }
      );

      if (res.data && res.data.features?.length > 0) {
        const [lon, lat] = res.data.features[0].center;
        return { latitude: lat, longitude: lon };
      }
    } catch (error) {
      console.error("Erro Mapbox:", error);
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

      const coordenadas = await buscarCoordenadasEndereco(formComEnderecoAtualizado);
      const token = localStorage.getItem("token");

      const payload = {
        ...formComEnderecoAtualizado,
        localizacao: coordenadas ?? form.localizacao,
        // ✅ manda do jeito que você precisa
        horariosFuncionamento: form.horariosFuncionamento,
      };

      await axios.put(`${API_URL}/api/restaurantes/configuracoes`, payload, {
        headers: { Authorization: token },
      });

      setSnackbar({
        open: true,
        message: "Configurações salvas com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Erro ao salvar configurações.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // mapa
  const hasCoords = !!(form.localizacao?.latitude && form.localizacao?.longitude);
  const mapCenter = hasCoords
    ? { longitude: form.localizacao.longitude, latitude: form.localizacao.latitude }
    : { longitude: -34.8808, latitude: -8.0476 };

  const disableAnotaAIFields = !form.anotaaiStatus;
  const disableIfoodFields = !form.ifoodStatus;

  // ======= Horários UX (NOVO PADRÃO) =======
  const [diaSelecionado, setDiaSelecionado] = useState("segunda");

  const diaAtual = useMemo(() => {
    return (
      form.horariosFuncionamento?.[diaSelecionado] || {
        abre: "18:00",
        fecha: "23:00",
        fechado: false,
      }
    );
  }, [form.horariosFuncionamento, diaSelecionado]);

  const setDiaHorario = (diaKey, patch) => {
    setForm((prev) => ({
      ...prev,
      horariosFuncionamento: {
        ...(prev.horariosFuncionamento || defaultHorariosFuncionamento),
        [diaKey]: {
          ...(prev.horariosFuncionamento?.[diaKey] || {
            abre: "18:00",
            fecha: "23:00",
            fechado: false,
          }),
          ...patch,
        },
      },
    }));
  };

  const copiarParaTodos = () => {
    const base = form.horariosFuncionamento?.[diaSelecionado] || diaAtual;
    setForm((prev) => {
      const novo = { ...(prev.horariosFuncionamento || defaultHorariosFuncionamento) };
      DIAS.forEach((d) => {
        novo[d.key] = { ...novo[d.key], ...base };
      });
      return { ...prev, horariosFuncionamento: novo };
    });
    setSnackbar({
      open: true,
      message: "Horário copiado para todos os dias!",
      severity: "success",
    });
  };

  const diasAbertosCount = useMemo(() => {
    return DIAS.reduce(
      (acc, d) => acc + (form.horariosFuncionamento?.[d.key]?.fechado ? 0 : 1),
      0
    );
  }, [form.horariosFuncionamento]);

  if (loadingInitial) {
    return (
      <Box sx={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* wrapper com rolagem interna */}
      <Box
        sx={{
          maxHeight: { xs: "none", md: "calc(100vh - 180px)" },
          overflowY: "auto",
          pr: { xs: 0, md: 1.5 },
          pb: 10,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(148,163,184,0.7)",
            borderRadius: 999,
          },
        }}
      >
        {/* Cabeçalho */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: "#083358", mb: 0.4 }}>
            Configurações do restaurante
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Organize informações, endereço, horários e integrações.
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "#fff",
          }}
        >
          <Tabs
            value={tab}
            onChange={(_e, v) => setTab(v)}
            sx={{
              px: 1,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 700,
                minHeight: 44,
                borderRadius: 999,
                mx: 0.5,
              },
              "& .MuiTab-root.Mui-selected": {
                color: "#0f172a",
                background:
                  "linear-gradient(135deg, rgba(255,59,138,0.12), rgba(255,155,45,0.12))",
              },
              "& .MuiTabs-indicator": { display: "none" },
            }}
          >
            <Tab label="Geral" />
            <Tab label="Endereço" />
            <Tab label="Horários" />
            <Tab label="Integrações" />
          </Tabs>
        </Paper>

        {/* Conteúdo */}
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(148,163,184,0.35)" }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StoreIcon sx={{ color: "#0f172a" }} />
                  <Typography sx={{ fontWeight: 800 }}>Informações básicas</Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}>
                  Nome, contato e identidade visual.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={7}>
                    <TextField label="Nome do restaurante" name="nome" fullWidth value={form.nome} onChange={handleChange} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField label="Telefone" name="telefone" fullWidth value={form.telefone} onChange={handleChange} size="small" />
                  </Grid>

                  <Grid item xs={12} sm={7}>
                    <TextField
                      label="Chave Pix"
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
                      helperText="Use uma URL pública"
                    />
                  </Grid>

                  {form.logoUrl && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          mt: 0.5,
                          p: 1.2,
                          borderRadius: 2,
                          border: "1px dashed rgba(148,163,184,0.6)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          background: "#f8fafc",
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Preview:
                        </Typography>
                        <Box component="img" src={form.logoUrl} alt="Logo preview" sx={{ width: 44, height: 44, objectFit: "contain" }} />
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 2.5 }} />

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <SettingsIcon sx={{ color: "#0f172a" }} />
                  <Typography sx={{ fontWeight: 800 }}>Sistema</Typography>
                </Stack>

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

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "linear-gradient(180deg, rgba(248,250,252,0.85), #fff)",
                }}
              >
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Resumo</Typography>
                <Stack spacing={1}>
                  <Chip label={`Dias abertos: ${diasAbertosCount}/7`} />
                  <Chip label={form.ifoodAccessToken ? "iFood: conectado" : "iFood: não conectado"} />
                  <Chip label={form.anotaaiStatus ? "AnotaAI: ativo" : "AnotaAI: inativo"} />
                </Stack>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.5 }}>
                  Dica: configure o endereço e horários para melhorar rota e cardápio.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(148,163,184,0.35)" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <RoomIcon sx={{ color: "#0f172a" }} />
                  <Typography sx={{ fontWeight: 800 }}>Endereço do restaurante</Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}>
                  Usado para mapa e rotas de entrega.
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
                    <TextField label="Rua" name="enderecoRua" fullWidth value={form.enderecoRua} disabled size="small" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Número" name="enderecoNumero" fullWidth value={form.enderecoNumero} onChange={handleChange} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Bairro" name="enderecoBairro" fullWidth value={form.enderecoBairro} disabled size="small" />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Cidade" name="enderecoCidade" fullWidth value={form.enderecoCidade} disabled size="small" />
                  </Grid>
                  <Grid item xs={12} sm={1.5}>
                    <TextField label="UF" name="enderecoEstado" fullWidth value={form.enderecoEstado} disabled size="small" />
                  </Grid>
                </Grid>

                {hasCoords && (
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.5 }}>
                    Coordenadas atuais:{" "}
                    <strong>
                      {form.localizacao.latitude.toFixed(6)} / {form.localizacao.longitude.toFixed(6)}
                    </strong>
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(148,163,184,0.35)" }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Localização no mapa</Typography>

                <Box
                  sx={{
                    mt: 1,
                    height: 260,
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
                      <Marker longitude={form.localizacao.longitude} latitude={form.localizacao.latitude}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "radial-gradient(circle, #ff3b8a 0%, #ff9b2d 70%)",
                            boxShadow: "0 0 0 4px rgba(248,113,113,0.35)",
                            border: "2px solid #fff",
                          }}
                        />
                      </Marker>
                    </Map>
                  ) : (
                    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f9fafb" }}>
                      <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", px: 2 }}>
                        Defina o endereço (rua + número) para visualizar no mapa.
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
                  As coordenadas são atualizadas ao salvar.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {tab === 2 && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(148,163,184,0.35)" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccessTimeIcon sx={{ color: "#0f172a" }} />
              <Typography sx={{ fontWeight: 900 }}>Horário de funcionamento</Typography>
              <Chip size="small" label={`${diasAbertosCount}/7 abertos`} sx={{ ml: 1 }} />
            </Stack>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.6, mb: 2 }}>
              Configure os dias e horários. Você pode copiar o horário do dia selecionado para todos.
            </Typography>

            {/* seletor de dias */}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {DIAS.map((d) => {
                const fechado = !!form.horariosFuncionamento?.[d.key]?.fechado;
                const selected = diaSelecionado === d.key;

                return (
                  <Chip
                    key={d.key}
                    label={d.label}
                    onClick={() => setDiaSelecionado(d.key)}
                    variant={selected ? "filled" : "outlined"}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 800,
                      cursor: "pointer",
                      background: selected
                        ? "linear-gradient(135deg, rgba(255,59,138,0.20), rgba(255,155,45,0.20))"
                        : "transparent",
                      opacity: fechado ? 0.55 : 1,
                    }}
                  />
                );
              })}
            </Stack>

            {/* card do dia */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                borderColor: "rgba(148,163,184,0.35)",
                background: "linear-gradient(180deg, rgba(248,250,252,0.85), #fff)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>
                    {DIAS.find((x) => x.key === diaSelecionado)?.label} — Configuração
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Ative/desative e ajuste horário.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Copiar horários deste dia para todos">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={copiarParaTodos}
                      sx={{ textTransform: "none", borderRadius: 999 }}
                    >
                      Copiar p/ todos
                    </Button>
                  </Tooltip>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={!diaAtual.fechado}
                        onChange={(e) => setDiaHorario(diaSelecionado, { fechado: !e.target.checked })}
                      />
                    }
                    label={!diaAtual.fechado ? "Aberto" : "Fechado"}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Abre"
                    type="time"
                    fullWidth
                    size="small"
                    value={diaAtual.abre || "18:00"}
                    onChange={(e) => setDiaHorario(diaSelecionado, { abre: e.target.value })}
                    disabled={diaAtual.fechado}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fecha"
                    type="time"
                    fullWidth
                    size="small"
                    value={diaAtual.fecha || "23:00"}
                    onChange={(e) => setDiaHorario(diaSelecionado, { fecha: e.target.value })}
                    disabled={diaAtual.fechado}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Dica: use o formato 24h (ex: 18:00). Se estiver “Fechado”, o app pode ocultar o restaurante.
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Paper>
        )}

        {tab === 3 && (
          <Grid container spacing={3}>
            {/* AnotaAI */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(148,163,184,0.35)" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LinkIcon sx={{ color: "#0f172a" }} />
                  <Typography sx={{ fontWeight: 900 }}>Integração com AnotaAI</Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 1.5 }}>
                  Receba pedidos automaticamente do AnotaAI.
                </Typography>

                <FormControlLabel
                  control={<Switch checked={form.anotaaiStatus} onChange={handleChange} name="anotaaiStatus" />}
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
            </Grid>

            {/* iFood */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(148,163,184,0.35)" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LinkIcon sx={{ color: "#0f172a" }} />
                  <Typography sx={{ fontWeight: 900 }}>Integração com iFood</Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 1.5 }}>
                  Conecte sua loja iFood para receber e gerenciar pedidos no painel.
                </Typography>

                <FormControlLabel
                  control={<Switch checked={form.ifoodStatus} onChange={handleChange} name="ifoodStatus" />}
                  label="Integração ativa"
                />

                {!form.ifoodAccessToken ? (
                  <Box mt={1} mb={2}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        const rid = localStorage.getItem("_id");
                        window.location.href = `https://2e32-200-124-165-255.ngrok-free.app/api/ifood/auth/start/${rid}`;
                      }}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
                      disabled={disableIfoodFields}
                    >
                      Conectar com iFood
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary" mt={1}>
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
        )}
      </Box>

      {/* Footer sticky com salvar */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 5,
          mt: -7,
          pt: 1.5,
          pb: 1.5,
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.0), rgba(248,250,252,0.85) 30%, rgba(255,255,255,0.95))",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(148,163,184,0.22)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: { xs: 0, md: 1.5 } }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSalvar}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: 999,
              px: 3,
              minWidth: 220,
            }}
          >
            {saving ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Salvar configurações"}
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
}
