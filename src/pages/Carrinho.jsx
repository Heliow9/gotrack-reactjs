// src/pages/Carrinho.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Paper,
  Button,
  Divider,
  Avatar,
  Stack,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useNavigate, useParams } from "react-router-dom";
import { calcularStatusLoja } from "../utils/horarioLoja";

const DEFAULT_IMAGE_URL =
  "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

const CART_KEY = "carrinho";
const CART_OWNER_KEY = "carrinho_restaurante_id";
const PIX_PENDENTE_KEY = "pix_pendente";

// ===== helpers =====
function formatBRL(v) {
  const num = Number(v || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getRestauranteFromLS() {
  try {
    const raw = localStorage.getItem("restauranteSelecionado");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.restaurante && typeof parsed.restaurante === "object") return parsed.restaurante;
    return parsed;
  } catch {
    return null;
  }
}

function getCurrentRestaurantId() {
  const r = getRestauranteFromLS();
  return r?._id ? String(r._id) : "";
}

function readCartForCurrentRestaurant() {
  try {
    const currentId = getCurrentRestaurantId();
    const owner = String(localStorage.getItem(CART_OWNER_KEY) || "");
    const arr = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    if (currentId && owner && owner !== currentId) {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(PIX_PENDENTE_KEY);
      return [];
    }

    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function plural(n, s, p) {
  return n === 1 ? s : p;
}

function formatOptionName(option) {
  if (!option) return "";
  if (typeof option === "string") return option.trim();
  if (typeof option === "number") return String(option);
  if (typeof option === "object") {
    const nome = option.nome || option.name || option.titulo || option.label || option.descricao || "";
    const texto = nome.toString().trim();
    if (!texto) return "";

    const preco = Number(option.preco || option.valor || option.precoExtra || 0);
    if (Number.isFinite(preco) && preco > 0) return `${texto} (+${formatBRL(preco)})`;
    return texto;
  }
  return "";
}

function normalizeStringsArray(val) {
  if (!val) return [];
  if (typeof val === "string" || typeof val === "number") {
    const texto = formatOptionName(val);
    return texto ? [texto] : [];
  }
  if (Array.isArray(val)) {
    return val.map(formatOptionName).filter(Boolean);
  }
  if (typeof val === "object") {
    if (Array.isArray(val.saboresSelecionados)) return normalizeStringsArray(val.saboresSelecionados);
    if (Array.isArray(val.sabores)) return normalizeStringsArray(val.sabores);
    const texto = formatOptionName(val);
    return texto ? [texto] : [];
  }
  return [];
}

function removerDuplicados(arr = []) {
  const vistos = new Set();
  return arr.filter((item) => {
    const chave = String(item || "").trim().toLowerCase();
    if (!chave || vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function isPizzaItem(item) {
  return (
    item?.categoriaType === "pizza" ||
    item?.pizzaMultisabor === true ||
    Number(item?.maxSabores || 0) > 0 ||
    Array.isArray(item?.saboresSelecionados) ||
    Array.isArray(item?.pizza?.saboresSelecionados)
  );
}

export default function Carrinho() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [restaurante, setRestaurante] = useState(() => getRestauranteFromLS());
  const [statusLoja, setStatusLoja] = useState(() =>
    calcularStatusLoja(getRestauranteFromLS())
  );

  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "info",
  });

  const [itens, setItens] = useState(() => readCartForCurrentRestaurant());

  const slugEfetivo = useMemo(() => {
    const ls = getRestauranteFromLS();
    return slug || ls?.slugIdentificador || ls?.slug || null;
  }, [slug]);

  const irParaCardapio = () => {
    if (slugEfetivo) return navigate(`/p/${slugEfetivo}`);
    return navigate("/p");
  };

  // Mantém restaurante/status atualizado
  useEffect(() => {
    const r = getRestauranteFromLS();
    if (r) setRestaurante(r);
    setItens(readCartForCurrentRestaurant());
    setStatusLoja(calcularStatusLoja(r));

    const t = setInterval(() => {
      const rr = getRestauranteFromLS();
      setStatusLoja(calcularStatusLoja(rr));
    }, 30000);

    return () => clearInterval(t);
  }, []);

  // Persistência carrinho
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(itens || []));
    try { window.dispatchEvent(new Event("movyo:carrinhoAtualizado")); } catch {}
  }, [itens]);

  // ✅ Total (prioriza precoTotal que o Modal já grava pronto)
  const total = useMemo(() => {
    return (itens || []).reduce((acc, item) => {
      const qtd = item.quantidade || 1;

      const sub = Number(item.precoTotal || 0);
      if (sub > 0) return acc + sub;

      const unit = Number(
        item.precoUnitario || item.precoFinal || item.preco || item.total || 0
      );
      return acc + unit * qtd;
    }, 0);
  }, [itens]);

  const alterarQtd = (index, delta) => {
    setItens((prev) => {
      const next = [...(prev || [])];
      const atual = next[index];
      if (!atual) return prev;

      const nova = (atual.quantidade || 1) + delta;

      if (nova <= 0) {
        next.splice(index, 1);
        return next;
      }

      const unit =
        Number(atual.precoTotal || 0) > 0
          ? Number(atual.precoTotal || 0) / (atual.quantidade || 1)
          : Number(atual.precoUnitario || atual.precoFinal || atual.preco || atual.total || 0);

      next[index] = {
        ...atual,
        quantidade: nova,
        ...(Number.isFinite(unit) && unit > 0 ? { precoTotal: unit * nova } : {}),
      };

      return next;
    });
  };

  const removerItem = (index) => {
    setItens((prev) => {
      const next = [...(prev || [])];
      next.splice(index, 1);
      return next;
    });
  };

  const carrinhoVazio = !itens || itens.length === 0;

  const renderAvatar = (size = 34) => {
    if (restaurante?.logoUrl) {
      return (
        <Avatar
          src={restaurante.logoUrl}
          sx={{ width: size, height: size, bgcolor: "#fff" }}
        />
      );
    }
    if (restaurante?.nome) {
      const initials = restaurante.nome
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return <Avatar sx={{ width: size, height: size }}>{initials || "R"}</Avatar>;
    }
    return (
      <Avatar
        src={DEFAULT_IMAGE_URL}
        sx={{ width: size, height: size, bgcolor: "#fff" }}
      />
    );
  };

  /**
   * ✅ Monta detalhes completos do item sem cortar texto.
   * A tela antiga usava Chip pequeno com nowrap, por isso aparecia "...".
   */
  const getDetalhes = (item) => {
    const detalhes = [];
    const pizza = isPizzaItem(item);

    // ---------- SABORES ----------
    const saboresRaw =
      item?.saboresSelecionados ??
      item?.sabores ??
      item?.pizza?.saboresSelecionados ??
      item?.pizza?.sabores;

    const sabores = removerDuplicados(normalizeStringsArray(saboresRaw));
    const maxSabores = Math.max(1, Number(item?.maxSabores || 0) || sabores.length || 1);

    if (sabores.length) {
      detalhes.push({
        key: "sabores",
        titulo: sabores.length > 1 ? "Sabores" : "Sabor",
        valores: sabores.slice(0, maxSabores),
        destaque: true,
      });
    }

    // ---------- BORDA ----------
    if (pizza) {
      const bordaNome = item?.bordaSelecionada?.nome || item?.bordaSelecionada?.name || "Sem borda";
      detalhes.push({ key: "borda", titulo: "Borda", valores: [bordaNome] });
    } else if (item?.bordaSelecionada?.nome) {
      detalhes.push({ key: "borda", titulo: "Borda", valores: [item.bordaSelecionada.nome] });
    }

    // ---------- ADICIONAL ----------
    if (item?.adicionalSelecionado?.nome) {
      detalhes.push({
        key: "adicional",
        titulo: "Adicional",
        valores: [formatOptionName(item.adicionalSelecionado)],
      });
    }

    // ---------- COMPLEMENTOS ----------
    const comps = removerDuplicados(normalizeStringsArray(item?.complementosSelecionados));
    if (comps.length) {
      detalhes.push({ key: "comps", titulo: "Complementos", valores: comps });
    }

    // ---------- TIPOS EXTRAS ----------
    if (item?.tiposExtrasSelecionados && typeof item.tiposExtrasSelecionados === "object") {
      Object.entries(item.tiposExtrasSelecionados).forEach(([nomeTipo, itensTipo]) => {
        const nomes = removerDuplicados(normalizeStringsArray(itensTipo));
        if (nomes.length) {
          detalhes.push({
            key: `extra-${nomeTipo}`,
            titulo: nomeTipo,
            valores: nomes,
          });
        }
      });
    }

    if (item?.observacao?.trim?.()) {
      detalhes.push({
        key: "obs",
        titulo: "Observação",
        valores: [item.observacao.trim()],
        observacao: true,
      });
    }

    return detalhes;
  };

  const renderDetalheItem = (detalhe) => {
    const valores = detalhe.valores || [];
    if (!valores.length) return null;

    return (
      <Box
        key={detalhe.key}
        sx={{
          px: 1.2,
          py: 0.85,
          borderRadius: 2,
          bgcolor: detalhe.destaque ? "rgba(255,122,61,0.10)" : "rgba(17,24,39,0.045)",
          border: detalhe.destaque
            ? "1px solid rgba(255,122,61,0.16)"
            : "1px solid rgba(17,24,39,0.055)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: "block",
            lineHeight: 1.1,
            fontWeight: 1000,
            color: detalhe.destaque ? "#c4511f" : "text.secondary",
            textTransform: "uppercase",
            letterSpacing: 0.35,
            mb: 0.35,
          }}
        >
          {detalhe.titulo}
        </Typography>

        <Stack spacing={0.15}>
          {valores.map((valor, idx) => (
            <Typography
              key={`${detalhe.key}-${idx}-${valor}`}
              sx={{
                fontSize: 13,
                fontWeight: detalhe.destaque ? 1000 : 850,
                color: detalhe.observacao ? "text.secondary" : "#111827",
                lineHeight: 1.22,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
              }}
            >
              {valor}
            </Typography>
          ))}
        </Stack>
      </Box>
    );
  };


  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f7", pb: 4 }}>
      {/* TOP BAR */}
      <AppBar
        position="sticky"
        elevation={2}
        sx={{
          background:
            "linear-gradient(90deg, #ff4b8b 0%, #ff7a3d 45%, #ffb347 100%)",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={irParaCardapio} sx={{ color: "#fff" }}>
            <ArrowBackIcon />
          </IconButton>

          {renderAvatar(34)}

          <Typography
            variant="subtitle1"
            sx={{ color: "#fff", fontWeight: 900, flex: 1, minWidth: 0 }}
            noWrap
          >
            {restaurante?.nome || "Carrinho"}
          </Typography>

          <Chip
            icon={<AccessTimeIcon fontSize="small" />}
            label={statusLoja}
            size="small"
            sx={{
              bgcolor: statusLoja?.toLowerCase?.().includes("aberto")
                ? "#2e7d32"
                : "#c62828",
              color: "#fff",
              fontWeight: 900,
              "& .MuiChip-icon": { color: "#fff" },
              borderRadius: "999px",
            }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 2, pt: 2 }}>
        <Typography variant="h6" fontWeight={1000} sx={{ mb: 1 }}>
          Meu Carrinho
        </Typography>

        {/* EMPTY STATE */}
        {carrinhoVazio ? (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 3,
              borderRadius: 3,
              textAlign: "center",
              bgcolor: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: "999px",
                bgcolor: "rgba(255,122,61,0.10)",
                display: "grid",
                placeItems: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <ShoppingCartOutlinedIcon sx={{ fontSize: 46, color: "#ff7a3d" }} />
            </Box>

            <Typography fontWeight={1000} sx={{ mb: 0.5 }}>
              Seu carrinho está vazio
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Volte ao cardápio e adicione seus itens favoritos.
            </Typography>

            <Button
              variant="outlined"
              onClick={irParaCardapio}
              sx={{
                borderRadius: "999px",
                textTransform: "none",
                fontWeight: 900,
                px: 3,
                borderColor: "#ff7a3d55",
                color: "#ff7a3d",
                "&:hover": { borderColor: "#ff7a3d", backgroundColor: "#fff7f2" },
              }}
            >
              Ver cardápio
            </Button>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {(itens || []).map((item, index) => {
              const qtd = item.quantidade || 1;

              const sub = Number(item.precoTotal || 0);
              const unitFallback = Number(
                item.precoUnitario || item.precoFinal || item.preco || item.total || 0
              );
              const subtotal = sub > 0 ? sub : unitFallback * qtd;

              const detalhes = getDetalhes(item);

              return (
                <Box key={item._id || index}>
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.35} alignItems="flex-start">
                      <Avatar
                        variant="rounded"
                        src={item.imagem || DEFAULT_IMAGE_URL}
                        alt={item.nome}
                        sx={{
                          width: { xs: 72, sm: 82 },
                          height: { xs: 72, sm: 82 },
                          borderRadius: 2.5,
                          bgcolor: "#fff",
                          boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
                          flexShrink: 0,
                        }}
                      />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          fontWeight={1000}
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            lineHeight: 1.12,
                            color: "#111827",
                            whiteSpace: "normal",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {item.nome}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{ display: "block", mt: 0.55, color: "text.secondary", fontWeight: 800 }}
                        >
                          {qtd} {plural(qtd, "unidade", "unidades")} · Unitário {formatBRL(subtotal / qtd)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.8, flexShrink: 0 }}>
                        <Stack
                          direction="row"
                          spacing={0.35}
                          alignItems="center"
                          sx={{
                            bgcolor: "rgba(17,24,39,0.045)",
                            borderRadius: "999px",
                            p: 0.25,
                            border: "1px solid rgba(17,24,39,0.06)",
                          }}
                        >
                          <IconButton size="small" onClick={() => alterarQtd(index, -1)} sx={{ width: 28, height: 28 }}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography fontWeight={1000} sx={{ minWidth: 18, textAlign: "center" }}>
                            {qtd}
                          </Typography>
                          <IconButton size="small" onClick={() => alterarQtd(index, +1)} sx={{ width: 28, height: 28 }}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        <IconButton
                          onClick={() => removerItem(index)}
                          aria-label="Remover item"
                          sx={{
                            width: 34,
                            height: 34,
                            color: "#8a8f98",
                            bgcolor: "rgba(17,24,39,0.045)",
                            "&:hover": { bgcolor: "rgba(198,40,40,0.10)", color: "#c62828" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Stack>

                    {detalhes.length > 0 && (
                      <Stack spacing={0.75} sx={{ mt: 1.4 }}>
                        {detalhes.map(renderDetalheItem)}
                      </Stack>
                    )}

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        mt: 1.35,
                        pt: 1.15,
                        borderTop: "1px dashed rgba(17,24,39,0.10)",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900 }}>
                        Subtotal do item
                      </Typography>
                      <Typography color="primary" fontWeight={1100} sx={{ fontSize: 17 }}>
                        {formatBRL(subtotal)}
                      </Typography>
                    </Stack>
                  </Box>

                  {index < itens.length - 1 && <Divider />}
                </Box>
              );
            })}

            <Divider />

            <Box sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={1000}>
                  Total{" "}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
                    ({itens.length} {plural(itens.length, "item", "itens")})
                  </Typography>
                </Typography>

                <Typography fontWeight={1100} color="primary">
                  {formatBRL(total)}
                </Typography>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  borderRadius: "999px",
                  textTransform: "none",
                  fontWeight: 1000,
                  bgcolor: "#ff7a3d",
                  "&:hover": { bgcolor: "#ff6b2a" },
                }}
                onClick={() => {
                  if (carrinhoVazio) {
                    setSnack({
                      open: true,
                      msg: "Seu carrinho está vazio.",
                      severity: "warning",
                    });
                    return;
                  }

                  if (!statusLoja?.toLowerCase().includes("aberto")) {
                    setSnack({
                      open: true,
                      msg: "A loja está fechada no momento.",
                      severity: "warning",
                    });
                    return;
                  }

                  navigate(`/p/checkout`);
                }}

              >
                Finalizar pedido
              </Button>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1, borderRadius: "999px", textTransform: "none", fontWeight: 900 }}
                onClick={irParaCardapio}
              >
                Continuar comprando
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity || "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
