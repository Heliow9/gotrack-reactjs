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
  Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const Carrinho = () => {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [restaurante, setRestaurante] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dados = localStorage.getItem("carrinho");
    if (dados) {
      setItensCarrinho(JSON.parse(dados));
    }
    const restauranteData = localStorage.getItem("restauranteSelecionado");
    if (restauranteData) {
      setRestaurante(JSON.parse(restauranteData));
    }
  }, []);

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

  const calcularTotal = () => {
    return itensCarrinho.reduce((total, item) => total + item.precoTotal, 0);
  };

  const renderExtras = (item) => {
    const blocos = [];

    // Sabores
    if (item.saboresSelecionados?.length > 0) {
      blocos.push({
        titulo: "Sabores",
        opcoes: item.saboresSelecionados.map((s) => `• ${s}`)
      });
    }

    // Borda
    if (item.bordaSelecionada) {
      blocos.push({
        titulo: "Borda",
        opcoes: [`• ${item.bordaSelecionada.nome} (+R$ ${item.bordaSelecionada.preco.toFixed(2)})`]
      });
    }

    // Adicional
    if (item.adicionalSelecionado) {
      blocos.push({
        titulo: "Adicional",
        opcoes: [`• ${item.adicionalSelecionado.nome} (+R$ ${item.adicionalSelecionado.preco.toFixed(2)})`]
      });
    }

    // Complementos
    if (item.complementosSelecionados?.length > 0) {
      const opcoes = item.complementosSelecionados.map((comp) =>
        `• ${comp.nome} (+R$ ${comp.preco.toFixed(2)})`
      );
      blocos.push({ titulo: "Complementos", opcoes });
    }

    // tiposExtras agrupados
    if (item.tiposExtrasSelecionados && typeof item.tiposExtrasSelecionados === "object") {
      Object.entries(item.tiposExtrasSelecionados).forEach(([tipo, opcoes]) => {
        if (Array.isArray(opcoes) && opcoes.length > 0) {
          blocos.push({
            titulo: tipo,
            opcoes: opcoes.map((op) =>
              `• ${op.nome}${op.preco ? ` (+R$ ${op.preco.toFixed(2)})` : ""}`
            )
          });
        }
      });
    }

    // Observação
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
      <AppBar position="sticky" color="success" elevation={1}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={() => navigate("/pedido")}>Voltar</Button>
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
                <Typography variant="caption" color="text.secondary">
                  {restaurante.enderecoRua}, {restaurante.enderecoNumero} - {restaurante.enderecoBairro}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {restaurante.horarioInicio}:00 às {restaurante.horarioFim}:00
                </Typography>
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box flex={1} overflow="auto" px={2} pt={3} pb={8}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Meu Carrinho
        </Typography>

        {itensCarrinho.length === 0 ? (
          <Typography variant="body1">Seu carrinho está vazio.</Typography>
        ) : (
          <>
            {itensCarrinho.map((item, idx) => (
              <Fade in direction="up" key={idx} timeout={830}>
                <Paper
                  elevation={3}
                  sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}
                >
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
                      Object.entries(item.tiposExtrasSelecionados).map(([tipo, opcoes]) => (
                        opcoes.map((op, idx) => (
                          op.preco > 0 && (
                            <Typography key={`${tipo}-${idx}`} variant="body2" color="text.secondary" ml={2}>
                              • {tipo}: {op.nome} (+R$ {op.preco.toFixed(2)})
                            </Typography>
                          )
                        ))
                      ))
                    }

                    <Typography variant="body2" fontWeight="bold" mt={1}>
                      Total do item: R$ {(item.precoTotal).toFixed(2)}
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Total: R$ {calcularTotal().toFixed(2)}
            </Typography>
            <Button variant="contained" color="primary" size="large" onClick={() => navigate("/checkout")}>
              Finalizar Pedido
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Carrinho;