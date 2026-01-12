// src/pages/Publico.jsx
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
  Fade,
  Container,
  Divider,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Badge,
  Stack,
  Skeleton,
} from "@mui/material";
import { Helmet } from "react-helmet";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import ModalProduto from "../components/ModalProduto";
import axios from "axios";

const DEFAULT_IMAGE_URL =
  "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

const API_URL = "https://api.movyo.delivery/api";

/**
 * Calcula status "Aberto" / "Fechado"
 * com suporte a horários que viram madrugada (ex: 18:00 -> 02:00).
 */
function calcularStatusLoja(rest) {
  const dias = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];
  const hoje = new Date();
  const diaAtual = dias[hoje.getDay()];
  const horarioHoje = rest?.horariosFuncionamento?.[diaAtual];

  if (!horarioHoje || horarioHoje.fechado) return "Fechado";

  const [abreHora, abreMin] = (horarioHoje.abre || "00:00")
    .split(":")
    .map(Number);
  const [fechaHora, fechaMin] = (horarioHoje.fecha || "00:00")
    .split(":")
    .map(Number);

  const agora = new Date();

  const horarioAbre = new Date(agora);
  horarioAbre.setHours(abreHora, abreMin, 0, 0);

  const horarioFecha = new Date(agora);
  horarioFecha.setHours(fechaHora, fechaMin, 0, 0);

  // Fecha após meia-noite (ex: 18:00 -> 02:00)
  if (horarioFecha <= horarioAbre) {
    horarioFecha.setDate(horarioFecha.getDate() + 1);

    // Se agora é depois da meia-noite e ainda antes do fecha,
    // então o horário de abertura foi "ontem"
    if (agora < horarioAbre) {
      horarioAbre.setDate(horarioAbre.getDate() - 1);
    }
  }

  return agora >= horarioAbre && agora < horarioFecha ? "Aberto" : "Fechado";
}

/**
 * ✅ Normaliza SEMPRE para "objeto restaurante puro"
 * (para não quebrar checkout e demais páginas).
 */
function normalizarRestaurante(qualquerCoisa) {
  if (!qualquerCoisa) return null;

  // se vier { restaurante: {...} }
  if (qualquerCoisa.restaurante && typeof qualquerCoisa.restaurante === "object") {
    return qualquerCoisa.restaurante;
  }

  // se vier o restaurante direto
  return qualquerCoisa;
}

