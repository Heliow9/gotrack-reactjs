// Checkout.jsx com cálculo automático de frete, envio de localização e verificação do status de pagamento
import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, Paper, Container, Divider,
  CircularProgress, AppBar, Toolbar, Avatar, MenuItem, Select,
  FormControl, InputLabel, Stack, Snackbar, Alert
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as turf from '@turf/turf';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000";
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ';

const DEFAULT_IMAGE_URL = "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

const Checkout = () => {
  const navigate = useNavigate();
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [enderecosCliente, setEnderecosCliente] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(0);
  const [endereco, setEndereco] = useState({ apelido: "", rua: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", complemento: "" });
  const [carregando, setCarregando] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeTexto, setQrCodeTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [resumoPedido, setResumoPedido] = useState({ itens: [], total: 0, _id: null });
  const [frete, setFrete] = useState(0);
  const [pagamentoGerado, setPagamentoGerado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(180); // 3 minutos (180s)



  const restaurante = JSON.parse(localStorage.getItem("restauranteSelecionado"));

  useEffect(() => {
    let interval;
    if (resumoPedido?._id) {
      interval = setInterval(async () => {
        try {
          const { data } = await axios.get(`${API_URL}/api/pedidos/status/${resumoPedido._id}`);
          if (data.status === "pago") {
            clearInterval(interval);
            alert("✅ Pagamento confirmado! Seu pedido está sendo preparado.");
            navigate(`/meus-pedidos?telefone=${telefone}`);
          }
        } catch (err) {
          console.error("Erro ao verificar status do pagamento:", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [resumoPedido._id]);


  useEffect(() => {
    const calcularFreteEndereco = async () => {
      try {
        if (endereco.rua && endereco.numero && endereco.bairro && endereco.cidade && endereco.estado) {
          const [lng, lat] = await geocodificarEndereco();
          const valorFrete = await calcularFrete(lng, lat);
          setFrete(valorFrete);
        }
      } catch (err) {
        console.error("Erro ao calcular frete automático:", err);
        setFrete(0);
      }
    };

    calcularFreteEndereco();
  }, [endereco]); // <-- roda sempre que endereço mudar



  useEffect(() => {
    let timer;
    if (pagamentoGerado && tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante((prev) => prev - 1);
      }, 1000);
    }

    if (tempoRestante === 0 && resumoPedido?._id) {
      axios.post(`${API_URL}/api/pedidos/cancelar/${resumoPedido._id}`);
      alert("⛔ Pagamento não realizado no tempo limite. Pedido cancelado.");
      setResumoPedido({ itens: [], total: 0, _id: null });
      setQrCodeUrl("");
      setQrCodeTexto("");
      setPagamentoGerado(false);
    }

    return () => clearInterval(timer);
  }, [pagamentoGerado, tempoRestante]);


  const buscarCliente = async () => {
    try {
      const res = await axios.get(`${API_URL}/publico/cliente/${telefone}`);
      if (res.data) {
        setNome(res.data.nome);
        setEnderecosCliente(res.data.enderecos);
        setEndereco(res.data.enderecos[0]);
        setEnderecoSelecionado(0);
      }
    } catch {
      setEnderecosCliente([]);
      console.log("Cliente não encontrado.");
    }
  };

  const handleEnderecoChange = (index) => {
    setEnderecoSelecionado(index);
    setEndereco(enderecosCliente[index]);
  };

  const adicionarEnderecoNovo = () => {
    setEndereco({ apelido: "", rua: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", complemento: "" });
    setEnderecoSelecionado(-1);
  };

  const geocodificarEndereco = async () => {
    const fullAddress = `${endereco.rua} ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}, ${endereco.cep}, Brazil`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.features?.length > 0) {
      return data.features[0].center;
    }
    throw new Error("Endereço não localizado");
  };

  const calcularFrete = async (lng, lat) => {
    try {
      const res = await axios.get(`${API_URL}/api/frete/dados/${restaurante._id}`);
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

      const pontoRestaurante = turf.point([localizacaoRestaurante.longitude, localizacaoRestaurante.latitude]);
      const distanciaKm = turf.distance(pontoRestaurante, pontoCliente);
      const faixa = faixasRaio.find(f => distanciaKm <= f.ate);
      return faixa ? faixa.valor : 0;
    } catch (err) {
      console.error("Erro ao calcular frete:", err);
      return 0;
    }
  };

  const finalizarPedido = async () => {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    if (!telefone || !nome || !endereco.rua || carrinho.length === 0) {
      alert("Preencha todos os dados obrigatórios.");
      return;
    }

    setCarregando(true);
    try {
      await axios.post(`${API_URL}/publico/cliente`, {
        nome,
        telefone,
        enderecos: [endereco]
      });

      const valorProdutos = carrinho.reduce((acc, item) => acc + item.precoTotal, 0);
      const [lng, lat] = await geocodificarEndereco();
      const valorFrete = await calcularFrete(lng, lat);
      const valorTotal = valorProdutos + valorFrete;

      setFrete(valorFrete);
      const carrinhoFormatado = carrinho.map(item => ({
        ...item,
        amount: Math.round(item.precoTotal * 100),
        description: item.nome,
        quantity: item.quantidade
      }));

      const freteItem = {
        nome: "Entrega",
        quantidade: 1,
        precoUnitario: valorFrete,
        precoTotal: valorFrete,
        amount: Math.round(valorFrete * 100),
        description: "Entrega",
        quantity: 1
      };

      const carrinhoComFrete = [...carrinhoFormatado, freteItem];

      console.log(carrinhoComFrete)

      const response = await axios.post(`${API_URL}/publico/pedido`, {
        itens: carrinhoComFrete,
        telefoneCliente: telefone,
        nomeCliente: nome,
        enderecoCliente: `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}`,
        residenciaNumero: endereco.numero,
        residenciaComplemento: endereco.complemento || '',
        residenciaReferencia: '',
        residenciaBairro: endereco.bairro,
        residenciaCep: endereco.cep,
        latitudeCliente: lat,
        longitudeCliente: lng,
        valorTotal,
        restaurante: restaurante._id,
        formadePagamento: "Pix",
        origem: "vitrine",
        valorFrete
      });

      setResumoPedido({
        itens: carrinhoComFrete,
        total: valorTotal,
        frete: valorFrete,
        _id: response.data._id
      });

      setQrCodeTexto(response.data.pix_qr_code);
      setQrCodeUrl(response.data.pix_qr_code_url);
      setPagamentoGerado(true);
      setTempoRestante(180); // reinicia o tempo
      localStorage.removeItem("carrinho");
    } catch (err) {
      alert("Erro ao finalizar pedido.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };



  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeTexto);
      setCopiado(true);
    } catch (err) {
      console.error("Erro ao copiar código:", err);
    }
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <AppBar position="sticky" color="success">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={restaurante?.logoUrl || DEFAULT_IMAGE_URL} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">{restaurante?.nome || "Restaurante"}</Typography>
              <Typography variant="caption" color="text.secondary">
                {restaurante?.enderecoRua}, {restaurante?.enderecoNumero} - {restaurante?.enderecoBairro}
              </Typography>
            </Box>
          </Box>
          <Button color="inherit" onClick={() => navigate("/carrinho")}>Voltar</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>Finalizar Pedido</Typography>
          
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
          <TextField label="Telefone" fullWidth margin="normal" value={telefone} onChange={(e) => setTelefone(e.target.value)} onBlur={buscarCliente} />
          <TextField label="Nome" fullWidth margin="normal" value={nome} onChange={(e) => setNome(e.target.value)} />

          <Divider sx={{ my: 2 }} />

          {enderecosCliente.length > 0 && (
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl fullWidth margin="normal">
                <InputLabel id="endereco-select-label">Selecionar Endereço</InputLabel>
                <Select
                  labelId="endereco-select-label"
                  value={enderecoSelecionado}
                  label="Selecionar Endereço"
                  onChange={(e) => handleEnderecoChange(e.target.value)}
                >
                  {enderecosCliente.map((end, index) => (
                    <MenuItem key={index} value={index}>{end.apelido}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button onClick={adicionarEnderecoNovo} variant="outlined" sx={{ mt: 2, whiteSpace: "nowrap" }}>
                + Novo Endereço
              </Button>
            </Stack>
          )}

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Endereço de Entrega</Typography>



          <TextField label="Apelido" fullWidth margin="dense" value={endereco.apelido || ""} onChange={(e) => setEndereco({ ...endereco, apelido: e.target.value })} />
          <TextField label="Rua" fullWidth margin="dense" value={endereco.rua || ""} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} />
          <TextField label="Número" fullWidth margin="dense" value={endereco.numero || ""} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} />
          <TextField label="Complemento" fullWidth margin="dense" value={endereco.complemento || ""} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} />
          <TextField label="Bairro" fullWidth margin="dense" value={endereco.bairro || ""} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} />
          <TextField label="Cidade" fullWidth margin="dense" value={endereco.cidade || ""} onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })} />
          <TextField label="Estado" fullWidth margin="dense" value={endereco.estado || ""} onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })} />
          <TextField label="CEP" fullWidth margin="dense" value={endereco.cep || ""} onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })} />
          {frete > 0 && (
            <Typography variant="body1" color="success.main" sx={{ mb: 2 }}>
              Frete estimado: R$ {frete.toFixed(2)}
            </Typography>
          )}

          <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
            <Button variant="outlined" onClick={() => navigate("/carrinho")}>Voltar</Button>
            <Button variant="contained" color="primary" onClick={finalizarPedido} disabled={carregando}>
              {carregando ? <CircularProgress size={24} /> : "Gerar Pagamento"}
            </Button>
          </Box>

          {qrCodeUrl && (
            <Box mt={4} textAlign="center">
              <Typography variant="h6">Pagamento via Pix</Typography>
              <img src={qrCodeUrl} alt="QR Code" style={{ width: 256, marginTop: 8 }} />
              <Typography variant="body2" sx={{
                mt: 1,
                wordBreak: "break-all",
                backgroundColor: "#f5f5f5",
                p: 1,
                borderRadius: 1,
              }}>{qrCodeTexto}</Typography>

              <Button onClick={copiarPix} variant="outlined" size="small" sx={{ mt: 1 }}>
                Copiar código Pix
              </Button>

              <Paper elevation={1} sx={{ mt: 3, p: 2, textAlign: "left" }}>
                <Typography variant="subtitle2" gutterBottom>Resumo do Pedido</Typography>
                <Typography variant="body2"><strong>Nome:</strong> {nome}</Typography>
                <Typography variant="body2"><strong>Telefone:</strong> {telefone}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Endereço:</strong><br />
                  {endereco.rua}, {endereco.numero} - {endereco.bairro}<br />
                  {endereco.cidade} - {endereco.estado}, {endereco.cep}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                  Tempo médio de entrega: 40–60 min
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Frete:</strong> R$ {frete.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Total a pagar:</strong> R$ {resumoPedido.total.toFixed(2)}
                </Typography>

                <Box mt={2}>
                  <Typography variant="subtitle2">Itens:</Typography>
                  {resumoPedido.itens.map((item, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        • {item.quantidade}x {item.nome} — R$ {item.precoTotal.toFixed(2)}
                      </Typography>

                      {item.saboresSelecionados?.length > 0 && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Sabores: {item.saboresSelecionados.join(" / ")}
                        </Typography>
                      )}

                      {item.bordaSelecionada && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Borda: {item.bordaSelecionada.nome} (+R$ {item.bordaSelecionada.preco.toFixed(2)})
                        </Typography>
                      )}

                      {item.adicionalSelecionado && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Adicional: {item.adicionalSelecionado.nome} (+R$ {item.adicionalSelecionado.preco.toFixed(2)})
                        </Typography>
                      )}

                      {item.complementosSelecionados?.length > 0 && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Complementos:{" "}
                          {item.complementosSelecionados.map((c, i) => (
                            <span key={i}>
                              {c.nome} (+R$ {c.preco.toFixed(2)}){i < item.complementosSelecionados.length - 1 ? ", " : ""}
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
                </Box>

              </Paper>
            </Box>
          )}
        </Paper>
      </Container>

      <Snackbar open={copiado} autoHideDuration={2000} onClose={() => setCopiado(false)}>
        <Alert onClose={() => setCopiado(false)} severity="success" sx={{ width: '100%' }}>
          Código Pix copiado!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Checkout;
