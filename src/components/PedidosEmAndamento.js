import React, { useEffect, useState, useRef } from "react";
import {
  Typography,
  List,
  Paper,
  Box,
  Divider,
  Button,
  Menu,
  MenuItem,
  Chip
} from "@mui/material";
import { FaMapMarkerAlt, FaPhone, FaMoneyBillWave } from "react-icons/fa";
import { useMapContext } from "../Context/MapContext";
import axios from "axios";
import { usePedidos } from "../Context/PedidosContext";
import { io } from "socket.io-client";

const PedidosEmAndamento = () => {
  const { setSelectedPosition, setPedidosMap } = useMapContext();
  const [pedidos, setPedidos] = useState([]);
  const [isSendingPedido, setIsSendingPedido] = useState({});
  const [deliverers, setDeliverers] = useState([]);
  const [anchorEl, setAnchorEl] = useState({});
  const [selectedDeliverer, setSelectedDeliverer] = useState({});
  const { atualizarPedidos } = usePedidos();
  const [selectedPedidos, setSelectedPedidos] = useState([]);
  const [anchorElMulti, setAnchorElMulti] = useState(null);
  const pedidosPorEntregador = 3; // Pode vir da API futuramente
  const socket = useRef(null);

  const restauranteId = localStorage.getItem("_id");

  useEffect(() => {
    socket.current = io("https://gotrackapi.onrender.com");

    socket.current.on("connect", () => {
      console.log("✅ [Dashboard] Socket conectado:", socket.current.id);
      socket.current.emit("joinRestaurante", { restauranteId });



      // Força atualização após 2 segundos
      setTimeout(() => {
        socket.current.emit("joinRestaurante", { restauranteId });
        console.log("🔁 Reemissão manual de joinRestaurante para garantir entrega");
      }, 2000);

    });

    socket.current.on("pedidoAceito", (pedidoAtualizado) => {
      console.log("✅ Pedido aceito recebido no dashboard:", pedidoAtualizado);

      // Atualiza o estado local de pedidos (atualiza só o afetado)
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          p._id === pedidoAtualizado._id ? pedidoAtualizado : p
        )
      );
    });

    socket.current.on("pedidoRecusado", (pedidoAtualizado) => {
      console.log("🔄 Pedido recusado recebido no dashboard:", pedidoAtualizado);

      setPedidos((prev) =>
        prev.map((p) => (p._id === pedidoAtualizado._id ? pedidoAtualizado : p))
      );

      setIsSendingPedido((prev) => ({
        ...prev,
        [pedidoAtualizado._id]: false,
      }));
    });



    socket.current.on("connect_error", (err) => {
      console.error("❌ Erro na conexão com socket:", err.message);
    });

    socket.current.on("deliverersOnline", (data) => {
      console.log("📡 Lista recebida via deliverersOnline:", JSON.stringify(data, null, 2));
      console.log("📦 Tipo da lista recebida:", typeof data);
      console.log("📦 É array?", Array.isArray(data));
      if (Array.isArray(data)) {
        data.forEach((d, i) =>
          console.log(`🚚 Entregador ${i}:`, d, "status:", d.status)
        );
      }
      console.log("📡 Lista recebida via deliverersOnline:", JSON.stringify(data, null, 2));
      console.log("📦 Tipo da lista recebida:", typeof data);
      console.log("📦 É array?", Array.isArray(data));
      if (Array.isArray(data)) {
        data.forEach((d, i) =>
          console.log(`🚚 Entregador ${i}:`, d, "status:", d.status)
        );
      }

      const available = Array.isArray(data)
        ? data.filter((d) => d.status === true)
        : [];

      setDeliverers(available);
      console.log("🟢 Entregadores disponíveis:", available);
    });

    return () => {
      socket.current.disconnect();
      console.log("🔌 Socket do dashboard desconectado");
    };

  }, [restauranteId]);

  useEffect(() => {
    async function handlerGetPedidos() {
      try {
        const response = await axios.get(
          `https://gotrackapi.onrender.com/api/pedidos/${restauranteId}`
        );
        console.log("📦 Pedidos recebidos:", response.data);
        setPedidos(response.data);
        setPedidosMap(response.data);
      } catch (error) {
        console.error("❌ Erro ao buscar pedidos:", error);
      }
    }

    handlerGetPedidos();
  }, [restauranteId, atualizarPedidos]);

  const enviarParaEntregador = (pedidoId) => {
    const deliverer = selectedDeliverer[pedidoId];
    if (deliverer && socket.current) {
      setIsSendingPedido((prev) => ({ ...prev, [pedidoId]: true }));

      console.log(`📤 Enviando pedido ${pedidoId} para ${deliverer.nome}`);

      socket.current.emit("enviarPedido", {
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
              console.log("⏱️ Pedido retornado para 'Pendente'");
              setIsSendingPedido((prev) => ({ ...prev, [pedidoId]: false }));
              atualizarPedidos();
            })
            .catch((err) => console.error("❌ Erro ao atualizar pedido:", err));
        }
      }, 120000);
    }
  };

  const handleMenuClick = (event, pedidoId) => {
    setAnchorEl((prev) => ({ ...prev, [pedidoId]: event.currentTarget }));
  };

  const handleMenuClose = (pedidoId) => {
    setAnchorEl((prev) => ({ ...prev, [pedidoId]: null }));
  };

  const handleDelivererSelect = (pedidoId, deliverer) => {
    console.log(`✅ Entregador selecionado para ${pedidoId}:`, deliverer);
    setSelectedDeliverer((prev) => ({ ...prev, [pedidoId]: deliverer }));
    handleMenuClose(pedidoId);
    enviarParaEntregador(pedidoId);
  };

  const togglePedidoSelecionado = (pedidoId) => {
    setSelectedPedidos((prev) =>
      prev.includes(pedidoId)
        ? prev.filter((id) => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const handleAbrirMenuMulti = (event) => {
    if (selectedPedidos.length === 0) return;
    setAnchorElMulti(event.currentTarget);
  };

  const handleFecharMenuMulti = () => {
    setAnchorElMulti(null);
  };

  const handleEnviarMultiplos = (deliverer) => {
    const pedidosAtivosDoEntregador = pedidos.filter(
      (p) => p.entregador === deliverer._id && p.status !== "entregue"
    ).length;

    const disponivel = pedidosPorEntregador - pedidosAtivosDoEntregador;

    const pedidosParaEnviar = selectedPedidos.slice(0, disponivel);

    pedidosParaEnviar.forEach((pedidoId) => {
      setSelectedDeliverer((prev) => ({ ...prev, [pedidoId]: deliverer }));
      // Chama a função diretamente com o entregador, sem depender do selectedDeliverer
      if (deliverer && socket.current) {
        setIsSendingPedido((prev) => ({ ...prev, [pedidoId]: true }));

        console.log(`📤 Enviando pedido ${pedidoId} para ${deliverer.nome} (envio múltiplo)`);

        socket.current.emit("enviarPedido", {
          pedidoId,
          delivererId: deliverer._id,
          restauranteId,
        });

        setTimeout(() => {
          axios
            .put(`https://gotrackapi.onrender.com/api/pedidos/${pedidoId}`, {
              status: "pendente",
            })
            .then(() => {
              console.log(`⏱️ Pedido ${pedidoId} retornado para 'pendente'`);
              setIsSendingPedido((prev) => ({ ...prev, [pedidoId]: false }));
              atualizarPedidos();
            })
            .catch((err) => console.error("❌ Erro ao atualizar pedido:", err));
        }, 120000);
      }
    });


    handleFecharMenuMulti();
    setSelectedPedidos([]);
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
      {selectedPedidos.length > 0 && (
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={handleAbrirMenuMulti}
          disabled={deliverers.length === 0}
        >
          Escolher entregador ({selectedPedidos.length} pedidos)
        </Button>
      )}
      {pedidos.length > 0 ? (
        <>
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
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight="bold" color="#ff7b00">
                    {pedido.nomeCliente}
                  </Typography>
                  {pedido.origem === "ifood" && (
                    <Chip label="iFood" size="small" color="error" />
                  )}
                </Box>
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
                {pedido.status?.toLowerCase() === "pendente" && (
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(e) => handleMenuClick(e, pedido._id)}
                      disabled={!!isSendingPedido[pedido._id] || deliverers.length === 0}
                    >
                      {isSendingPedido[pedido._id]
                        ? "Enviando..."
                        : "Escolher Entregador"}
                    </Button>
                    <Typography variant="caption" color="gray">
                      {deliverers.length === 0 && "Nenhum entregador disponível"}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </List>

        </>

      ) : (
        <Typography variant="body1" color="gray" sx={{ ml: 2 }}>
          Nenhum pedido em andamento.
        </Typography>
      )}

      {/* Menu para seleção de entregador */}
      {pedidos.map((pedido) => (
        <Menu
          anchorEl={anchorElMulti}
          open={Boolean(anchorElMulti)}
          onClose={handleFecharMenuMulti}
        >
          {deliverers.map((deliverer) => {
            const pedidosAtivos = pedidos.filter(
              (p) => p.entregador === deliverer._id && p.status !== "entregue"
            ).length;

            return (
              <MenuItem
                key={deliverer._id}
                onClick={() => handleEnviarMultiplos(deliverer)}
                disabled={pedidosAtivos >= pedidosPorEntregador}
              >
                <Typography variant="body2">
                  {deliverer.nome} ({pedidosAtivos}/{pedidosPorEntregador})
                </Typography>
              </MenuItem>
            );
          })}
        </Menu>

      ))}
    </Box>
  );
};

export default PedidosEmAndamento;