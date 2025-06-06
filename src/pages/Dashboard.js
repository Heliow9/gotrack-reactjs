import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  useMediaQuery,
  useTheme,
  Fade,
  Slide,
  Snackbar,
  Paper,
  IconButton,
} from "@mui/material";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useUI } from "../../src/Context/UIContext";
import Mapa from "../components/Mapa";
import ModalPedido from "../components/ModalPedido";
import PedidosEmAndamento from "../components/PedidosEmAndamento";


const Dashboard = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const { fullscreen, setFullscreen } = useUI();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showToast, setShowToast] = useState(false);
  const [animarSaida, setAnimarSaida] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setModalAberto(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const ativarFullscreen = () => {
    setFullscreen(true);
    setShowToast(true);
  };

  const desativarFullscreen = () => {
    setAnimarSaida(true);
    setTimeout(() => {
      setFullscreen(false);
      setAnimarSaida(false);
    }, 300);
  };



  return fullscreen ? (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        bgcolor: "#f5f5f5",
        overflow: "hidden",
      }}
    >
      {/* Indicador visual no topo */}
      <Fade in={!animarSaida} timeout={300}>
        <Box
          position="absolute"
          top={8}
          left="50%"
          zIndex={15}
          sx={{
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontSize: 12,
            opacity: 0.9,
          }}
        >
          Modo Tela Cheia Ativado
        </Box>
      </Fade>

      {/* Botão de sair do fullscreen */}
      <Fade in={!animarSaida} timeout={300}>
        <Box position="absolute" top={16} right={16} zIndex={20}>
          <IconButton
            onClick={desativarFullscreen}
            sx={{
              backgroundColor: "#fff",
              boxShadow: 2,
              "&:hover": {
                transform: "scale(1.1)",
                backgroundColor: "#f0f0f0",
              },
            }}
          >
            <FullscreenExitIcon />
          </IconButton>
        </Box>
      </Fade>

      {/* Mapa em fullscreen */}
      <Box sx={{ position: "absolute", inset: 0 }}>
        <Mapa />
      </Box>

      {/* Painel lateral de pedidos */}
      <Fade in={!animarSaida} timeout={300}>
        <Slide direction="right" in={!animarSaida} timeout={300}>
          <Paper
            elevation={3}
            sx={{
              position: "absolute",
              top: 24,
              left: 24,
              width: { xs: "90vw", sm: "360px" },
              maxHeight: "calc(100% - 48px)",
              overflowY: "auto",
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(255,255,255,0.8)",
              borderRadius: 2,
              p: 2,
              zIndex: 10,
            }}
          >
            <PedidosEmAndamento />
          </Paper>
        </Slide>
      </Fade>

      <Snackbar
        open={showToast}
        autoHideDuration={2000}
        onClose={() => setShowToast(false)}
        message="Modo fullscreen ativado"
      />
    </Box>
  ) : (
    <Container maxWidth="xl" sx={{ pt: 0 }}>
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          height: isMobile ? "400px" : "600px",
          borderRadius: 3,
          overflow: "hidden",
          mb: 4,
        }}
      >
        <Mapa />
      </Paper>

      <ModalPedido isOpen={modalAberto} onClose={() => setModalAberto(false)} />
    </Container>
  );
};

export default Dashboard;
