import React, { useEffect, useState } from "react";
import {
  Typography,
  List,
  Paper,
  Box,
  Divider,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { FaMapMarkerAlt, FaPhone, FaMoneyBillWave } from "react-icons/fa";
import { useMapContext } from "../Context/MapContext";
import axios from "axios";
import { usePedidos } from "../Context/PedidosContext";
import io from "socket.io-client";

const PedidosEmAndamento = () => {
  const { setSelectedPosition, setPedidosMap } = useMapContext();
  const [pedidos, setPedidos] = useState([]);
  const [isSendingPedido, setIsSendingPedido] = useState({});
  const [deliverers, setDeliverers] = useState([]);
  const [anchorEl, setAnchorEl] = useState({}); // Um anchorEl por pedido
  const [selectedDeliverer, setSelectedDeliverer] = useState({}); // Seleção por pedido
  const [isOnline, setIsOnline] = useState(false); // Controle de status online do entregador

  const restauranteId = localStorage.getItem("_id");
  const socket = io("https://gotrackapi.onrender.com");
  const { atualizarPedidos } = usePedidos();

  useEffect(() => {
    async function handlerGetPedidos() {
      try {
        const response = await axios.get(
          `https://gotrackapi.onrender.com/api/pedidos/${restauranteId}`
        );
        setPedidos(response.data);
        setPedidosMap(response.data);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    }

    handlerGetPedidos();
  }, [restauranteId, atualizarPedidos]);

  useEffect(() => {
    socket.emit("getDeliverersOnline");

    socket.on("deliverersOnline", (data) => {
      const availableDeliverers = data.filter((d) => d.status === "true");
      setDeliverers(availableDeliverers);
    });

    // Emitindo evento para quando o entregador entrar online
    socket.emit("joinRestaurante", { restauranteId });
    socket.emit("joinEntregador", { entregadorId: restauranteId });

    return () => {
      socket.off("deliverersOnline");
      socket.off("joinRestaurante");
      socket.off("joinEntregador");
    };
  }, []);

  const enviarParaEntregador = (pedidoId) => {
    const deliverer = selectedDeliverer[pedidoId];
    if (deliverer) {
      setIsSendingPedido((prev) => ({ ...prev, [pedidoId]: true }));
      socket.emit("enviarPedido", {
        pedidoId,
        delivererId: deliverer._id,
        restauranteId,
      });

      setTimeout(() => {
        if (isSendingPedido[pedidoId]) {
          axios
            .put(`https://gotrackapi.onrender.com/api/pedidos/${pedidoId}`, {
              status: "Pendente",
            })
            .then(() => {
              console.log("Pedido retornado para 'Pendente'");
              setIsSendingPedido((prev) => ({ ...prev, [pedidoId]: false }));
              atualizarPedidos();
            })
            .catch((err) => console.error("Erro ao atualizar o pedido:", err));
        }
      }, 120000); // 2 minutos de timeout
    }
  };

  const handleMenuClick = (event, pedidoId) => {
    setAnchorEl((prev) => ({ ...prev, [pedidoId]: event.currentTarget }));
  };

  const handleMenuClose = (pedidoId) => {
    setAnchorEl((prev) => ({ ...prev, [pedidoId]: null }));
  };

  const handleDelivererSelect = (pedidoId, deliverer) => {
    setSelectedDeliverer((prev) => ({ ...prev, [pedidoId]: deliverer }));
    handleMenuClose(pedidoId);
    enviarParaEntregador(pedidoId);
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 100px)",
        overflowY: "auto",
        paddingRight: 1,
        "&::-webkit-scrollbar": { width: 0, height: 0 },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        gutterBottom
        sx={{ color: "#fff", mb: 2, ml: 1 }}
      >
        Pedidos em Andamento
      </Typography>
      {pedidos.length > 0 ? (
        <List>
          {pedidos.map((pedido) => (
            <Paper
              key={pedido._id}
              onClick={() => setSelectedPosition(pedido._id)}
              elevation={4}
              sx={{
                backgroundColor: "#fff",
                borderRadius: 3,
                padding: 2,
                mb: 2,
                mx: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="#ff7b00">
                {pedido.nomeCliente}
              </Typography>
              <Box display="flex" alignItems="center" mt={1} mb={0.5}>
                <FaMapMarkerAlt size={14} style={{ marginRight: 6 }} />
                <Typography variant="body2">{pedido.enderecoCliente}</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={0.5}>
                <FaPhone size={14} style={{ marginRight: 6 }} />
                <Typography variant="body2">{pedido.telefoneCliente}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box mb={1}>
                {pedido.itens.map((item, i) => (
                  <Typography key={i} variant="body2">
                    {item.quantidade}x {item.nome}
                  </Typography>
                ))}
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Status:{" "}
                  <strong style={{ color: "#ff7b00", textTransform: "capitalize" }}>
                    {pedido.status}
                  </strong>
                </Typography>
                <Box display="flex" alignItems="center">
                  <FaMoneyBillWave size={14} style={{ marginRight: 6 }} />
                  <Typography variant="body2">
                    <strong> {pedido.valorTotal}</strong>
                  </Typography>
                </Box>
              </Box>
              {pedido.status === "pendente" && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={(e) => handleMenuClick(e, pedido._id)}
                    disabled={isSendingPedido[pedido._id] || deliverers.length === 0}
                  >
                    {isSendingPedido[pedido._id]
                      ? "Enviando..."
                      : "Escolher Entregador"}
                  </Button>
                  <Menu
                    anchorEl={anchorEl[pedido._id] || null}
                    open={Boolean(anchorEl[pedido._id])}
                    onClose={() => handleMenuClose(pedido._id)}
                  >
                    {deliverers.map((deliverer) => (
                      <MenuItem
                        key={deliverer._id}
                        onClick={() => handleDelivererSelect(pedido._id, deliverer)}
                      >
                        {deliverer.nome}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              )}
            </Paper>
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="gray" sx={{ ml: 2 }}>
          Nenhum pedido em andamento.
        </Typography>
      )}
    </Box>
  );
};

export default PedidosEmAndamento;
