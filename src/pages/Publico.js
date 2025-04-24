import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Container,
  Box,
  Button,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ListAltIcon from "@mui/icons-material/ListAlt";



const produtosMock = [
  {
    categoria: "Pizzas",
    itens: [
      {
        nome: "Pizza Grande Premium",
        descricao: "Pizza com até 2 sabores e 8 fatias",
        preco: 55.9,
        imagem: "https://cdn-icons-png.flaticon.com/512/1404/1404945.png",
      },
      {
        nome: "Pizza Média Tradicional",
        descricao: "Pizza com 1 sabor, 6 fatias",
        preco: 42.9,
        imagem: "https://cdn-icons-png.flaticon.com/512/1404/1404944.png",
      },
      {
        nome: "Pizza Broto",
        descricao: "Ideal para 1 pessoa, 4 fatias",
        preco: 29.9,
        imagem: "https://cdn-icons-png.flaticon.com/512/1404/1404943.png",
      },
    ],
  },
  {
    categoria: "Coxinhas",
    itens: [
      {
        nome: "Coxinha de frango",
        descricao: "massa de macaxeira, frango desfiado",
        preco: 7,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046875.png",
      },
      {
        nome: "Coxinha de charque",
        descricao: "massa de macaxeira, charque desfiado",
        preco: 8,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046876.png",
      },
      {
        nome: "Coxinha de queijo",
        descricao: "massa crocante, recheio de queijo coalho",
        preco: 7.5,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046880.png",
      },
    ],
  },
  {
    categoria: "Pastéis",
    itens: [
      {
        nome: "Pastel de queijo",
        descricao: "massa crocante com recheio de queijo",
        preco: 10,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046881.png",
      },
      {
        nome: "Pastel de carne",
        descricao: "massa crocante com carne moída temperada",
        preco: 10.5,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046882.png",
      },
    ],
  },
  {
    categoria: "Bebidas",
    itens: [
      {
        nome: "Coca-Cola Lata",
        descricao: "350ml gelada",
        preco: 5.5,
        imagem: "https://cdn-icons-png.flaticon.com/512/2674/2674715.png",
      },
      {
        nome: "Guaraná Antarctica Lata",
        descricao: "350ml gelada",
        preco: 5,
        imagem: "https://cdn-icons-png.flaticon.com/512/3182/3182683.png",
      },
      {
        nome: "Água Mineral",
        descricao: "500ml sem gás",
        preco: 3,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046873.png",
      },
    ],
  },
  {
    categoria: "Sobremesas",
    itens: [
      {
        nome: "Brownie com Sorvete",
        descricao: "Brownie artesanal com bola de sorvete de creme",
        preco: 14.9,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046877.png",
      },
      {
        nome: "Açaí Tradicional",
        descricao: "Açaí 300ml com granola",
        preco: 10,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046884.png",
      },
    ],
  },
  {
    categoria: "Hambúrgueres",
    itens: [
      {
        nome: "X-Burguer",
        descricao: "Pão, hambúrguer e queijo",
        preco: 12,
        imagem: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
      },
      {
        nome: "X-Bacon",
        descricao: "Pão, hambúrguer, bacon e queijo",
        preco: 15,
        imagem: "https://cdn-icons-png.flaticon.com/512/3075/3075978.png",
      },
      {
        nome: "X-Tudo",
        descricao: "Burguer completo com tudo que tem direito",
        preco: 18,
        imagem: "https://cdn-icons-png.flaticon.com/512/1046/1046895.png",
      },
    ],
  },
];


const Publico = () => {
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("restauranteSelecionado");
    if (saved) {
      setRestaurante(JSON.parse(saved));
    } else {
      navigate("/erro");
    }
  }, [navigate]);

  const renderAvatar = () => {
    if (restaurante?.logoUrl) {
      return <Avatar src={restaurante.logoUrl} sx={{ width: 40, height: 40 }} />;
    } else if (restaurante?.nome) {
      const initials = restaurante.nome.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
      return <Avatar>{initials}</Avatar>;
    }
    return null;
  };

// Só a parte da vitrine foi atualizada. Substitua seu return por isso:

return (
  <Box sx={{ pb: 10, backgroundColor: "#fff" }}>
    {/* Top AppBar */}
    <AppBar position="static" color="success" sx={{ borderRadius: 0 }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center" gap={2}>
          {renderAvatar()}
          <Typography variant="h6" fontWeight="bold">
            {restaurante?.nome || "Carregando..."}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>

    {/* Scroll horizontal de categorias */}
    <Box sx={{ overflowX: "auto", px: 2, py: 1, display: "flex", gap: 1, borderBottom: "1px solid #eee" }}>
      {produtosMock.map((categoria, i) => (
        <Button
          key={i}
          variant="outlined"
          size="small"
          sx={{
            flexShrink: 0,
            borderRadius: "20px",
            textTransform: "none",
            whiteSpace: "nowrap",
            px: 2,
            borderColor: "#ccc",
            color: "#333",
            fontWeight: "bold",
            backgroundColor: "#f9f9f9",
            ":hover": { backgroundColor: "#e0ffe0" },
          }}
        >
          {categoria.categoria}
        </Button>
      ))}
    </Box>

    {/* Produtos por categoria */}
    <Container sx={{ pt: 2 }}>
      {produtosMock.map((categoria, i) => (
        <Box key={i} sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            {categoria.categoria}
          </Typography>
          {categoria.itens.map((item, index) => (
            <Paper
              key={index}
              elevation={1}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                mb: 2,
                borderRadius: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {item.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.descricao}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                  R$ {item.preco.toFixed(2)}
                </Typography>
              </Box>
              {item.imagem && (
                <Box
                  component="img"
                  src={item.imagem}
                  alt={item.nome}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 2,
                    ml: 2,
                  }}
                />
              )}
            </Paper>
          ))}
        </Box>
      ))}
    </Container>

    {/* Bottom Navigation */}
    <Paper
      elevation={10}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: "1px solid #ccc",
      }}
    >
      <BottomNavigation showLabels>
        <BottomNavigationAction label="Início" icon={<HomeIcon />} />
        <BottomNavigationAction label="Pedidos" icon={<ListAltIcon />} />
        <BottomNavigationAction label="Carrinho" icon={<ShoppingCartIcon />} />
      </BottomNavigation>
    </Paper>
  </Box>
);

};

export default Publico;
