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
  Divider,
  IconButton
} from "@mui/material";
import { Helmet } from "react-helmet";
import HomeIcon from "@mui/icons-material/Home";
import Badge from "@mui/material/Badge";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ModalProduto from "../components/ModalProduto";
import axios from "axios";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Chip } from '@mui/material';


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
  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(0);
  const [statusLoja, setStatusLoja] = useState("Carregando...");
  const [corStatus, setCorStatus] = useState("default");



  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -150, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 150, behavior: 'smooth' });
  };


  useEffect(() => {
    const atualizarQuantidade = () => {
      const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
      const total = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
      setQuantidadeCarrinho(total);
    };

    atualizarQuantidade();
    const intervalo = setInterval(atualizarQuantidade, 1000); // atualiza a cada segundo

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const restauranteData = localStorage.getItem("restauranteSelecionado");
    if (!restauranteData) return navigate("/erro");
    const restaurante = JSON.parse(restauranteData);
    setRestaurante(restaurante);
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const hoje = new Date();
    const diaAtual = dias[hoje.getDay()];
    const horarioHoje = restaurante.horariosFuncionamento?.[diaAtual];

    if (!horarioHoje || horarioHoje.fechado) {
      setStatusLoja("Fechado");
    } else {
      const [abreHora, abreMin] = horarioHoje.abre.split(":").map(Number);
      const [fechaHora, fechaMin] = horarioHoje.fecha.split(":").map(Number);

      const agora = new Date();
      const horarioAbre = new Date(agora);
      horarioAbre.setHours(abreHora, abreMin, 0, 0);

      const horarioFecha = new Date(agora);
      horarioFecha.setHours(fechaHora, fechaMin, 0, 0);

      if (agora < horarioAbre || agora >= horarioFecha) {
        setStatusLoja("Fechado");
      } else {
        setStatusLoja("Aberto");
      }
    }



    const fetchProdutos = async () => {
      try {
        const res = await axios.get(`${API_URL}/publico/${restaurante.slugIdentificador}`);

        const categoriasFiltradas = (res.data.produtosPorCategoria || [])
          .filter(cat => cat.ativa !== false) // só categorias ativas
          .map(cat => ({
            ...cat,
            itens: (cat.itens || [])
              .filter(prod => prod.ativo !== false) // só produtos ativos
              .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
          }));

        setProdutos(categoriasFiltradas);
        console.log(categoriasFiltradas)
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
    // Corrige os tiposExtras com os itens preenchidos (vindos de item.extras)
    const tiposExtrasCorrigidos = (item.tiposExtras || []).map(extra => ({
      ...extra,
      itens: item.extras?.[extra.nome] || []
    }));

    setProdutoSelecionado({
      ...item,
      precoBase: item.precoBase,
      categoriaType,
      saboresDisponiveis: item.sabores || [],
      bordasDisponiveis: item.bordas || [],
      complementos: item.complementos || [],
      adicionais: item.adicionais || [],
      tiposExtras: tiposExtrasCorrigidos
    });

    setModalAberto(true);
  };





  return (

    <Box sx={{ pb: 10, backgroundColor: "#f7f7f7", minHeight: '100vh' }}>
      <Helmet>
        {
          restaurante ? <title>{restaurante.nome} - Pedido</title> : null
        }
      </Helmet>
      <AppBar position="sticky" color="success" sx={{ zIndex: 1201 }}>
        <Toolbar sx={{ px: 2, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
            {renderAvatar()}
            <Typography
              variant="h6"
              fontWeight="bold"
              noWrap
              sx={{ color: 'white', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {restaurante?.nome || "Carregando..."}
            </Typography>
          </Box>

          <Chip
            icon={
              <AccessTimeIcon
                sx={{ color: statusLoja === "Aberto" ? "#fff" : "#fff" }}
                fontSize="small"
              />
            }
            label={statusLoja}
            size="small"
            sx={{
              bgcolor: statusLoja === "Aberto" ? "#4CAF50" : "#f44336",
              color: "#fff",
              fontWeight: 500,
              height: 28,
              '& .MuiChip-icon': {
                color: "#fff"
              },
            }}
          />

        </Toolbar>

      </AppBar>

      <Box
        sx={{
          position: 'sticky',
          top: 64,
          zIndex: 1100,
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 1,
        }}
      >
        {/* Seta esquerda */}
        <IconButton onClick={scrollLeft} size="small">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        {/* Lista rolável */}
        <Box
          ref={scrollRef}
          sx={{
            overflowX: 'auto',
            display: 'flex',
            gap: 1,
            whiteSpace: 'nowrap',
            flex: 1,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {produtos.map((categoria, i) => (
            <Button
              key={i}
              variant="outlined"
              size="small"
              onClick={() => scrollToSection(i)}
              title={categoria.nome}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                px: 2,
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                wordBreak: "keep-all",
                fontSize: "0.75rem",
                minHeight: "36px",
                flexShrink: 0,
              }}
            >
              {categoria.nome}
            </Button>
          ))}
        </Box>

        {/* Seta direita */}
        <IconButton onClick={scrollRight} size="small">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
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
                <Grid item xs={12} key={index} style={{ width: '100%' }}>
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
                          {item.categoriaType === "pizza" && item.sabores?.length > 1
                            ? `a partir de R$ ${Math.min(...item.sabores.map(s => parseFloat(s.preco || 0))).toFixed(2)}`
                            : `R$ ${parseFloat(item.precoBase || 0).toFixed(2)}`
                          }
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
          <BottomNavigationAction label="Pedidos" icon={<ListAltIcon />}
            onClick={() => navigate("/meus-pedidos")} />
          <BottomNavigationAction
            label="Carrinho"
            icon={
              <Badge badgeContent={quantidadeCarrinho} color="error">
                <ShoppingCartIcon />
              </Badge>
            }
            onClick={() => navigate("/carrinho")}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Publico;
