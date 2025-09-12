// pages/Carrinho.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Avatar,
  Container,
  Paper,
  AppBar,
  Toolbar,
  Fade,
  Chip,
  Snackbar,
  Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const Carrinho = () => {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [restaurante, setRestaurante] = useState(null);
  const [abertoAgora, setAbertoAgora] = useState(false);
  const [avisoOpen, setAvisoOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dados = localStorage.getItem("carrinho");
    if (dados) setItensCarrinho(JSON.parse(dados));

    const restauranteData = localStorage.getItem("restauranteSelecionado");
    if (restauranteData) setRestaurante(JSON.parse(restauranteData));
  }, []);

  useEffect(() => {
    // recalcula status periodicamente enquanto estiver na página
    const update = () => setAbertoAgora(estaAbertoAgora());
    update();
    const id = setInterval(update, 30_000); // a cada 30s
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
    const novaQtd = novosItens[index].quantidade + delta;
    if (novaQtd >= 1) {
      const precoUnitario = novosItens[index].precoTotal / novosItens[index].quantidade;
      novosItens[index].quantidade = novaQtd;
      novosItens[index].precoTotal = precoUnitario * novaQtd;
      atualizarCarrinho(novosItens);
    }
  };

  const estaAbertoAgora = () => {
    if (!restaurante?.horariosFuncionamento) return false;

    const diasSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const hoje = diasSemana[new Date().getDay()];
    const horario = restaurante.horariosFuncionamento[hoje];

    if (!horario || horario.fechado || !horario.abre || !horario.fecha) return false;

    const agora = new Date();
    const [hAbre, mAbre] = horario.abre.split(":").map(Number);
    const [hFecha, mFecha] = horario.fecha.split(":").map(Number);

    const horarioAbre = new Date(agora);
    horarioAbre.setHours(hAbre, mAbre, 0, 0);

    const horarioFecha = new Date(agora);
    horarioFecha.setHours(hFecha, mFecha, 0, 0);

    // Mesmo critério do Publico.jsx: fechamento é exclusivo (>= fecha = fechado)
    return agora >= horarioAbre && agora < horarioFecha;
  };

  const calcularTotal = () => {
    return itensCarrinho.reduce((total, item) => total + item.precoTotal, 0);
  };

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
      blocos.push({ titulo: "Sabores", opcoes: item.saboresSelecionados.map((s) => `• ${s}`) });
    }

    if (item.bordaSelecionada) {
      blocos.push({
        titulo: "Borda",
        opcoes: [`• ${item.bordaSelecionada.nome} (+R$ ${item.bordaSelecionada.preco.toFixed(2)})`]
      });
    }

    if (item.adicionalSelecionado) {
      blocos.push({
        titulo: "Adicional",
        opcoes: [`• ${item.adicionalSelecionado.nome} (+R$ ${item.adicionalSelecionado.preco.toFixed(2)})`]
      });
    }

    if (item.complementosSelecionados?.length > 0) {
      const opcoes = item.complementosSelecionados.map((comp) => `• ${comp.nome} (+R$ ${comp.preco.toFixed(2)})`);
      blocos.push({ titulo: "Complementos", opcoes });
    }

    if (item.tiposExtrasSelecionados && typeof item.tiposExtrasSelecionados === "object") {
      Object.entries(item.tiposExtrasSelecionados).forEach(([tipo, opcoes]) => {
        if (Array.isArray(opcoes) && opcoes.length > 0) {
          blocos.push({
            titulo: tipo,
            opcoes: opcoes.map((op) => `• ${op.nome}${op.preco ? ` (+R$ ${op.preco.toFixed(2)})` : ""}`)
          });
        }
      });
    }

    if (item.observacao) {
      blocos.push({ titulo: "Observação", opcoes: [`• ${item.observacao}`] });
    }

    return (
      <Box mt={1}>
        {blocos.map((bloco, idx) => (
          <Box key={idx} mb={1}>
            <Typography variant="caption" fontWeight="bold">{bloco.titulo}:</Typography>
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

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Helmet>
        {restaurante ? <title>{restaurante.nome} - Carrinho</title> : null}
      </Helmet>

      <AppBar position="sticky" color="success" elevation={1}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={() => navigate("/pedido")}>
            Voltar
          </Button>

          {restaurante && (
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={restaurante.logoUrl || "https://cdn-icons-png.flaticon.com/512/1404/1404945.png"}
                alt={restaurante.nome}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {restaurante.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {restaurante.enderecoRua}, {restaurante.enderecoNumero} - {restaurante.enderecoBairro}
                </Typography>
                <Chip
                  size="small"
                  label={abertoAgora ? "Aberto agora" : "Fechado agora"}
                  color={abertoAgora ? "success" : "error"}
                  sx={{ height: 22, mt: 0.5 }}
                />
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box flex={1} overflow="auto" px={2} pt={3} pb={8}>
        {!abertoAgora && itensCarrinho.length > 0 && (
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            Restaurante fechado no momento. Você poderá finalizar o pedido assim que reabrir.
          </Alert>
        )}

        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Meu Carrinho
        </Typography>

        {itensCarrinho.length === 0 ? (
          <Typography variant="body1">Seu carrinho está vazio.</Typography>
        ) : (
          <>
            {itensCarrinho.map((item, idx) => (
              <Fade in key={idx} timeout={830}>
                <Paper elevation={3} sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={item.imagem || "https://cdn-icons-png.flaticon.com/512/1404/1404945.png"}
                    alt={item.nome}
                    variant="rounded"
                    sx={{ width: 64, height: 64 }}
                  />
                  <Box flex={1}>
                    <Typography fontWeight="bold">{item.nome}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantidade: {item.quantidade}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      1x {item.nome} R$ {item.precoUnitario.toFixed(2)}
                    </Typography>

                    {item.tiposExtrasSelecionados &&
                      Object.entries(item.tiposExtrasSelecionados).map(([tipo, opcoes]) =>
                        opcoes.map((op, i2) =>
                          op.preco > 0 ? (
                            <Typography key={`${tipo}-${i2}`} variant="body2" color="text.secondary" ml={2}>
                              • {tipo}: {op.nome} (+R$ {op.preco.toFixed(2)})
                            </Typography>
                          ) : null
                        )
                      )}

                    <Typography variant="body2" fontWeight="bold" mt={1}>
                      Total do item: R$ {item.precoTotal.toFixed(2)}
                    </Typography>

                    {renderExtras(item)}

                    <Box display="flex" gap={1} mt={1}>
                      <Button size="small" variant="outlined" onClick={() => alterarQuantidade(idx, -1)}>-</Button>
                      <Button size="small" variant="outlined" onClick={() => alterarQuantidade(idx, 1)}>+</Button>
                      <IconButton color="error" onClick={() => removerItem(idx)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            ))}
          </>
        )}
      </Box>

      {itensCarrinho.length > 0 && (
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bgcolor="#fff"
          borderTop="1px solid #ddd"
          px={3}
          py={2}
          boxShadow={3}
          zIndex={1200}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="h6" fontWeight="bold">
              Total: R$ {calcularTotal().toFixed(2)}
            </Typography>

            {!abertoAgora && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Restaurante fechado — finalize quando reabrir.
              </Alert>
            )}

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleFinalizarPedido}
              aria-disabled={!abertoAgora}
              sx={{
                ...(abertoAgora ? {} : { opacity: 0.7, pointerEvents: "auto" }) // mantém clique para mostrar o aviso
              }}
            >
              Finalizar Pedido
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar
        open={avisoOpen}
        autoHideDuration={3500}
        onClose={() => setAvisoOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setAvisoOpen(false)} severity="warning" variant="filled" sx={{ width: "100%" }}>
          Restaurante fechado no momento. Pedidos só podem ser finalizados no horário de funcionamento.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Carrinho;
