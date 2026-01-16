// src/pages/Publico.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  TextField,
  InputAdornment,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { Helmet } from "react-helmet";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import StarIcon from "@mui/icons-material/Star";

import ModalProduto from "../components/ModalProduto";
import axios from "axios";

const DEFAULT_IMAGE_URL =
  "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

const API_URL = "http://localhost:10000/api";

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
    if (agora < horarioAbre) {
      horarioAbre.setDate(horarioAbre.getDate() - 1);
    }
  }

  return agora >= horarioAbre && agora < horarioFecha ? "Aberto" : "Fechado";
}

/**
 * ✅ Normaliza SEMPRE para "objeto restaurante puro"
 */
function normalizarRestaurante(qualquerCoisa) {
  if (!qualquerCoisa) return null;

  if (
    qualquerCoisa.restaurante &&
    typeof qualquerCoisa.restaurante === "object"
  ) {
    return qualquerCoisa.restaurante;
  }

  return qualquerCoisa;
}

function formatBRL(value) {
  const num = Number(value || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * ✅ Inferência robusta do tipo (evita quebrar quando categoria.tipo vem errado)
 */
function inferCategoriaType(categoria, item) {
  if (categoria?.pizzaMultisabor) return "pizza";
  if (item?.pizzaMultisabor) return "pizza";

  // Se a categoria permite sabores, muito provavelmente é pizza
  if (categoria?.permiteSabores) return "pizza";

  // Se o produto tem sabores cadastrados, é pizza (mesmo que categoria.tipo esteja errado)
  if ((item?.sabores || []).length > 0) return "pizza";

  // fallback legado
  return categoria?.tipo || "simple_item";
}

/**
 * ✅ Decide se deve mostrar "a partir de"
 */
function shouldShowAPartirDe({ categoria, item, categoriaType }) {
  const sabores = item?.sabores || [];
  const isPizza = categoriaType === "pizza";
  const isMulti =
    Boolean(categoria?.pizzaMultisabor) || Boolean(item?.pizzaMultisabor);
  return isPizza && (isMulti || sabores.length > 1);
}

const Publico = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [restaurante, setRestaurante] = useState(null);
  const [produtosRaw, setProdutosRaw] = useState([]);

  const sectionRefs = useRef([]);
  const stickyRef = useRef(null);
  const categoriasScrollRef = useRef(null);

  // ✅ Destaques (scroll lateral)
  const destaquesScrollRef = useRef(null);
  const [destaqueIndex, setDestaqueIndex] = useState(0);
  const isDraggingDestaquesRef = useRef(false);
  const autoplayRef = useRef(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(0);
  const [statusLoja, setStatusLoja] = useState("Carregando...");
  const [avisoFechadoOpen, setAvisoFechadoOpen] = useState(false);
  const [avisoMensagem, setAvisoMensagem] = useState("");
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  // UX
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState(0);
  const [headerCompacto, setHeaderCompacto] = useState(false);

  const isMobile = useMediaQuery("(max-width:600px)");
  const lojaAberta = statusLoja === "Aberto";

  // ======= Carrinho contador =======
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
    const intervalo = setInterval(atualizarQuantidade, 1200);
    return () => clearInterval(intervalo);
  }, []);

  // ======= Header compacto ao rolar =======
  useEffect(() => {
    const onScroll = () => setHeaderCompacto(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ======= Fetch restaurante/produtos =======
  useEffect(() => {
    const restauranteData = localStorage.getItem("restauranteSelecionado");

    if (!restauranteData && !slug) {
      navigate("/erro", { replace: true });
      return;
    }

    const restauranteLSRaw = restauranteData ? JSON.parse(restauranteData) : null;
    const restauranteLS = normalizarRestaurante(restauranteLSRaw);

    const slugEfetivo =
      slug || restauranteLS?.slugIdentificador || restauranteLS?.slug || null;

    if (!slugEfetivo) {
      navigate("/erro", { replace: true });
      return;
    }

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
        const restauranteFresh = normalizarRestaurante(res.data);

        if (!restauranteFresh) {
          navigate("/erro", { replace: true });
          return;
        }

        const produtosPorCategoria =
          res.data?.produtosPorCategoria ||
          restauranteFresh?.produtosPorCategoria ||
          [];

        localStorage.setItem(
          "restauranteSelecionado",
          JSON.stringify(restauranteFresh)
        );

        setRestaurante(restauranteFresh);
        setStatusLoja(calcularStatusLoja(restauranteFresh));

        const categoriasBase = (produtosPorCategoria || []).filter(
          (cat) => cat.ativa !== false
        );

        const categoriasComItensFiltrados = categoriasBase.map((cat) => ({
          ...cat,
          itens: (cat.itens || [])
            .filter((prod) => prod.ativo !== false)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
        }));

        const categoriasComProdutos = categoriasComItensFiltrados.filter(
          (cat) => cat.itens && cat.itens.length > 0
        );

        setProdutosRaw(categoriasComProdutos);
      } catch (err) {
        console.error("Erro ao buscar produtos/restaurante:", err);
        navigate("/erro", { replace: true });
      } finally {
        setLoadingProdutos(false);
      }
    };

    fetchTudo();
  }, [navigate, slug]);

  // ======= Status atualiza sozinho =======
  useEffect(() => {
    if (!restaurante) return;
    const tick = () => setStatusLoja(calcularStatusLoja(restaurante));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [restaurante]);

  // ======= Busca (derivado) =======
  const produtos = useMemo(() => {
    const termo = (busca || "").trim().toLowerCase();
    if (!termo) return produtosRaw;

    return (produtosRaw || [])
      .map((cat) => {
        const itens = (cat.itens || []).filter((item) => {
          const nome = (item.nome || "").toLowerCase();
          const desc = (item.descricao || "").toLowerCase();
          const tag = (item.tag || "").toLowerCase();
          return (
            nome.includes(termo) || desc.includes(termo) || tag.includes(termo)
          );
        });
        return { ...cat, itens };
      })
      .filter((cat) => (cat.itens || []).length > 0);
  }, [produtosRaw, busca]);

  const totalItensEncontrados = useMemo(() => {
    return (produtos || []).reduce(
      (acc, cat) => acc + (cat.itens?.length || 0),
      0
    );
  }, [produtos]);

  // ✅ Destaques (derivado do RAW; robusto p/ boolean/string/number)
  const destaques = useMemo(() => {
    const termo = (busca || "").trim().toLowerCase();
    const all = [];

    for (const cat of (produtosRaw || [])) {
      for (const item of (cat.itens || [])) {
        const isDestaque =
          item?.destaque === true ||
          item?.destaque === "true" ||
          item?.destaque === 1 ||
          item?.destaque === "1";

        if (!isDestaque) continue;

        if (termo) {
          const nome = (item.nome || "").toLowerCase();
          const desc = (item.descricao || "").toLowerCase();
          const tag = (item.tag || "").toLowerCase();
          const match =
            nome.includes(termo) || desc.includes(termo) || tag.includes(termo);
          if (!match) continue;
        }

        all.push({ item, categoria: cat });
      }
    }

    all.sort(
      (a, b) => Number(a.item?.ordem || 0) - Number(b.item?.ordem || 0)
    );
    return all;
  }, [produtosRaw, busca]);

  // ✅ helper: centraliza um card por índice (snap forte)
  const scrollToDestaqueIndex = (idx, behavior = "smooth") => {
    const container = destaquesScrollRef.current;
    if (!container) return;

    const cards = container.querySelectorAll("[data-destaque-card='1']");
    if (!cards || !cards.length) return;

    const safeIdx = ((idx % cards.length) + cards.length) % cards.length;
    const el = cards[safeIdx];

    const left =
      el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;

    container.scrollTo({ left, behavior });
    setDestaqueIndex(safeIdx);
  };

  // ✅ inicializa no primeiro destaque quando carregar
  useEffect(() => {
    if (!loadingProdutos && destaques.length > 0) {
      // sem animação na primeira centralização
      scrollToDestaqueIndex(0, "auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingProdutos, destaques.length]);

  // ✅ autoplay: a cada 10s (pausa no modal e durante drag)
  useEffect(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);

    if (loadingProdutos) return;
    if (!destaques.length) return;
    if (modalAberto) return;

    autoplayRef.current = setInterval(() => {
      if (isDraggingDestaquesRef.current) return;
      scrollToDestaqueIndex(destaqueIndex + 1);
    }, 10000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [loadingProdutos, destaques.length, modalAberto, destaqueIndex]);

  // botões (mantém compatível)
  const scrollDestaquesLeft = () => scrollToDestaqueIndex(destaqueIndex - 1);
  const scrollDestaquesRight = () => scrollToDestaqueIndex(destaqueIndex + 1);

  // ======= Categoria ativa via IntersectionObserver =======
  useEffect(() => {
    if (!produtos || produtos.length === 0) return;

    const refs = sectionRefs.current.filter(Boolean);
    if (refs.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visiveis = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0)
          );

        if (visiveis[0]) {
          const idx = refs.findIndex((r) => r === visiveis[0].target);
          if (idx >= 0) setCategoriaAtiva(idx);
        }
      },
      {
        root: null,
        rootMargin: "-160px 0px -60% 0px",
        threshold: [0.08, 0.2, 0.35],
      }
    );

    refs.forEach((r) => obs.observe(r));
    return () => obs.disconnect();
  }, [produtos]);

  // centraliza categoria selecionada
  useEffect(() => {
    const container = categoriasScrollRef.current;
    const btn = container?.querySelector?.(
      `[data-cat-index="${categoriaAtiva}"]`
    );
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const offset =
      btnRect.left -
      containerRect.left -
      containerRect.width / 2 +
      btnRect.width / 2;

    container.scrollBy({ left: offset, behavior: "smooth" });
  }, [categoriaAtiva]);

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
        <Avatar sx={{ width: size, height: size }}>{initials || "R"}</Avatar>
      );
    }
    return (
      <Avatar
        src={DEFAULT_IMAGE_URL}
        sx={{ width: size, height: size, bgcolor: "#fff" }}
      />
    );
  };

  const getStickyHeight = () => {
    return stickyRef.current?.getBoundingClientRect?.().height || 160;
  };

  const scrollToSection = (index) => {
    const ref = sectionRefs.current[index];
    if (!ref) return;

    const offsetTop = ref.offsetTop;
    const headerOffset = getStickyHeight() + 8;
    window.scrollTo({ top: offsetTop - headerOffset, behavior: "smooth" });
  };

  const scrollLeft = () => {
    if (categoriasScrollRef.current) {
      categoriasScrollRef.current.scrollBy({ left: -240, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (categoriasScrollRef.current) {
      categoriasScrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  /**
   * ✅ Abre modal passando também “regras da categoria”
   * ✅ Pausa autoplay automaticamente pois modalAberto = true
   */
  const abrirModalProduto = (item, categoria) => {
    if (!lojaAberta) {
      setAvisoMensagem(
        "Restaurante fechado no momento. Não é possível adicionar itens ao carrinho."
      );
      setAvisoFechadoOpen(true);
      return;
    }

    const categoriaType = inferCategoriaType(categoria, item);

    const tiposExtrasCorrigidos = (item.tiposExtras || []).map((extra) => ({
      ...extra,
      itens: item.extras?.[extra.nome] || [],
    }));

    setProdutoSelecionado({
      ...item,
      precoBase: item.precoBase,
      categoriaType,

      pizzaMultisabor:
        Boolean(categoria?.pizzaMultisabor) || Boolean(item?.pizzaMultisabor),
      calculoPrecoPor:
        categoria?.calculoPrecoPor || item?.calculoPrecoPor || "maior",
      maxSabores:
        categoria?.maxSabores ||
        item?.maxSabores ||
        (categoria?.pizzaMultisabor ? 2 : 1),

      saboresDisponiveis: item.sabores || [],
      bordasDisponiveis: item.bordas || [],
      complementos: item.complementos || [],
      adicionais: item.adicionais || [],
      tiposExtras: tiposExtrasCorrigidos,

      categoriaNome: categoria?.nome || "",
    });

    setModalAberto(true);
  };

  const getPrecoLabel = (item, categoria, categoriaType) => {
    const sabores = item?.sabores || [];

    if (
      shouldShowAPartirDe({ categoria, item, categoriaType }) &&
      sabores.length > 0
    ) {
      const menor = Math.min(...sabores.map((s) => Number(s.preco || 0)));
      if (Number.isFinite(menor)) return `a partir de ${formatBRL(menor)}`;
    }

    return formatBRL(item.precoBase || 0);
  };

  const chipsInfo = useMemo(() => {
    const list = [];

    if (restaurante?.tempoEntrega) {
      list.push({ key: "tempo", label: `${restaurante.tempoEntrega} min` });
    }
    if (restaurante?.taxaEntrega != null) {
      list.push({
        key: "taxa",
        label: `Entrega ${formatBRL(restaurante.taxaEntrega)}`,
      });
    }
    if (restaurante?.pedidoMinimo != null) {
      list.push({
        key: "min",
        label: `Mín. ${formatBRL(restaurante.pedidoMinimo)}`,
      });
    }

    return list;
  }, [restaurante]);

  return (
    <Box sx={{ pb: 10, backgroundColor: "#f5f5f7", minHeight: "100vh" }}>
      <Helmet>
        {restaurante ? (
          <title>{restaurante.nome} - Faça seu pedido</title>
        ) : (
          <title>Carregando loja...</title>
        )}
      </Helmet>

      {/* APPBAR */}
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
            minHeight: headerCompacto ? 56 : 64,
            transition: "min-height 150ms ease",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {renderAvatar(headerCompacto ? 32 : 36)}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={900}
                noWrap
                sx={{ color: "#fff", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {restaurante?.nome || "Carregando..."}
              </Typography>

              {!headerCompacto && restaurante?.enderecoBairro && (
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.88)" }}
                  noWrap
                >
                  {restaurante.enderecoBairro}
                  {restaurante.enderecoCidade ? ` • ${restaurante.enderecoCidade}` : ""}
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
              fontWeight: 800,
              "& .MuiChip-icon": { color: "#fff" },
              borderRadius: "999px",
            }}
          />
        </Toolbar>

        {!headerCompacto && chipsInfo.length > 0 && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Stack direction="row" spacing={1} sx={{ overflowX: "auto" }}>
              {chipsInfo.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.22)",
                    fontWeight: 700,
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </AppBar>

      {/* STICKY (Busca + categorias) */}
      <Box
        ref={stickyRef}
        sx={{
          position: "sticky",
          top: headerCompacto ? 56 : 64,
          zIndex: 1100,
          backgroundColor: "#f5f5f7",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        {/* Busca */}
        <Box sx={{ px: 2, pt: 1.25, pb: 1 }}>
          <TextField
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar no cardápio (ex: pizza, suco, combo...)"
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: busca ? (
                <InputAdornment position="end">
                  <Tooltip title="Limpar busca">
                    <IconButton size="small" onClick={() => setBusca("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "999px",
                bgcolor: "#fff",
              },
            }}
          />

          {!loadingProdutos && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.75, display: "block" }}
            >
              {busca
                ? `${totalItensEncontrados} item(s) encontrado(s) para “${busca.trim()}”`
                : "Dica: use a busca pra achar rapidinho qualquer item."}
            </Typography>
          )}
        </Box>

        {/* Categorias */}
        <Box sx={{ display: "flex", alignItems: "center", px: 1, pb: 1 }}>
          <IconButton onClick={scrollLeft} size="small" aria-label="Categorias anteriores">
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Box
            ref={categoriasScrollRef}
            sx={{
              overflowX: "auto",
              display: "flex",
              gap: 1,
              whiteSpace: "nowrap",
              flex: 1,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              px: 0.5,
              scrollSnapType: "x mandatory",
            }}
          >
            {produtos.map((categoria, i) => {
              const selected = i === categoriaAtiva;
              return (
                <Button
                  key={categoria._id || i}
                  data-cat-index={i}
                  variant={selected ? "contained" : "outlined"}
                  size="small"
                  onClick={() => scrollToSection(i)}
                  title={categoria.nome}
                  sx={{
                    scrollSnapAlign: "center",
                    borderRadius: "999px",
                    textTransform: "none",
                    px: 2,
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "0.8rem",
                    minHeight: "34px",
                    flexShrink: 0,
                    bgcolor: selected ? "#ff7a3d" : "#ffffff",
                    color: selected ? "#fff" : "inherit",
                    borderColor: selected ? "#ff7a3d" : "#ff7a3d33",
                    boxShadow: selected ? "0 6px 16px rgba(255,122,61,0.25)" : "none",
                    "&:hover": {
                      borderColor: "#ff7a3d",
                      backgroundColor: selected ? "#ff6b2a" : "#fff7f2",
                    },
                  }}
                >
                  {categoria.nome}
                  {categoria?.itens?.length ? (
                    <Box
                      component="span"
                      sx={{ ml: 1, opacity: selected ? 0.95 : 0.65, fontWeight: 800 }}
                    >
                      • {categoria.itens.length}
                    </Box>
                  ) : null}
                </Button>
              );
            })}
          </Box>

          <IconButton onClick={scrollRight} size="small" aria-label="Próximas categorias">
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ✅ DESTAQUES FORA DO STICKY (não fica fixado) */}
      {!loadingProdutos && destaques.length > 0 && (
        <Box sx={{ pt: 1.2, pb: 1.2 }}>
          <Box sx={{ px: 2, mb: 0.8, display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={<StarIcon sx={{ color: "#fff !important" }} fontSize="small" />}
              label="Destaques"
              size="small"
              sx={{
                bgcolor: "#111827",
                color: "#fff",
                fontWeight: 900,
                borderRadius: "999px",
              }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              Passa sozinho a cada 10s
            </Typography>

            <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
              <IconButton onClick={scrollDestaquesLeft} size="small" aria-label="Destaques anteriores">
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={scrollDestaquesRight} size="small" aria-label="Próximos destaques">
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Wrapper com gradiente lateral */}
          <Box
            sx={{
              position: "relative",
              "&:before, &:after": {
                content: '""',
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 32,
                zIndex: 3,
                pointerEvents: "none",
              },
              "&:before": {
                left: 0,
                background:
                  "linear-gradient(90deg, rgba(245,245,247,1) 0%, rgba(245,245,247,0) 100%)",
              },
              "&:after": {
                right: 0,
                background:
                  "linear-gradient(270deg, rgba(245,245,247,1) 0%, rgba(245,245,247,0) 100%)",
              },
            }}
          >
            <Box
              ref={destaquesScrollRef}
              onPointerDown={() => (isDraggingDestaquesRef.current = true)}
              onPointerUp={() => (isDraggingDestaquesRef.current = false)}
              onPointerCancel={() => (isDraggingDestaquesRef.current = false)}
              onPointerLeave={() => (isDraggingDestaquesRef.current = false)}
              sx={{
                px: 2,
                overflowX: "auto",
                display: "flex",
                gap: 1.25,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },

                scrollSnapType: "x mandatory",
                scrollPaddingLeft: 16,
                scrollPaddingRight: 16,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {destaques.map(({ item, categoria }) => {
                const categoriaType = inferCategoriaType(categoria, item);
                const precoLabel = getPrecoLabel(item, categoria, categoriaType);
                const cardWidth = isMobile ? "calc(100% - 64px)" : 320;

                return (
                  <Paper
                    key={String(item._id)}
                    data-destaque-card="1"
                    onClick={() => abrirModalProduto(item, categoria)}
                    elevation={0}
                    sx={{
                      scrollSnapAlign: "center",
                      scrollSnapStop: "always",
                      flexShrink: 0,
                      width: cardWidth,
                      borderRadius: 2.5,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.06)",
                      bgcolor: "#fff",
                      cursor: "pointer",
                      transition: "transform 120ms ease, box-shadow 120ms ease",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 10px 25px rgba(2,6,23,0.06)",
                      },
                      ...(lojaAberta ? {} : { opacity: 0.72, cursor: "not-allowed" }),
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1.25, p: 1.25 }}>
                      <Avatar
                        src={item.imagem || DEFAULT_IMAGE_URL}
                        alt={item.nome}
                        variant="rounded"
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: 2,
                          bgcolor: "#fff",
                          flexShrink: 0,
                        }}
                      />

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          fontWeight={1000}
                          sx={{
                            fontSize: "0.95rem",
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.nome}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mt: 0.3,
                          }}
                        >
                          {item.descricao || categoria?.nome || ""}
                        </Typography>

                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.8 }}>
                          <Typography variant="body2" color="primary" fontWeight={1000}>
                            {precoLabel}
                          </Typography>

                          <Chip
                            size="small"
                            icon={<StarIcon sx={{ color: "#111827 !important" }} fontSize="small" />}
                            label="Destaque"
                            sx={{
                              height: 22,
                              borderRadius: "999px",
                              bgcolor: "rgba(250,204,21,0.22)",
                              fontWeight: 900,
                            }}
                          />
                        </Stack>

                        <Box sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddShoppingCartIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalProduto(item, categoria);
                            }}
                            disabled={!lojaAberta}
                            sx={{
                              borderRadius: "999px",
                              textTransform: "none",
                              borderColor: "#ff7a3d55",
                              color: "#ff7a3d",
                              fontWeight: 900,
                              "&:hover": { borderColor: "#ff7a3d", backgroundColor: "#fff7f2" },
                            }}
                          >
                            Adicionar
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* LISTA */}
      <Container sx={{ py: 2 }} disableGutters>
        {loadingProdutos ? (
          <>
            {[1, 2, 3].map((s) => (
              <Box key={s} sx={{ mb: 3, px: 2 }}>
                <Skeleton variant="text" width={160} height={28} sx={{ mb: 1 }} />
                <Divider sx={{ mb: 2 }} />
                {[1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={90} sx={{ mb: 2, borderRadius: 2 }} />
                ))}
              </Box>
            ))}
          </>
        ) : produtos.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 6, color: "text.secondary", px: 2 }}>
            <Typography variant="subtitle1" fontWeight={900}>
              Nenhum item encontrado
            </Typography>
            <Typography variant="body2">
              {busca
                ? "Tente buscar por outro nome (ex: “pizza”, “coca”, “promoção”)."
                : "Volte mais tarde, o cardápio pode estar em atualização."}
            </Typography>

            {busca && (
              <Button
                onClick={() => setBusca("")}
                sx={{ mt: 2, borderRadius: "999px" }}
                variant="contained"
              >
                Limpar busca
              </Button>
            )}
          </Box>
        ) : (
          produtos.map((categoria, i) => (
            <Box
              key={categoria._id || i}
              ref={(el) => (sectionRefs.current[i] = el)}
              sx={{ mb: 3.5 }}
            >
              <Box sx={{ px: 2, pt: 1 }}>
                <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5, color: "#333" }}>
                    {categoria.nome}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {(categoria.itens || []).length} item(s)
                  </Typography>
                </Stack>

                {categoria.descricao && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {categoria.descricao}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ mb: 1 }} />

              {categoria.itens.map((item, index) => {
                const categoriaType = inferCategoriaType(categoria, item);

                return (
                  <Box key={item._id || index} sx={{ mb: 1 }}>
                    <Fade in timeout={220}>
                      <Paper
                        elevation={0}
                        onClick={() => abrirModalProduto(item, categoria)}
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
                          transition: "transform 120ms ease, background-color 120ms ease",
                          "&:hover": { backgroundColor: "#fafafa", transform: "translateY(-1px)" },
                          ...(lojaAberta ? {} : { opacity: 0.72, cursor: "not-allowed" }),
                        }}
                      >
                        <Box sx={{ flex: 1, pr: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                              variant="subtitle1"
                              fontWeight={900}
                              sx={{ mb: 0.25, lineHeight: 1.15 }}
                            >
                              {item.nome}
                            </Typography>

                            {item.tag && (
                              <Chip
                                label={item.tag}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ height: 22 }}
                              />
                            )}

                            {(item?.destaque === true ||
                              item?.destaque === "true" ||
                              item?.destaque === 1 ||
                              item?.destaque === "1") && (
                              <Chip
                                icon={<StarIcon fontSize="small" />}
                                label="Destaque"
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontWeight: 900 }}
                              />
                            )}
                          </Stack>

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

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                            <Typography variant="body2" color="primary" fontWeight={900}>
                              {getPrecoLabel(item, categoria, categoriaType)}
                            </Typography>

                            {(item.adicionais?.length ||
                              item.complementos?.length ||
                              item.tiposExtras?.length ||
                              item.sabores?.length ||
                              item.bordas?.length) && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                • Personalizável
                              </Typography>
                            )}
                          </Stack>

                          <Box sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddShoppingCartIcon fontSize="small" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalProduto(item, categoria);
                              }}
                              disabled={!lojaAberta}
                              sx={{
                                borderRadius: "999px",
                                textTransform: "none",
                                borderColor: "#ff7a3d55",
                                color: "#ff7a3d",
                                fontWeight: 900,
                                "&:hover": { borderColor: "#ff7a3d", backgroundColor: "#fff7f2" },
                              }}
                            >
                              Adicionar
                            </Button>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            width: 92,
                            height: 92,
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
                              bgcolor: "#fff",
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
                              <Typography variant="caption" sx={{ color: "#fff", fontWeight: 900 }}>
                                Fechado
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Fade>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Container>

      {/* Modal */}
      {produtoSelecionado && (
        <ModalProduto
          open={modalAberto}
          onClose={() => {
            setModalAberto(false);
            // quando fecha modal, autoplay volta sozinho pelo useEffect
          }}
          produto={produtoSelecionado}
        />
      )}

      {/* Bottom nav */}
      <Paper
        elevation={10}
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000 }}
      >
        <BottomNavigation showLabels>
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

      {/* Aviso loja fechada */}
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
