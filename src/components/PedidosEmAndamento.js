import React, { useEffect, useState } from "react";
import {
  Typography,
  List,
  Paper,
  Box,
  Divider,
} from "@mui/material";
import { FaMapMarkerAlt, FaPhone, FaMoneyBillWave } from "react-icons/fa";
import { useMapContext } from "../Context/MapContext";
import axios from 'axios'

const PedidosEmAndamento = () => {
  const { setSelectedPosition } = useMapContext();
  const { setPedidosMap } = useMapContext();
  const [pedidos, setPedidos] = useState([])
  const restauranteId = localStorage.getItem('_id')




  useEffect(() => {
    axios
      .get(`http://localhost:10000/api/pedidos/${restauranteId}`)
      .then((response) => {
        setPedidos(response.data);
        setPedidosMap(response.data)
  
      })
      .catch((error) => {
        console.error("Erro ao buscar pedidos:", error);
      });
  }, [restauranteId]);




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
              onClick={() => setSelectedPosition(pedidos._id)}
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
                    <strong>R$ {pedido.valorTotal}</strong>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </List> : null
      }

    </Box>
  );
};

export default PedidosEmAndamento;
