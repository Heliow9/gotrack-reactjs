import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Button,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Grid,
  Fade,
  useScrollTrigger,
  Container,
  Divider
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ModalProduto from "../components/ModalProduto";
import axios from "axios";

const DEFAULT_IMAGE_URL = "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000";

const Publico = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [restaurante, setRestaurante] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const sectionRefs = useRef([]);
  const trigger = useScrollTrigger({ threshold: 0 });
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);



  useEffect(() => {
    const restauranteData = localStorage.getItem("restauranteSelecionado");
    if (!restauranteData) return navigate("/erro");
    const restaurante = JSON.parse(restauranteData);
    setRestaurante(restaurante);
  
    const fetchProdutos = async () => {
      try {
        const res = await axios.get(`${API_URL}/publico/${restaurante.slugIdentificador}`);
        setProdutos(res.data.produtosPorCategoria);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        navigate("/erro");
      }
    };
  
    fetchProdutos();
  }, []);
  



  const renderAvatar = () => {
    if (restaurante?.logoUrl) {
      return <Avatar src={restaurante.logoUrl} sx={{ width: 40, height: 40 }} />;
    } else if (restaurante?.nome) {
      const initials = restaurante.nome.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
      return <Avatar>{initials}</Avatar>;
    }
    return null;
  };

  const scrollToSection = (index) => {
    const ref = sectionRefs.current[index];
    if (ref) {
      const offsetTop = ref.offsetTop;
      const headerOffset = 135;
      window.scrollTo({ top: offsetTop - headerOffset, behavior: "smooth" });
    }
  };

  const abrirModalProduto = (item, categoriaType) => {
    setProdutoSelecionado({
      ...item,
      precoBase: item.precoBase,
      categoriaType,
      saboresDisponiveis: item.sabores || [],
      bordasDisponiveis: item.bordas || [],
      complementos: item.complementos || [],
      adicionais: item.adicionais || [],
    });
    setModalAberto(true);
  };

  return (
    <Box sx={{ pb: 10, backgroundColor: "#f7f7f7", minHeight: '100vh' }}>
      <AppBar position="sticky" color="success" sx={{ zIndex: 1201 }}>
        <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            {renderAvatar()}
            <Typography variant="h6" fontWeight="bold">
              {restaurante?.nome || "Carregando..."}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ position: 'sticky', top: 64, zIndex: 1100, backgroundColor: '#fff', borderBottom: '1px solid #ddd', px: 1, py: 1, overflowX: 'auto', display: 'flex', gap: 1 }}>
        {produtos.map((categoria, i) => (
          <Button
            key={i}
            variant="outlined"
            size="small"
            onClick={() => scrollToSection(i)}
            sx={{ borderRadius: "20px", textTransform: "none", px: 2, whiteSpace: "nowrap" }}
          >
            {categoria.nome}
          </Button>
        ))}
      </Box>

      <Container sx={{ py: 2 }}>
        {produtos.map((categoria, i) => (
          <Box key={i} ref={el => sectionRefs.current[i] = el} sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#333' }}>
              {categoria.nome}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} alignItems="stretch">
              {categoria.itens.map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Fade in timeout={500}>
                    <Paper elevation={2}
                      onClick={() => abrirModalProduto(item, categoria.tipo || 'simple_item')}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: 2,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        '&:hover': { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.descricao}
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                          R$ {parseFloat(item.precoBase).toFixed(2)}
                        </Typography>
                      </Box>
                      <Avatar
                        src={item.imagem || DEFAULT_IMAGE_URL}
                        alt={item.nome}
                        variant="rounded"
                        sx={{ width: 72, height: 72, objectFit: "contain", ml: 2 }}
                      />
                    </Paper>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Container>

      {produtoSelecionado && (
        <ModalProduto open={modalAberto} onClose={() => setModalAberto(false)} produto={produtoSelecionado} />
      )}

      <Paper elevation={10} sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
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