const Publico = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [restaurante, setRestaurante] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const sectionRefs = useRef([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(0);
  const [statusLoja, setStatusLoja] = useState("Carregando...");
  const [avisoFechadoOpen, setAvisoFechadoOpen] = useState(false);
  const [avisoMensagem, setAvisoMensagem] = useState("");
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [bottomValue, setBottomValue] = useState(0);

  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -180, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 180, behavior: "smooth" });
    }
  };

  // atualiza quantidade do carrinho
  useEffect(() => {
    const atualizarQuantidade = () => {
      const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
      const total = carrinho.reduce(
        (acc, item) => acc + (item.quantidade || 0),
        0
      );
      setQuantidadeCarrinho(total);
    };

    atualizarQuantidade();
    const intervalo = setInterval(atualizarQuantidade, 1000);
    return () => clearInterval(intervalo);
  }, []);

  // ✅ Carrega restaurante + produtos (sempre revalidando na API)
  useEffect(() => {
    const restauranteData = localStorage.getItem("restauranteSelecionado");

    // Sem LS e sem slug na rota, não dá pra identificar a loja
    if (!restauranteData && !slug) {
      navigate("/erro", { replace: true });
      return;
    }

    const restauranteLSRaw = restauranteData ? JSON.parse(restauranteData) : null;
    const restauranteLS = normalizarRestaurante(restauranteLSRaw);

    // slug efetivo: rota > LS.slugIdentificador > LS.slug
    const slugEfetivo =
      slug ||
      restauranteLS?.slugIdentificador ||
      restauranteLS?.slug ||
      null;

    if (!slugEfetivo) {
      navigate("/erro", { replace: true });
      return;
    }

    // Render rápido com LS (se existir), mas não confia nele pra sempre
    if (restauranteLS) {
      setRestaurante(restauranteLS);
      setStatusLoja(calcularStatusLoja(restauranteLS));
    } else {
      setStatusLoja("Carregando...");
    }

    const fetchTudo = async () => {
      try {
        setLoadingProdutos(true);

        const res = await axios.get(`${API_URL}/restaurantes/${slugEfetivo}`);

        // ✅ restaurante puro
        const restauranteFresh = normalizarRestaurante(res.data);

        if (!restauranteFresh) {
          navigate("/erro", { replace: true });
          return;
        }

        // ✅ produtos podem vir fora do restaurante
        const produtosPorCategoria =
          res.data?.produtosPorCategoria ||
          restauranteFresh?.produtosPorCategoria ||
          [];

        // ✅ MUITO IMPORTANTE:
        // salvar SEMPRE o restaurante puro no localStorage
        localStorage.setItem(
          "restauranteSelecionado",
          JSON.stringify(restauranteFresh)
        );

        // atualiza restaurante/status
        setRestaurante(restauranteFresh);
        setStatusLoja(calcularStatusLoja(restauranteFresh));

        // 1) categorias ativas
        const categoriasBase = (produtosPorCategoria || []).filter(
          (cat) => cat.ativa !== false
        );

        // 2) filtra itens ativos e ordena
        const categoriasComItensFiltrados = categoriasBase.map((cat) => ({
          ...cat,
          itens: (cat.itens || [])
            .filter((prod) => prod.ativo !== false)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
        }));

        // 3) remove categorias que ficaram sem itens
        const categoriasComProdutos = categoriasComItensFiltrados.filter(
          (cat) => cat.itens && cat.itens.length > 0
        );

        setProdutos(categoriasComProdutos);
      } catch (err) {
        console.error("Erro ao buscar produtos/restaurante:", err);
        navigate("/erro", { replace: true });
      } finally {
        setLoadingProdutos(false);
      }
    };

    fetchTudo();
  }, [navigate, slug]);

  const renderAvatar = (size = 40) => {
    if (restaurante?.logoUrl) {
      return (
        <Avatar
          src={restaurante.logoUrl}
          sx={{ width: size, height: size, bgcolor: "#fff" }}
        />
      );
    } else if (restaurante?.nome) {
      const initials = restaurante.nome
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return (
        <Avatar sx={{ width: size, height: size }}>
          {initials || "R"}
        </Avatar>
      );
    }
    return (
      <Avatar
        src={DEFAULT_IMAGE_URL}
        sx={{ width: size, height: size, bgcolor: "#fff" }}
      />
    );
  };

  const scrollToSection = (index) => {
    const ref = sectionRefs.current[index];
    if (ref) {
      const offsetTop = ref.offsetTop;
      const headerOffset = 120; // AppBar + barra de categorias
      window.scrollTo({ top: offsetTop - headerOffset, behavior: "smooth" });
    }
  };

  const abrirModalProduto = (item, categoriaType) => {
    if (statusLoja !== "Aberto") {
      setAvisoMensagem(
        "Restaurante fechado no momento. Não é possível adicionar itens ao carrinho."
      );
      setAvisoFechadoOpen(true);
      return;
    }

    const tiposExtrasCorrigidos = (item.tiposExtras || []).map((extra) => ({
      ...extra,
      itens: item.extras?.[extra.nome] || [],
    }));

    setProdutoSelecionado({
      ...item,
      precoBase: item.precoBase,
      categoriaType,
      saboresDisponiveis: item.sabores || [],
      bordasDisponiveis: item.bordas || [],
      complementos: item.complementos || [],
      adicionais: item.adicionais || [],
      tiposExtras: tiposExtrasCorrigidos,
    });

    setModalAberto(true);
  };

  const lojaAberta = statusLoja === "Aberto";

  return (
    <Box
      sx={{
        pb: 10,
        backgroundColor: "#f5f5f7",
        minHeight: "100vh",
      }}
    >
      <Helmet>
        {restaurante ? (
          <title>{restaurante.nome} - Faça seu pedido</title>
        ) : (
          <title>Carregando loja...</title>
        )}
      </Helmet>

      {/* APPBAR COM BRANDING MOVYO (ROSA → LARANJA) */}
      <AppBar
        position="sticky"
        elevation={2}
        sx={{
          zIndex: 1201,
          background:
            "linear-gradient(90deg, #ff4b8b 0%, #ff7a3d 45%, #ffb347 100%)",
        }}
      >
        <Toolbar
          sx={{
            px: 2,
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {renderAvatar(36)}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                noWrap
                sx={{
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {restaurante?.nome || "Carregando..."}
              </Typography>
              {restaurante?.enderecoBairro && (
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                  noWrap
                >
                  {restaurante.enderecoBairro} •{" "}
                  {restaurante.enderecoCidade || ""}
                </Typography>
              )}
            </Box>
          </Box>

          <Chip
            icon={<AccessTimeIcon fontSize="small" />}
            label={statusLoja}
            size="small"
            sx={{
              bgcolor: lojaAberta ? "#2e7d32" : "#c62828",
              color: "#fff",
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#fff" },
              borderRadius: "999px",
            }}
          />
        </Toolbar>
      </AppBar>

      {/* BARRA DE CATEGORIAS */}
      <Box
        sx={{
          position: "sticky",
          top: 64,
          zIndex: 1100,
          backgroundColor: "#f5f5f7",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1,
            py: 1,
          }}
        >
          <IconButton onClick={scrollLeft} size="small">
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Box
            ref={scrollRef}
            sx={{
              overflowX: "auto",
              display: "flex",
              gap: 1,
              whiteSpace: "nowrap",
              flex: 1,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {produtos.map((categoria, i) => (
              <Button
                key={categoria._id || i}
                variant="outlined"
                size="small"
                onClick={() => scrollToSection(i)}
                title={categoria.nome}
                sx={{
                  borderRadius: "999px",
                  textTransform: "none",
                  px: 2,
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "0.78rem",
                  minHeight: "34px",
                  flexShrink: 0,
                  bgcolor: "#ffffff",
                  borderColor: "#ff7a3d33",
                  "&:hover": {
                    borderColor: "#ff7a3d",
                    backgroundColor: "#fff7f2",
                  },
                }}
              >
                {categoria.nome}
              </Button>
            ))}
          </Box>

          <IconButton onClick={scrollRight} size="small">
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* LISTA DE PRODUTOS – FULL WIDTH */}
      <Container sx={{ py: 2 }} disableGutters>
        {loadingProdutos ? (
          <>
            {[1, 2, 3].map((s) => (
              <Box key={s} sx={{ mb: 3, px: 2 }}>
                <Skeleton
                  variant="text"
                  width={160}
                  height={28}
                  sx={{ mb: 1 }}
                />
                <Divider sx={{ mb: 2 }} />
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    height={90}
                    sx={{ mb: 2, borderRadius: 2 }}
                  />
                ))}
              </Box>
            ))}
          </>
        ) : produtos.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              mt: 6,
              color: "text.secondary",
              px: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Nenhum produto disponível no momento
            </Typography>
            <Typography variant="body2">
              Volte mais tarde, o cardápio pode estar em atualização.
            </Typography>
          </Box>
        ) : (
          produtos.map((categoria, i) => (
            <Box
              key={categoria._id || i}
              ref={(el) => (sectionRefs.current[i] = el)}
              sx={{ mb: 4 }}
            >
              <Box sx={{ px: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 1, color: "#333" }}
                >
                  {categoria.nome}
                </Typography>
                {categoria.descricao && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {categoria.descricao}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ mb: 1 }} />

              {categoria.itens.map((item, index) => (
                <Box key={item._id || index} sx={{ mb: 1 }}>
                  <Fade in timeout={400}>
                    <Paper
                      elevation={0}
                      onClick={() =>
                        abrirModalProduto(item, categoria.tipo || "simple_item")
                      }
                      aria-disabled={!lojaAberta}
                      sx={{
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: "space-between",
                        p: 2,
                        cursor: "pointer",
                        borderRadius: 0,
                        bgcolor: "white",
                        borderBottom: "1px solid #eeeeee",
                        boxShadow: "none",
                        "&:last-of-type": {
                          borderBottom: "none",
                        },
                        "&:hover": {
                          backgroundColor: "#fafafa",
                        },
                        ...(lojaAberta
                          ? {}
                          : { opacity: 0.75, cursor: "not-allowed" }),
                      }}
                    >
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{ mb: 0.5 }}
                        >
                          {item.nome}
                        </Typography>

                        {item.descricao && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.descricao}
                          </Typography>
                        )}

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            variant="body2"
                            color="primary"
                            fontWeight="bold"
                          >
                            {item.categoriaType === "pizza" &&
                            item.sabores?.length > 1
                              ? `a partir de R$ ${Math.min(
                                  ...item.sabores.map((s) =>
                                    parseFloat(s.preco || 0)
                                  )
                                ).toFixed(2)}`
                              : `R$ ${parseFloat(item.precoBase || 0).toFixed(
                                  2
                                )}`}
                          </Typography>

                          {item.tag && (
                            <Chip
                              label={item.tag}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          width: 90,
                          height: 90,
                          ml: 1.5,
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        <Avatar
                          src={item.imagem || DEFAULT_IMAGE_URL}
                          alt={item.nome}
                          variant="rounded"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 2,
                          }}
                        />

                        {!lojaAberta && (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              bgcolor: "rgba(0,0,0,0.35)",
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "#fff", fontWeight: 600 }}
                            >
                              Fechado
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Fade>
                </Box>
              ))}
            </Box>
          ))
        )}
      </Container>

      {/* Modal do produto */}
      {produtoSelecionado && (
        <ModalProduto
          open={modalAberto}
          onClose={() => setModalAberto(false)}
          produto={produtoSelecionado}
        />
      )}

      {/* Navegação inferior */}
      <Paper
        elevation={10}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <BottomNavigation
          showLabels
          value={bottomValue}
          onChange={(_, newValue) => setBottomValue(newValue)}
        >
          <BottomNavigationAction
            label="Início"
            icon={<HomeIcon />}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
          <BottomNavigationAction
            label="Pedidos"
            icon={<ListAltIcon />}
            onClick={() => navigate("/meus-pedidos")}
          />
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

      {/* Snackbar de aviso de loja fechada */}
      <Snackbar
        open={avisoFechadoOpen}
        autoHideDuration={4000}
        onClose={() => setAvisoFechadoOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAvisoFechadoOpen(false)}
          severity="warning"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {avisoMensagem || "Restaurante fechado no momento."}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Publico;
