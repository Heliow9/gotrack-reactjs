import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const Publico = lazy(() => import("./pages/Publico"));
const Carrinho = lazy(() => import("./pages/Carrinho"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PedidosCliente = lazy(() => import("./pages/PedidosCliente"));
const Acompanhar = lazy(() => import("./pages/Acompanhar"));
const ErroRestaurante = lazy(() => import("./pages/ErroRestaurante"));

const getUltimoSlugRestaurante = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("restauranteSelecionado") || "null");
    const r = raw?.restaurante && typeof raw.restaurante === "object" ? raw.restaurante : raw;
    return r?.slugIdentificador || r?.slug || null;
  } catch {
    return null;
  }
};

const getCaminhoUltimaVitrine = () => {
  const slug = getUltimoSlugRestaurante();
  return slug ? `/p/${slug}` : "/p";
};

const RedirectParaUltimaVitrine = () => <Navigate to={getCaminhoUltimaVitrine()} replace />;

const LoadingPublico = () => {
  const mensagens = useMemo(
    () => [
      "Preparando seu cardápio",
      "Organizando produtos e categorias",
      "Verificando horários e ofertas",
      "Deixando sua experiência pronta",
    ],
    []
  );
  const [indiceMensagem, setIndiceMensagem] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndiceMensagem((atual) => (atual + 1) % mensagens.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [mensagens]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        color: "#fff",
        background:
          "radial-gradient(circle at top left, rgba(255,160,54,.22), transparent 30%), radial-gradient(circle at 85% 15%, rgba(255,59,138,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(11,157,255,.14), transparent 28%), linear-gradient(180deg, #07111e 0%, #050816 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "-20% auto auto -10%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,153,51,.12)",
          filter: "blur(40px)",
          animation: "pulseGlow 7s ease-in-out infinite",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          right: "-8%",
          bottom: "-10%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,59,138,.10)",
          filter: "blur(44px)",
          animation: "pulseGlow 9s ease-in-out infinite reverse",
        },
        "@keyframes pulseGlow": {
          "0%": { transform: "scale(1) translateY(0)", opacity: 0.7 },
          "50%": { transform: "scale(1.1) translateY(14px)", opacity: 1 },
          "100%": { transform: "scale(1) translateY(0)", opacity: 0.7 },
        },
        "@keyframes floatOrb": {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
          "100%": { transform: "translateY(0px)" },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 1080,
          borderRadius: 6,
          overflow: "hidden",
          border: `1px solid ${alpha("#ffffff", 0.1)}`,
          background: `linear-gradient(180deg, ${alpha("#ffffff", 0.09)} 0%, ${alpha(
            "#ffffff",
            0.04
          )} 100%)`,
          backdropFilter: "blur(18px)",
          boxShadow: "0 30px 80px rgba(0,0,0,.35)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(255,160,54,.12), transparent 30%, transparent 70%, rgba(255,59,138,.12))",
            pointerEvents: "none",
          }}
        />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={0}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Box
            sx={{
              flex: 1.05,
              p: { xs: 3, sm: 4, md: 5 },
              borderRight: { md: `1px solid ${alpha("#ffffff", 0.08)}` },
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  label="Movyo Food"
                  size="small"
                  sx={{
                    bgcolor: alpha("#ff9b2d", 0.16),
                    color: "#ffd8ac",
                    border: `1px solid ${alpha("#ff9b2d", 0.28)}`,
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label="Carregamento inteligente"
                  size="small"
                  sx={{
                    bgcolor: alpha("#ffffff", 0.06),
                    color: alpha("#ffffff", 0.8),
                    border: `1px solid ${alpha("#ffffff", 0.08)}`,
                    fontWeight: 600,
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: "22px",
                    display: "grid",
                    placeItems: "center",
                    background:
                      "linear-gradient(135deg, rgba(255,160,54,.95), rgba(255,101,42,.95) 50%, rgba(255,59,138,.95))",
                    boxShadow: "0 20px 40px rgba(255,101,42,.28)",
                    animation: "floatOrb 4s ease-in-out infinite",
                  }}
                >
                  <CircularProgress
                    variant="indeterminate"
                    size={26}
                    thickness={5}
                    sx={{ color: "rgba(255,255,255,.95)" }}
                  />
                </Box>

                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
                    Carregando sua vitrine
                  </Typography>
                  <Typography sx={{ mt: 0.8, color: alpha("#ffffff", 0.72), maxWidth: 520 }}>
                    Estamos preparando uma experiência mais rápida, bonita e segura para o seu cliente.
                  </Typography>
                </Box>
              </Stack>

              <Box>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>{mensagens[indiceMensagem]}</Typography>
                <LinearProgress
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: alpha("#ffffff", 0.08),
                    overflow: "hidden",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, rgba(255,160,54,1) 0%, rgba(255,121,67,1) 50%, rgba(255,59,138,1) 100%)",
                    },
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, color: alpha("#ffffff", 0.62) }}>
                  Isso normalmente leva apenas alguns instantes.
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} useFlexGap flexWrap="wrap">
                {[
                  "Cardápio sincronizado",
                  "Horários verificados",
                  "Checkout preparado",
                ].map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      justifyContent: "flex-start",
                      bgcolor: alpha("#ffffff", 0.05),
                      color: alpha("#ffffff", 0.86),
                      border: `1px solid ${alpha("#ffffff", 0.08)}`,
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 0.95,
              p: { xs: 3, sm: 4, md: 5 },
              bgcolor: alpha("#02050c", 0.22),
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 2.5, color: alpha("#ffffff", 0.9) }}>
              Prévia premium da vitrine
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 4,
                bgcolor: alpha("#ffffff", 0.05),
                border: `1px solid ${alpha("#ffffff", 0.08)}`,
              }}
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    borderRadius: 3,
                    p: 1.5,
                    bgcolor: alpha("#ffffff", 0.04),
                    border: `1px solid ${alpha("#ffffff", 0.06)}`,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Skeleton
                      variant="rounded"
                      width={64}
                      height={64}
                      animation="wave"
                      sx={{ bgcolor: alpha("#ffffff", 0.14), borderRadius: 3 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton
                        variant="text"
                        width="56%"
                        height={28}
                        animation="wave"
                        sx={{ bgcolor: alpha("#ffffff", 0.14) }}
                      />
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={18}
                        animation="wave"
                        sx={{ bgcolor: alpha("#ffffff", 0.1) }}
                      />
                      <Skeleton
                        variant="text"
                        width="48%"
                        height={18}
                        animation="wave"
                        sx={{ bgcolor: alpha("#ffffff", 0.1) }}
                      />
                    </Box>
                  </Stack>
                </Box>

                {[1, 2, 3].map((item) => (
                  <Stack
                    key={item}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      borderRadius: 3,
                      p: 1.4,
                      bgcolor: alpha("#ffffff", 0.04),
                      border: `1px solid ${alpha("#ffffff", 0.06)}`,
                    }}
                  >
                    <Skeleton
                      variant="rounded"
                      width={74}
                      height={74}
                      animation="wave"
                      sx={{ bgcolor: alpha("#ffffff", 0.14), borderRadius: 3 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton
                        variant="text"
                        width={`${72 - item * 8}%`}
                        height={24}
                        animation="wave"
                        sx={{ bgcolor: alpha("#ffffff", 0.14) }}
                      />
                      <Skeleton
                        variant="text"
                        width="94%"
                        height={18}
                        animation="wave"
                        sx={{ bgcolor: alpha("#ffffff", 0.1) }}
                      />
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                        <Skeleton
                          variant="text"
                          width={80}
                          height={24}
                          animation="wave"
                          sx={{ bgcolor: alpha("#ffffff", 0.14) }}
                        />
                        <Skeleton
                          variant="rounded"
                          width={90}
                          height={34}
                          animation="wave"
                          sx={{ bgcolor: alpha("#ffffff", 0.14), borderRadius: 999 }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

const App = () => {
  return (
    <Suspense fallback={<LoadingPublico />}>
      <Routes>
        <Route path="/" element={<RedirectParaUltimaVitrine />} />
        <Route path="/p/:slug" element={<Publico />} />
        <Route path="/p" element={<Publico />} />
        <Route path="/p/carrinho" element={<Carrinho />} />
        <Route path="/p/checkout" element={<Checkout />} />
        <Route path="/p/meus-pedidos/:telefone" element={<PedidosCliente />} />
        <Route path="/p/meus-pedidos" element={<PedidosCliente />} />
        <Route path="/acompanhar/:token" element={<Acompanhar />} />
        <Route path="/erro" element={<ErroRestaurante />} />
        <Route path="*" element={<RedirectParaUltimaVitrine />} />
      </Routes>
    </Suspense>
  );
};

export default App;
