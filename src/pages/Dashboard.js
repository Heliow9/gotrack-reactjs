import React, { useState } from "react";
import Mapa from "../components/Mapa";
import ModalPedido from "../components/ModalPedido";
import {
  Container,
  Typography,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const Dashboard = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // <600px

  return (
    <Container maxWidth="x1" >
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        mb={3}
        gap={2}
      >
        <Typography variant="h6" fontWeight="bold">
         Painel de Entregadores
        </Typography>

        <Button
          variant="contained"
          onClick={() => setModalAberto(true)}
          sx={{
            backgroundColor: "#ff7b00",
            "&:hover": { backgroundColor: "#e86e00" },
          }}
        >
          + Novo Pedido
        </Button>
      </Box>

      <Box
        className="mapa-wrapper"
        sx={{
          width: "100%",
          height: isMobile ? "400px" : "600px",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 2,
        }}
      >
        <Mapa />
      </Box>

      <ModalPedido isOpen={modalAberto} onClose={() => setModalAberto(false)} />
    </Container>
  );
};

export default Dashboard;
