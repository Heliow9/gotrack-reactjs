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
  CircularProgress
} from "@mui/material";
import axios from "axios";

const Configuracoes = () => {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    logoUrl: "",
    horarioInicio: "",
    horarioFim: "",
    pedidosPorEntregador: "",
    chavePix: "", // ✅ novo campo
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
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://168.75.78.51:10000/api/restaurantes/me", {
          headers: { Authorization: token },
        });
        if (response.data) {
          setForm((prev) => ({
            ...prev,
            ...response.data,
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar dados do restaurante:", error);
        alert("Erro ao carregar dados do restaurante.");
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
    const cep = form.enderecoCep.replace(/\D/g, "");
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
        alert("CEP inválido ou não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar endereço pelo CEP:", error);
      alert("Erro ao buscar endereço pelo CEP.");
    }
  };

  const MAPBOX_API_KEY = 'pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ';

  const buscarCoordenadasEndereco = async (formAtualizado) => {
    const {
      enderecoRua,
      enderecoNumero,
      enderecoBairro,
      enderecoCidade,
      enderecoEstado,
    } = formAtualizado;

    const enderecoCompleto = `${enderecoRua}, ${enderecoNumero}, ${enderecoBairro}, ${enderecoCidade} - ${enderecoEstado}`;

    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(enderecoCompleto)}.json`,
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
      setLoading(true);

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
        ...form,
        localizacao: coordenadas ?? form.localizacao,
        
      };

      await axios.put(
        "http://168.75.78.51/api/restaurantes/configuracoes",
        payload,
        { headers: { Authorization: token } }
      );

      alert("Configurações salvas com sucesso!");
      console.log("📍 Coordenadas encontradas:", coordenadas);
      console.log("📦 Payload enviado:", payload);

    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Paper elevation={3} sx={{ padding: 4 }}>
      <Typography variant="h5" gutterBottom>
        Configurações do Restaurante
      </Typography>

      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Informações Básicas</Typography>
      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} sm={6}>
          <TextField label="Nome do Restaurante" name="nome" fullWidth value={form.nome} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Telefone" name="telefone" fullWidth value={form.telefone} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Chave Pix (CNPJ, Email ou Aleatória)" name="chavePix" fullWidth value={form.chavePix} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Logo URL" name="logoUrl" fullWidth value={form.logoUrl} onChange={handleChange} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Endereço do Restaurante</Typography>
      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="CEP"
            name="enderecoCep"
            fullWidth
            value={form.enderecoCep}
            onChange={handleChange}
            onBlur={buscarEnderecoPorCep}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField label="Rua" name="enderecoRua" fullWidth value={form.enderecoRua} disabled />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Número" name="enderecoNumero" fullWidth value={form.enderecoNumero} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Bairro" name="enderecoBairro" fullWidth value={form.enderecoBairro} disabled />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Cidade" name="enderecoCidade" fullWidth value={form.enderecoCidade} disabled />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField label="Estado" name="enderecoEstado" fullWidth value={form.enderecoEstado} disabled />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Horário de Funcionamento</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField label="Início (hora)" name="horarioInicio" type="number" fullWidth value={form.horarioInicio} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Fim (hora)" name="horarioFim" type="number" fullWidth value={form.horarioFim} onChange={handleChange} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Sistema</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Máximo de Pedidos por Entregador"
            name="pedidosPorEntregador"
            type="number"
            fullWidth
            value={form.pedidosPorEntregador}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Integração com AnotaAI</Typography>
      <FormControlLabel
        control={<Switch checked={form.anotaaiStatus} onChange={handleChange} name="anotaaiStatus" />}
        label="Ativo"
      />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="URL" name="anotaaiUrl" fullWidth value={form.anotaaiUrl} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Identificador" name="anotaaiIdentificador" fullWidth value={form.anotaaiIdentificador} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Token" name="anotaaiToken" fullWidth value={form.anotaaiToken} onChange={handleChange} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Integração com iFood</Typography>
      <FormControlLabel
        control={<Switch checked={form.ifoodStatus} onChange={handleChange} name="ifoodStatus" />}
        label="Integração Ativa"
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
          >
            Conectar com iFood
          </Button>
          <Typography variant="caption" display="block" color="text.secondary" mt={1}>
            Após clicar, você será redirecionado para autorizar sua conta do iFood.
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="green" mt={1} mb={2}>
          ✅ Conta do iFood conectada com sucesso.
        </Typography>
      )}


      <Divider sx={{ my: 4 }} />
      <Box textAlign="right">
        <Button variant="contained" color="primary" onClick={handleSalvar} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Salvar Configurações"}
        </Button>
      </Box>
    </Paper>
  );
};

export default Configuracoes;
