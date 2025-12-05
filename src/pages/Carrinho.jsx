// pages/Carrinho.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  Fade,
  Chip,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const FALLBACK_IMG =
  "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

const Carrinho = () => {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [restaurante, setRestaurante] = useState(null);
  const [abertoAgora, setAbertoAgora] = useState(false);
  const [avisoOpen, setAvisoOpen] = useState(false);
  const navigate = useNavigate();

  // Carrega carrinho e restaurante
  useEffect(() => {
    const dados = localStorage.getItem("carrinho");
    if (dados) setItensCarrinho(JSON.parse(dados));

    const restauranteData = localStorage.getItem("restauranteSelecionado");
    if (restauranteData) setRestaurante(JSON.parse(restauranteData));
  }, []);

  // Atualiza status aberto/fechado periodicamente
  useEffect(() => {
    const update = () => setAbertoAgora(estaAbertoAgora());
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurante]);

  const atualizarCarrinho = (novosItens) => {
    setItensCarrinho(novosItens);
    localStorage.setItem("carrinho", JSON.stringify(novosItens));
  };

  const removerItem = (index) => {
    const novosItens = [...itensCarrinho];
    novosItens.splice(index, 1);
    atualizarCarrinho(novosItens);
  };

  const alterarQuantidade = (index, delta) => {
    const novosItens = [...itensCarrinho];
    const item = novosItens[index];
    const novaQtd = item.quantidade + delta;

    if (novaQtd >= 1) {
      const precoUnitario = item.precoTotal / item.quantidade;
      item.quantidade = novaQtd;
      item.precoTotal = precoUnitario * novaQtd;
      atualizarCarrinho(novosItens);
    }
  };

  const estaAbertoAgora = () => {
    if (!restaurante?.horariosFuncionamento) return false;

    const diasSemana = [
      "domingo",
      "segunda",
      "terca",
      "quarta",
      "quinta",
      "sexta",
      "sabado",
    ];
    const hoje = diasSemana[new Date().getDay()];
    const horario = restaurante.horariosFuncionamento[hoje];

    if (!horario || horario.fechado || !horario.abre || !horario.fecha)
      return false;

    const agora = new Date();
    const [hAbre, mAbre] = horario.abre.split(":").map(Number);
    const [hFecha, mFecha] = horario.fecha.split(":").map(Number);

    const horarioAbre = new Date(agora);
    horarioAbre.setHours(hAbre, mAbre, 0, 0);

    const horarioFecha = new Date(agora);
    horarioFecha.setHours(hFecha, mFecha, 0, 0);

    // Mesmo critério do Publico.jsx: >= fecha = fechado
    return agora >= horarioAbre && agora < horarioFecha;
  };

  const calcularTotal = () =>
    itensCarrinho.reduce((total, item) => total + item.precoTotal, 0);

  const handleFinalizarPedido = () => {
    if (!abertoAgora) {
      setAvisoOpen(true);
      return;
    }
    navigate("/checkout");
  };

  const renderExtras = (item) => {
    const blocos = [];

    if (item.saboresSelecionados?.length > 0) {
      blocos.push({
        titulo: "Sabores",
        opcoes: item.saboresSelecionados.map((s) => `• ${s}`),
      });
    }

    if (item.bordaSelecionada) {
      blocos.push({
        titulo: "Borda",
        opcoes: [
          `• ${item.bordaSelecionada.nome} (+R$ ${item.bordaSelecionada.preco.toFixed(
            2
          )})`,
        ],
      });
    }

    if (item.adicionalSelecionado) {
      blocos.push({
        titulo: "Adicional",
        opcoes: [
          `• ${item.adicionalSelecionado.nome} (+R$ ${item.adicionalSelecionado.preco.toFixed(
            2
          )})`,
        ],
      });
    }

    if (item.complementosSelecionados?.length > 0) {
      const opcoes = item.complementosSelecionados.map(
        (comp) => `• ${comp.nome} (+R$ ${comp.preco.toFixed(2)})`
      );
      blocos.push({ titulo: "Complementos", opcoes });
    }

    if (
      item.tiposExtrasSelecionados &&
      typeof item.tiposExtrasSelecionados === "object"
    ) {
      Object.entries(item.tiposExtrasSelecionados).forEach(([tipo, opcoes]) => {
        if (Array.isArray(opcoes) && opcoes.length > 0) {
          blocos.push({
            titulo: tipo,
            opcoes: opcoes.map(
              (op) =>
                `• ${op.nome}${
                  op.preco ? ` (+R$ ${op.preco.toFixed(2)})` : ""
                }`
            ),
          });
        }
      });
    }

    if (item.observacao) {
      blocos.push({ titulo: "Observação", opcoes: [`• ${item.observacao}`] });
    }

    if (!blocos.length) return null;

    return (
      <Box mt={1}>
        {blocos.map((bloco, idx) => (
          <Box key={idx} mb={0.5}>
            <Typography variant="caption" fontWeight="bold">
              {bloco.titulo}:
            </Typography>
            {bloco.opcoes.map((op, i) => (
              <Typography key={i} variant="caption" display="block" ml={1}>
                {op}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  const total = calcularTotal();
  const totalItens = itensCarrinho.reduce(
    (acc, item) => acc + (item.quantidade || 0),
    0
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      sx={{ backgroundColor: "#f5f5f7" }} // fundo claro opção 2
    >
      <Helmet>
        {restaurante ? <title>{restaurante.nome} - Carrinho</title> : null}
      </Helmet>

      {/* APPBAR COM BRANDING MOVYO */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background:
            "linear-gradient(90deg, #ff4b8b 0%, #ff7a3d 45%, #ffb347 100%)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/pedido")}
            sx={{ textTransform: "none" }}
          >
            Voltar
          </Button>

          {restaurante && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                src={restaurante.logoUrl || FALLBACK_IMG}
                alt={restaurante.nome}
                sx={{ width: 36, height: 36, bgcolor: "#fff" }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  noWrap
                  sx={{ color: "#fff" }}
                >
                  {restaurante.nome}
                </Typography>
                {restaurante.enderecoBairro && (
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {restaurante.enderecoBairro} •{" "}
                    {restaurante.enderecoCidade || ""}
                  </Typography>
                )}
              </Box>
              <Chip
                size="small"
                label={abertoAgora ? "Aberto agora" : "Fechado agora"}
                color={abertoAgora ? "success" : "error"}
                sx={{
                  ml: 1,
                  height: 22,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* CONTEÚDO */}
      <Box flex={1} overflow="auto" px={2} pt={2} pb={10}>
        {!abertoAgora && itensCarrinho.length > 0 && (
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            Restaurante fechado no momento. Você poderá finalizar o pedido assim
            que reabrir.
          </Alert>
        )}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="baseline"
          mb={1}
        >
          <Typography variant="h5" fontWeight="bold">
            Meu Carrinho
          </Typography>
          {itensCarrinho.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {totalItens} item{totalItens !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {itensCarrinho.length === 0 ? (
          <Box
            mt={4}
            textAlign="center"
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={1}
          >
            <Avatar
              src={FALLBACK_IMG}
              sx={{ width: 72, height: 72, mb: 1 }}
            />
            <Typography variant="subtitle1" fontWeight="600">
              Seu carrinho está vazio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Volte ao cardápio e escolha seus itens favoritos.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2, textTransform: "none" }}
              onClick={() => navigate("/pedido")}
            >
              Ver cardápio
            </Button>
          </Box>
        ) : (
          itensCarrinho.map((item, idx) => (
            <Fade in key={idx} timeout={300}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  display: "flex",
                  gap: 2,
                  borderRadius: 3,
                  bgcolor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  boxShadow: "0px 2px 6px rgba(15,23,42,0.06)",
                }}
              >
                <Avatar
                  src={item.imagem || FALLBACK_IMG}
                  alt={item.nome}
                  variant="rounded"
                  sx={{ width: 68, height: 68, flexShrink: 0 }}
                />

                <Box flex={1} minWidth={0}>
                  <Typography fontWeight="bold" noWrap>
                    {item.nome}
                  </Typography>

                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    mt={0.5}
                    flexWrap="wrap"
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => alterarQuantidade(idx, -1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2">
                        {item.quantidade}x
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => alterarQuantidade(idx, 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      R$ {item.precoUnitario.toFixed(2)} cada
                    </Typography>
                  </Box>

                  {renderExtras(item)}

                  <Box
                    mt={1}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color="primary"
                    >
                      Total do item: R$ {item.precoTotal.toFixed(2)}
                    </Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => removerItem(idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          ))
        )}
      </Box>

      {/* RODAPÉ FIXO COM TOTAL E CTA */}
      {itensCarrinho.length > 0 && (
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bgcolor="#ffffff"
          borderTop="1px solid #e0e0e0"
          px={2}
          py={1.5}
          boxShadow={3}
          zIndex={1200}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Total do pedido
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                R$ {total.toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleFinalizarPedido}
              sx={{
                flex: 1,
                textTransform: "none",
                fontWeight: 700,
                background:
                  "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                "&:hover": {
                  opacity: 0.9,
                  background:
                    "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                },
                ...(abertoAgora
                  ? {}
                  : {
                      opacity: 0.75,
                    }),
              }}
            >
              {abertoAgora
                ? "Finalizar pedido"
                : "Restaurante fechado — avisar"}
            </Button>
          </Box>
        </Box>
      )}

      {/* Snackbar quando tenta finalizar com restaurante fechado */}
      <Snackbar
        open={avisoOpen}
        autoHideDuration={3500}
        onClose={() => setAvisoOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAvisoOpen(false)}
          severity="warning"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Restaurante fechado no momento. Pedidos só podem ser finalizados no
          horário de funcionamento.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Carrinho;
