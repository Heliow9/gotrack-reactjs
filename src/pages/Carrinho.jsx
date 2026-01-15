// pages/Carrinho.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Stack,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import IcecreamIcon from "@mui/icons-material/Icecream";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";

import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const FALLBACK_IMG = "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

const diasSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

function parseHM(hm) {
  const [h, m] = (hm || "0:0").split(":").map(Number);
  return { h, m };
}

function makeDateWithHM(baseDate, hm) {
  const { h, m } = parseHM(hm);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Regra:
 * - Se fecha <= abre, significa que fecha no dia seguinte (vira-dia).
 */
function isOpenNow(restaurante, now = new Date()) {
  const hf = restaurante?.horariosFuncionamento;
  if (!hf) return { open: false, today: null, horario: null };

  const hojeKey = diasSemana[now.getDay()];
  const horario = hf[hojeKey];

  if (!horario || horario.fechado || !horario.abre || !horario.fecha) {
    return { open: false, today: hojeKey, horario };
  }

  const abre = makeDateWithHM(now, horario.abre);
  let fecha = makeDateWithHM(now, horario.fecha);

  // vira-dia
  if (fecha <= abre) {
    fecha = new Date(fecha.getTime() + 24 * 60 * 60 * 1000);
  }

  return { open: now >= abre && now < fecha, today: hojeKey, horario };
}

function getNextOpenLabel(restaurante, now = new Date()) {
  const hf = restaurante?.horariosFuncionamento;
  if (!hf) return null;

  const hojeKey = diasSemana[now.getDay()];
  const hoje = hf[hojeKey];

  if (hoje && !hoje.fechado && hoje.abre && hoje.fecha) {
    const abre = makeDateWithHM(now, hoje.abre);
    let fecha = makeDateWithHM(now, hoje.fecha);
    if (fecha <= abre) fecha = new Date(fecha.getTime() + 24 * 60 * 60 * 1000);
    if (now < abre) return `Hoje às ${hoje.abre}`;
  }

  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const key = diasSemana[d.getDay()];
    const h = hf[key];
    if (h && !h.fechado && h.abre && h.fecha) {
      const labelDia = i === 1 ? "Amanhã" : key.charAt(0).toUpperCase() + key.slice(1);
      return `${labelDia} às ${h.abre}`;
    }
  }

  return null;
}

/**
 * Sugestões:
 * - Se o backend já tiver algo, você pode salvar no restaurante:
 *   restaurante.sugestoesCarrinho = [{ id, nome, preco, imagem, categoria }]
 * - Se não tiver, a UI usa um fallback bonitinho (bebidas/sobremesas).
 */
function buildSuggestions(restaurante) {
  const fromRestaurant = Array.isArray(restaurante?.sugestoesCarrinho)
    ? restaurante.sugestoesCarrinho
    : [];

  const normalized = fromRestaurant
    .map((p) => ({
      id: p.id || p._id || p.nome,
      nome: p.nome,
      preco: Number(p.preco || p.precoUnitario || 0),
      imagem: p.imagem || p.imagemUrl || p.fotoUrl || null,
      categoria: p.categoria || p.tipo || "Sugestão",
    }))
    .filter((p) => p.nome && Number.isFinite(p.preco) && p.preco > 0);

  if (normalized.length) return normalized.slice(0, 12);

  // fallback (pra não ficar vazio)
  return [
    {
      id: "sug-agua",
      nome: "Água sem gás",
      preco: 3.5,
      imagem: null,
      categoria: "Bebidas",
      icon: <LocalDrinkIcon fontSize="small" />,
    },
    {
      id: "sug-refri",
      nome: "Refrigerante lata 350ml",
      preco: 6.5,
      imagem: null,
      categoria: "Bebidas",
      icon: <LocalCafeIcon fontSize="small" />,
    },
    {
      id: "sug-sobremesa",
      nome: "Sobremesa do dia",
      preco: 9.9,
      imagem: null,
      categoria: "Sobremesas",
      icon: <IcecreamIcon fontSize="small" />,
    },
  ];
}

