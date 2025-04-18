import React, { useState } from "react";
import { useUI } from "../../src/Context/UIContext";
import Mapa from "../components/Mapa";
import ModalPedido from "../components/ModalPedido";
import PedidosEmAndamento from "../components/PedidosEmAndamento";
import {
  Container,
  Typography,
  Button,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
  Fade,
  Slide,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

const Dashboard = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const { fullscreen, setFullscreen } = useUI();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showToast, setShowToast] = useState(false);
  const [animarSaida, setAnimarSaida] = useState(false);

  const ativarFullscreen = () => {
    setFullscreen(true);
    setShowToast(true);
  };

  const desativarFullscreen = () => {
    setAnimarSaida(true);
    setTimeout(() => {
      setFullscreen(false);
      setAnimarSaida(false);
    }, 300); // tempo da animação de saída
  };

  return fullscreen ? (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      {/* Botão sair do fullscreen */}
      <Box position="absolute" top={16} right={16} zIndex={10}>
        <IconButton
          onClick={desativarFullscreen}
          sx={{
            backgroundColor: "rgba(255,255,255,0.9)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.1)",
              backgroundColor: "rgba(230,230,230,0.9)",
            },
          }}
        >
          <FullscreenExitIcon />
        </IconButton>
      </Box>

      {/* Mapa em tela cheia */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          transition: "all 0.4s ease-in-out",
        }}
      >
        <Mapa />
      </Box>

      {/* Painel flutuante com fade + slide */}
      <Fade in={!animarSaida} timeout={300}>
        <Slide direction="right" in={!animarSaida} timeout={300}>
          <Box
            sx={{
              position: "absolute",
              top: 24,
              left: 24,
              width: "360px",
              maxHeight: "calc(100% - 48px)",
              overflowY: "auto",
              zIndex: 5,
              backgroundColor: "rgba(255,123,0,0.5)",
              borderRadius: 2,
              padding: 2,
              boxSizing: "border-box",
              boxShadow: 4,
            }}
          >
            <PedidosEmAndamento />
          </Box>
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
    <Container maxWidth="xl">
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        mb={3}
        gap={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Painel de Entregas
        </Typography>

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            onClick={() => setModalAberto(true)}
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: "#ff7b00",
              "&:hover": { backgroundColor: "#e86e00" },
              boxShadow: 2,
            }}
          >
            Novo Pedido
          </Button>
          <IconButton
            onClick={ativarFullscreen}
            sx={{
              backgroundColor: "rgba(0,0,0,0.05)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
                backgroundColor: "rgba(0,0,0,0.1)",
              },
            }}
          >
            <FullscreenIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: isMobile ? "400px" : "600px",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 2,
          mb: 3,
          transition: "all 0.3s ease-in-out",
        }}
      >
        <Mapa />
      </Box>

      <PedidosEmAndamento />

      <ModalPedido isOpen={modalAberto} onClose={() => setModalAberto(false)} />
    </Container>
  );
};

export default Dashboard;
