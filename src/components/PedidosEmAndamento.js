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
import axios from 'axios';
import { usePedidos } from '../Context/PedidosContext';
import io from 'socket.io-client';

const PedidosEmAndamento = () => {
  const { setSelectedPosition } = useMapContext();
  const { setPedidosMap } = useMapContext();
  const [pedidos, setPedidos] = useState([]);
  const [isSendingPedido, setIsSendingPedido] = useState({}); // Estado para controlar se um pedido está sendo enviado
  const [deliverers, setDeliverers] = useState([]); // Lista de entregadores disponíveis
  const [anchorEl, setAnchorEl] = useState(null); // Controla o menu de seleção do entregador
  const [selectedDeliverer, setSelectedDeliverer] = useState(null); // Entregador selecionado

  const restauranteId = localStorage.getItem('_id');
  const socket = io('http://localhost:10000'); // Adapte para sua URL de socket

  const { atualizarPedidos } = usePedidos();

  useEffect(() => {
    async function handlerGetPedidos() {
      await axios
        .get(`http://localhost:10000/api/pedidos/${restauranteId}`)
        .then((response) => {
          setPedidos(response.data);
          setPedidosMap(response.data);
        })
        .catch((error) => {
          console.error("Erro ao buscar pedidos:", error);
        });
    }

    handlerGetPedidos();
  }, [restauranteId, atualizarPedidos]);

  // Obter entregadores online com status "true"
  useEffect(() => {
    socket.emit('getDeliverersOnline'); // Solicita entregadores online

    socket.on('deliverersOnline', (data) => {
      const availableDeliverers = data.filter((deliverer) => deliverer.status === 'true');
      setDeliverers(availableDeliverers);
    });

    return () => {
      socket.off('deliverersOnline');
    };
  }, []);

  const enviarParaEntregador = (pedidoId) => {
    if (selectedDeliverer) {
      setIsSendingPedido((prevState) => ({
        ...prevState,
        [pedidoId]: true, // Marca esse pedido como "em envio"
      }));

      // Envia o pedido para o entregador escolhido via socket
      socket.emit('enviarPedido', { pedidoId, delivererId: selectedDeliverer._id, restauranteId });

      // Inicia contagem de 2 minutos para aguardar a resposta do entregador
      setTimeout(() => {
        if (isSendingPedido[pedidoId]) {
          // Caso o entregador não tenha respondido em 2 minutos, define o status como Pendente
          axios.put(`http://localhost:10000/api/pedidos/${pedidoId}`, { status: 'Pendente' })
            .then(() => {
              console.log("Pedido retornado para 'Pendente'");
              setIsSendingPedido((prevState) => ({
                ...prevState,
                [pedidoId]: false, // Marca o pedido como não em envio
              }));
              atualizarPedidos(); // Atualiza os pedidos no painel
            })
            .catch((error) => console.error("Erro ao atualizar o pedido:", error));
        }
      }, 120000); // 120000 ms = 2 minutos
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget); // Abre o menu para selecionar o entregador
  };

  const handleMenuClose = () => {
    setAnchorEl(null); // Fecha o menu
  };

  const handleDelivererSelect = (deliverer) => {
    setSelectedDeliverer(deliverer);
    setAnchorEl(null); // Fecha o menu após selecionar o entregador
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 100px)",
        overflowY: "auto",
        paddingRight: 1,
        '&::-webkit-scrollbar': {
          width: 0,
          height: 0,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'transparent',
        },
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE e Edge
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
      {
        pedidos.length > 0 ? <List>
          {pedidos.map((pedido) => (
            <Paper
              onClick={() => setSelectedPosition(pedido._id)}
              key={pedido._id}
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
                {pedido.itens.map((item, index) => (
                  <Typography key={index} variant="body2">
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

              {pedido.status === 'pendente' && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleMenuClick}
                    disabled={isSendingPedido[pedido._id] || deliverers.length === 0}
                  >
                    {isSendingPedido[pedido._id] ? 'Enviando...' : 'Escolher Entregador'}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    {deliverers.map((deliverer) => (
                      <MenuItem key={deliverer._id} onClick={() => handleDelivererSelect(deliverer)}>
                        {deliverer.nome}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              )}
            </Paper>
          ))}
        </List> : <Typography variant="body1" color="gray">Nenhum pedido em andamento.</Typography>
      }

    </Box>
  );
};

export default PedidosEmAndamento;
