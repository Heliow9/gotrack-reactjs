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
  Slide,
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
  const chips = [];

  // Sabores (continua como array de string)
  if (item.saboresSelecionados?.length > 0) {
    chips.push(`Sabores: ${item.saboresSelecionados.join(" / ")}`);
  }

  // Borda (agora é objeto)
  if (item.bordaSelecionada) {
    chips.push(`Borda: ${item.bordaSelecionada.nome} (+R$ ${item.bordaSelecionada.preco.toFixed(2)})`);
  }

  // Adicional (agora é objeto)
  if (item.adicionalSelecionado) {
    chips.push(`Adicional: ${item.adicionalSelecionado.nome} (+R$ ${item.adicionalSelecionado.preco.toFixed(2)})`);
  }

  // Complementos (agora é array de objetos)
  if (item.complementosSelecionados?.length > 0) {
    item.complementosSelecionados.forEach((comp) => {
      chips.push(`Comp: ${comp.nome} (+R$ ${comp.preco.toFixed(2)})`);
    });
  }

  // Observação
  if (item.observacao) {
    chips.push(`Obs: ${item.observacao}`);
  }

  return (
    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
      {chips.map((text, i) => (
        <Chip key={i} label={text} size="small" color="default" />
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
              <Slide in direction="up" key={idx} timeout={300}>
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
                      Total: R$ {item.precoTotal.toFixed(2)}
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
              </Slide>
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