const Carrinho = () => {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [restaurante, setRestaurante] = useState(null);

  const [abertoAgora, setAbertoAgora] = useState(false);
  const [avisoOpen, setAvisoOpen] = useState(false);

  // modal horários
  const [horariosOpen, setHorariosOpen] = useState(false);

  // remover com desfazer
  const [undoOpen, setUndoOpen] = useState(false);
  const [ultimoRemovido, setUltimoRemovido] = useState(null); // { item, index }

  // confirmar delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(null);

  // snackbar "adicionado"
  const [addSnackOpen, setAddSnackOpen] = useState(false);
  const [addSnackMsg, setAddSnackMsg] = useState("");

  // ✅ FIX DO "ÚLTIMO ITEM SOME": mede footer e aplica padding-bottom real + safe-area
  const footerRef = useRef(null);
  const [footerH, setFooterH] = useState(96);

  const navigate = useNavigate();

  // Carrega carrinho e restaurante
  useEffect(() => {
    const dados = localStorage.getItem("carrinho");
    if (dados) {
      const parsed = JSON.parse(dados);
      // normaliza campos e garante preço estável
      const normalized = parsed.map((it) => {
        const quantidade = Number(it.quantidade || 1);
        const precoUnitario =
          typeof it.precoUnitario === "number"
            ? it.precoUnitario
            : quantidade > 0 && typeof it.precoTotal === "number"
            ? it.precoTotal / quantidade
            : 0;

        const precoTotal =
          typeof it.precoTotal === "number" ? it.precoTotal : precoUnitario * quantidade;

        return { ...it, quantidade, precoUnitario, precoTotal };
      });

      setItensCarrinho(normalized);
      localStorage.setItem("carrinho", JSON.stringify(normalized));
    }

    const restauranteData = localStorage.getItem("restauranteSelecionado");
    if (restauranteData) setRestaurante(JSON.parse(restauranteData));
  }, []);

  // Atualiza status aberto/fechado periodicamente
  useEffect(() => {
    const tick = () => setAbertoAgora(isOpenNow(restaurante).open);
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [restaurante]);

  // ✅ mede a altura real do footer (pra não cobrir o último item)
  useLayoutEffect(() => {
    if (!footerRef.current) return;

    const el = footerRef.current;
    const update = () => {
      const h = el.getBoundingClientRect().height || 96;
      setFooterH(Math.ceil(h));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [itensCarrinho.length, abertoAgora]);

  const atualizarCarrinho = (novosItens) => {
    setItensCarrinho(novosItens);
    localStorage.setItem("carrinho", JSON.stringify(novosItens));
  };

  const total = useMemo(
    () => itensCarrinho.reduce((acc, item) => acc + Number(item.precoTotal || 0), 0),
    [itensCarrinho]
  );

  const totalItens = useMemo(
    () => itensCarrinho.reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
    [itensCarrinho]
  );

  const proximaAbertura = useMemo(() => {
    if (!restaurante || abertoAgora) return null;
    return getNextOpenLabel(restaurante);
  }, [restaurante, abertoAgora]);

  const pedirRemover = (index) => {
    setConfirmIndex(index);
    setConfirmOpen(true);
  };

  const removerItemConfirmado = () => {
    const index = confirmIndex;
    setConfirmOpen(false);
    setConfirmIndex(null);

    if (index == null) return;

    const novos = [...itensCarrinho];
    const [removed] = novos.splice(index, 1);

    setUltimoRemovido({ item: removed, index });
    atualizarCarrinho(novos);

    setUndoOpen(true);
  };

  const desfazerRemocao = () => {
    if (!ultimoRemovido) return;

    const novos = [...itensCarrinho];
    novos.splice(ultimoRemovido.index, 0, ultimoRemovido.item);
    atualizarCarrinho(novos);

    setUltimoRemovido(null);
    setUndoOpen(false);
  };

  const alterarQuantidade = (index, delta) => {
    const novos = [...itensCarrinho];
    const item = { ...novos[index] };

    const qtdAtual = Number(item.quantidade || 1);
    const novaQtd = qtdAtual + delta;
    if (novaQtd < 1) return;

    const precoUnitario = Number(item.precoUnitario || 0);
    item.quantidade = novaQtd;
    item.precoTotal = precoUnitario * novaQtd;

    novos[index] = item;
    atualizarCarrinho(novos);
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
      blocos.push({
        titulo: "Sabores",
        opcoes: item.saboresSelecionados.map((s) => `• ${s}`),
      });
    }

    if (item.bordaSelecionada) {
      blocos.push({
        titulo: "Borda",
        opcoes: [
          `• ${item.bordaSelecionada.nome} (+R$ ${Number(
            item.bordaSelecionada.preco || 0
          ).toFixed(2)})`,
        ],
      });
    }

    if (item.adicionalSelecionado) {
      blocos.push({
        titulo: "Adicional",
        opcoes: [
          `• ${item.adicionalSelecionado.nome} (+R$ ${Number(
            item.adicionalSelecionado.preco || 0
          ).toFixed(2)})`,
        ],
      });
    }

    if (item.complementosSelecionados?.length > 0) {
      const opcoes = item.complementosSelecionados.map(
        (comp) => `• ${comp.nome} (+R$ ${Number(comp.preco || 0).toFixed(2)})`
      );
      blocos.push({ titulo: "Complementos", opcoes });
    }

    if (item.tiposExtrasSelecionados && typeof item.tiposExtrasSelecionados === "object") {
      Object.entries(item.tiposExtrasSelecionados).forEach(([tipo, opcoes]) => {
        if (Array.isArray(opcoes) && opcoes.length > 0) {
          blocos.push({
            titulo: tipo,
            opcoes: opcoes.map(
              (op) => `• ${op.nome}${op.preco ? ` (+R$ ${Number(op.preco).toFixed(2)})` : ""}`
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
              <Typography key={i} variant="caption" display="block" ml={1} sx={{ opacity: 0.9 }}>
                {op}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  // HORÁRIOS
  const horariosList = useMemo(() => {
    const hf = restaurante?.horariosFuncionamento;
    if (!hf) return [];
    return diasSemana.map((dia) => {
      const h = hf[dia];
      const label = dia.charAt(0).toUpperCase() + dia.slice(1);
      if (!h || h.fechado || !h.abre || !h.fecha) {
        return { dia: label, texto: "Fechado" };
      }
      return { dia: label, texto: `${h.abre} às ${h.fecha}` };
    });
  }, [restaurante]);

  // SUGESTÕES (upsell)
  const sugestoes = useMemo(() => buildSuggestions(restaurante), [restaurante]);

  const addSugestaoNoCarrinho = (sug) => {
    const preco = Number(sug.preco || 0);
    if (!preco) return;

    // tenta encontrar item “igual” (simples: mesmo id/nome e sem extras)
    const idxExistente = itensCarrinho.findIndex((it) => {
      const sameId = it.id && sug.id ? it.id === sug.id : false;
      const sameNome = (it.nome || "").toLowerCase() === (sug.nome || "").toLowerCase();
      const semExtras =
        !it.saboresSelecionados &&
        !it.bordaSelecionada &&
        !it.adicionalSelecionado &&
        !it.complementosSelecionados &&
        !it.tiposExtrasSelecionados &&
        !it.observacao;

      return (sameId || sameNome) && semExtras;
    });

    const novos = [...itensCarrinho];

    if (idxExistente >= 0) {
      const it = { ...novos[idxExistente] };
      const qtd = Number(it.quantidade || 1) + 1;
      it.quantidade = qtd;
      // mantém precoUnitario estável
      it.precoUnitario = Number(it.precoUnitario || preco);
      it.precoTotal = it.precoUnitario * qtd;
      novos[idxExistente] = it;
    } else {
      novos.push({
        id: sug.id,
        nome: sug.nome,
        imagem: sug.imagem || null,
        quantidade: 1,
        precoUnitario: preco,
        precoTotal: preco,
        // sem extras por padrão
      });
    }

    atualizarCarrinho(novos);

    setAddSnackMsg(`${sug.nome} adicionado ao carrinho ✅`);
    setAddSnackOpen(true);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100dvh"
      sx={{ backgroundColor: "#f5f5f7" }}
    >
      <Helmet>{restaurante ? <title>{restaurante.nome} - Carrinho</title> : null}</Helmet>

      {/* APPBAR */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background: "linear-gradient(90deg, #ff4b8b 0%, #ff7a3d 45%, #ffb347 100%)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/pedido")}
            sx={{ textTransform: "none", fontWeight: 900 }}
          >
            Voltar
          </Button>

          {restaurante && (
            <Box display="flex" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
              <Avatar
                src={restaurante.logoUrl || FALLBACK_IMG}
                alt={restaurante.nome}
                sx={{ width: 36, height: 36, bgcolor: "#fff" }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={900} noWrap sx={{ color: "#fff" }}>
                  {restaurante.nome}
                </Typography>
                {restaurante.enderecoBairro && (
                  <Typography variant="caption" noWrap sx={{ color: "rgba(255,255,255,0.85)" }}>
                    {restaurante.enderecoBairro}
                    {restaurante.enderecoCidade ? ` • ${restaurante.enderecoCidade}` : ""}
                  </Typography>
                )}
              </Box>

              <Chip
                size="small"
                label={abertoAgora ? "Aberto agora" : "Fechado agora"}
                color={abertoAgora ? "success" : "error"}
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 900 }}
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* CONTEÚDO (paddingBottom dinâmico pra não sumir o último item) */}
      <Box
        flex={1}
        overflow="auto"
        px={2}
        pt={2}
        sx={{
          paddingBottom: `calc(${footerH}px + env(safe-area-inset-bottom) + 16px)`,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {!abertoAgora && itensCarrinho.length > 0 && (
          <Alert
            severity="warning"
            variant="outlined"
            sx={{ mb: 2, borderRadius: 2 }}
            icon={<AccessTimeIcon />}
            action={
              <Button
                size="small"
                onClick={() => setHorariosOpen(true)}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Ver horários
              </Button>
            }
          >
            Restaurante fechado agora.
            {proximaAbertura ? ` Reabre: ${proximaAbertura}.` : " Confira os horários."}
          </Alert>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
          <Typography variant="h5" fontWeight={950}>
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
            <Avatar src={FALLBACK_IMG} sx={{ width: 72, height: 72, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={900}>
              Seu carrinho está vazio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Volte ao cardápio e escolha seus itens favoritos.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2, textTransform: "none", borderRadius: 2, fontWeight: 900 }}
              onClick={() => navigate("/pedido")}
            >
              Ver cardápio
            </Button>
          </Box>
        ) : (
          <>
            {/* AÇÕES RÁPIDAS */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Button
                variant="text"
                onClick={() => navigate("/pedido")}
                sx={{ textTransform: "none", fontWeight: 950 }}
              >
                + Adicionar mais itens
              </Button>

              <Button
                variant="text"
                color="inherit"
                startIcon={<AccessTimeIcon />}
                onClick={() => setHorariosOpen(true)}
                sx={{ textTransform: "none", fontWeight: 900, opacity: 0.85 }}
              >
                Horários
              </Button>
            </Stack>

            {/* ITENS DO CARRINHO */}
            {itensCarrinho.map((item, idx) => (
              <Fade in key={idx} timeout={250}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    display: "flex",
                    gap: 2,
                    borderRadius: 3,
                    bgcolor: "#ffffff",
                    border: "1px solid #e7e7ee",
                    boxShadow: "0px 2px 10px rgba(15,23,42,0.06)",
                  }}
                >
                  <Avatar
                    src={item.imagem || FALLBACK_IMG}
                    alt={item.nome}
                    variant="rounded"
                    sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: 2 }}
                  />

                  <Box flex={1} minWidth={0}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box minWidth={0}>
                        <Typography fontWeight={950} noWrap>
                          {item.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          R$ {Number(item.precoUnitario || 0).toFixed(2)} cada
                        </Typography>
                      </Box>

                      <Tooltip title="Remover item">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => pedirRemover(idx)}
                          sx={{ mt: -0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1.5} mt={1} flexWrap="wrap">
                      {/* STEPPER */}
                      <Box
                        display="flex"
                        alignItems="center"
                        sx={{
                          border: "1px solid #e7e7ee",
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "#fafafe",
                        }}
                      >
                        <Tooltip title={Number(item.quantidade || 1) <= 1 ? "Mínimo 1" : "Diminuir"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => alterarQuantidade(idx, -1)}
                              disabled={Number(item.quantidade || 1) <= 1}
                              sx={{ borderRadius: 0 }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Box px={1.25}>
                          <Typography variant="body2" fontWeight={950}>
                            {Number(item.quantidade || 1)}x
                          </Typography>
                        </Box>

                        <Tooltip title="Aumentar">
                          <IconButton
                            size="small"
                            onClick={() => alterarQuantidade(idx, 1)}
                            sx={{ borderRadius: 0 }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Chip
                        size="small"
                        label={`Total: R$ ${Number(item.precoTotal || 0).toFixed(2)}`}
                        sx={{ fontWeight: 950 }}
                      />
                    </Box>

                    {renderExtras(item)}
                  </Box>
                </Paper>
              </Fade>
            ))}

            {/* ✅ SUGESTÕES (UPSELL) */}
            {sugestoes?.length > 0 && (
              <Box mt={1}>
                <Box display="flex" alignItems="baseline" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1" fontWeight={950}>
                    Que tal completar o pedido?
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sugestões rápidas
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1.25,
                    overflowX: "auto",
                    pb: 1,
                    WebkitOverflowScrolling: "touch",
                    scrollSnapType: "x mandatory",
                  }}
                >
                  {sugestoes.slice(0, 12).map((sug) => (
                    <Paper
                      key={sug.id}
                      elevation={0}
                      sx={{
                        minWidth: 240,
                        scrollSnapAlign: "start",
                        p: 1.25,
                        borderRadius: 3,
                        border: "1px solid #e7e7ee",
                        bgcolor: "#fff",
                        boxShadow: "0px 2px 10px rgba(15,23,42,0.05)",
                      }}
                    >
                      <Box display="flex" gap={1.25} alignItems="center">
                        <Avatar
                          variant="rounded"
                          src={sug.imagem || FALLBACK_IMG}
                          sx={{ width: 56, height: 56, borderRadius: 2 }}
                        />
                        <Box flex={1} minWidth={0}>
                          <Typography fontWeight={950} noWrap>
                            {sug.nome}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.25}>
                            <Chip
                              size="small"
                              label={sug.categoria || "Sugestão"}
                              sx={{ fontWeight: 800, opacity: 0.9 }}
                              icon={sug.icon || undefined}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                              R$ {Number(sug.preco || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>

                        <Tooltip title="Adicionar">
                          <IconButton
                            onClick={() => addSugestaoNoCarrinho(sug)}
                            sx={{
                              borderRadius: 2,
                              border: "1px solid #e7e7ee",
                              bgcolor: "#fafafe",
                            }}
                          >
                            <AddShoppingCartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ✅ RODAPÉ FIXO (com safe-area + medição dinâmica) */}
      {itensCarrinho.length > 0 && (
        <Box
          ref={footerRef}
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bgcolor="#ffffff"
          borderTop="1px solid #e7e7ee"
          px={2}
          py={1.5}
          sx={{
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            backdropFilter: "blur(10px)",
          }}
          boxShadow={8}
          zIndex={1200}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}
              >
                {totalItens} item{totalItens !== 1 ? "s" : ""} • Total do pedido
              </Typography>
              <Typography variant="h6" fontWeight={950}>
                R$ {Number(total || 0).toFixed(2)}
              </Typography>
              {!abertoAgora && proximaAbertura && (
                <Typography variant="caption" color="text.secondary">
                  Reabre: {proximaAbertura}
                </Typography>
              )}
            </Box>

            <Box display="flex" gap={1} sx={{ flex: 1, minWidth: 220 }}>
              {!abertoAgora && (
                <Button
                  variant="outlined"
                  onClick={() => setHorariosOpen(true)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 950,
                    borderRadius: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  Ver horários
                </Button>
              )}

              <Button
                variant="contained"
                size="large"
                onClick={handleFinalizarPedido}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2,
                  background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                  "&:hover": {
                    opacity: 0.92,
                    background: "linear-gradient(90deg,#ff4b8b,#ff7a3d,#ffb347)",
                  },
                  ...(abertoAgora ? {} : { opacity: 0.78 }),
                }}
              >
                {abertoAgora ? "Finalizar pedido" : "Restaurante fechado"}
              </Button>
            </Box>
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
          Restaurante fechado no momento. Pedidos só podem ser finalizados no horário de funcionamento.
        </Alert>
      </Snackbar>

      {/* Snackbar desfazer remoção */}
      <Snackbar
        open={undoOpen}
        autoHideDuration={4500}
        onClose={() => setUndoOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={desfazerRemocao}
              sx={{ textTransform: "none", fontWeight: 950 }}
            >
              Desfazer
            </Button>
          }
        >
          Item removido do carrinho.
        </Alert>
      </Snackbar>

      {/* Snackbar item adicionado */}
      <Snackbar
        open={addSnackOpen}
        autoHideDuration={2500}
        onClose={() => setAddSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAddSnackOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {addSnackMsg}
        </Alert>
      </Snackbar>

      {/* Confirmar remoção */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Remover item?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Você pode desfazer logo em seguida.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button color="error" onClick={removerItemConfirmado} sx={{ textTransform: "none", fontWeight: 950 }}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Horários */}
      <Dialog open={horariosOpen} onClose={() => setHorariosOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Horários de funcionamento</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {horariosList.length ? (
              horariosList.map((h) => (
                <Box key={h.dia} display="flex" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" fontWeight={950}>
                    {h.dia}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {h.texto}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Horários não informados.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHorariosOpen(false)} sx={{ textTransform: "none", fontWeight: 950 }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Carrinho;
