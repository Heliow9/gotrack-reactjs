import React from "react";
import {
  Typography,
  List,
  Paper,
  Box,
  Divider,
} from "@mui/material";
import { FaMapMarkerAlt, FaPhone, FaMoneyBillWave } from "react-icons/fa";


const pedidosFake = [
  {
    _id: "1",
    nomeCliente: "João Silva",
    telefoneCliente: "(81) 91234-5678",
    endereco: "Rua das Flores, 123 - Recife",
    itens: [
      { nome: "Hambúrguer", quantidade: 2, precoUnitario: 18.5 },
      { nome: "Batata Frita", quantidade: 1, precoUnitario: 10 },
    ],
    valorTotal: 47,
    status: "pendente",
  },
  {
    _id: "2",
    nomeCliente: "Maria Silva",
    telefoneCliente: "(81) 91234-5678",
    endereco: "Rua das Flores, 123 - Recife",
    itens: [
      { nome: "Hambúrguer", quantidade: 2, precoUnitario: 18.5 },
      { nome: "Batata Frita", quantidade: 1, precoUnitario: 10 },
    ],
    valorTotal: 47,
    status: "pendente",
  },
  {
    _id: "3",
    nomeCliente: "Michael Ramalho",
    telefoneCliente: "(81) 91234-5678",
    endereco: "Rua das Flores, 123 - Recife",
    itens: [
      { nome: "Hambúrguer", quantidade: 2, precoUnitario: 18.5 },
      { nome: "Batata Frita", quantidade: 1, precoUnitario: 10 },
    ],
    valorTotal: 47,
    status: "pendente",
  },
  
];

const PedidosEmAndamento = () => {
    return (
      <Box
        sx={{
          height: "calc(100vh - 100px)",
          overflowY: "auto",
          paddingRight: 1,
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
  
        <List>
          {pedidosFake.map((pedido) => (
            <Paper
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
                <Typography variant="body2">{pedido.endereco}</Typography>
              </Box>
  
              <Box display="flex" alignItems="center" mb={0.5}>
                <FaPhone size={14} style={{ marginRight: 6 }} />
                <Typography variant="body2">{pedido.telefoneCliente}</Typography>
              </Box>
  
              <Divider sx={{ my: 1 }} />
  
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
                    <strong>R$ {pedido.valorTotal.toFixed(2)}</strong>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </List>
      </Box>
    );
  };
  
  export default PedidosEmAndamento;