import React from "react";
import {
  Typography,
  List,
  Paper,
  Box,
  Divider,
} from "@mui/material";
import { FaMapMarkerAlt, FaPhone, FaMoneyBillWave } from "react-icons/fa";
import { useMapContext } from "../Context/MapContext";

export const pedidosFake = [
  {
    _id: "1",
    nomeCliente: "João Silva",
    telefoneCliente: "81999998888",
    enderecoCliente: "Rua Jeronimo de Albuquerque 245, Varadouro - Olinda, 53020350",
    itens: [
      { nome: "X-Burger", quantidade: 2 },
      { nome: "Refrigerante Lata", quantidade: 1 },
    ],
    valorTotal: 38.48,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "2",
    nomeCliente: "Maria Souza",
    telefoneCliente: "81988887777",
    enderecoCliente: "Rua Duarte Coelho 349, Santa Tereza, Olinda - 53010-010",
    itens: [
      { nome: "Pizza Calabresa", quantidade: 1 },
      { nome: "Suco Natural", quantidade: 2 },
    ],
    valorTotal: 59.90,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "3",
    nomeCliente: "Carlos Lima",
    telefoneCliente: "81987776666",
    enderecoCliente: "Rua do Sol, 100 - Olinda",
    itens: [
      { nome: "Pastel de Frango", quantidade: 3 },
      { nome: "Coca-Cola 2L", quantidade: 1 },
    ],
    valorTotal: 42.00,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "4",
    nomeCliente: "Ana Beatriz",
    telefoneCliente: "81986665555",
    enderecoCliente: "Rua das Mangueiras, 300 - Recife",
    itens: [
      { nome: "Sanduíche Natural", quantidade: 2 },
      { nome: "Chá Gelado", quantidade: 1 },
    ],
    valorTotal: 28.70,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "5",
    nomeCliente: "Lucas Martins",
    telefoneCliente: "81985554444",
    enderecoCliente: "Av. Norte, 1234 - Recife",
    itens: [
      { nome: "Lasanha", quantidade: 1 },
      { nome: "Refrigerante 600ml", quantidade: 1 },
    ],
    valorTotal: 35.90,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "6",
    nomeCliente: "Fernanda Alves",
    telefoneCliente: "81984443333",
    enderecoCliente: "Rua Imperial, 222 - Recife",
    itens: [
      { nome: "Coxinha", quantidade: 5 },
      { nome: "Suco de Laranja", quantidade: 2 },
    ],
    valorTotal: 31.50,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "7",
    nomeCliente: "Paulo Henrique",
    telefoneCliente: "81983332222",
    enderecoCliente: "Rua Nova, 12 - Olinda",
    itens: [
      { nome: "Hot Dog", quantidade: 2 },
      { nome: "Guaraná", quantidade: 2 },
    ],
    valorTotal: 26.80,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "8",
    nomeCliente: "Juliana Castro",
    telefoneCliente: "81982221111",
    enderecoCliente: "Rua da Harmonia, 77 - Recife",
    itens: [
      { nome: "Bolo de Rolo", quantidade: 1 },
      { nome: "Café", quantidade: 1 },
    ],
    valorTotal: 19.90,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "9",
    nomeCliente: "Ricardo Mendes",
    telefoneCliente: "81981110000",
    enderecoCliente: "Rua Amarela, 9 - Recife",
    itens: [
      { nome: "Esfirra", quantidade: 3 },
      { nome: "Refrigerante Lata", quantidade: 1 },
    ],
    valorTotal: 29.30,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  {
    _id: "10",
    nomeCliente: "Gabriela Nunes",
    telefoneCliente: "81980009999",
    enderecoCliente: "Av. Cruz Cabugá, 890 - Recife",
    itens: [
      { nome: "Tapioca", quantidade: 2 },
      { nome: "Achocolatado", quantidade: 1 },
    ],
    valorTotal: 23.75,
    status: "pendente",
    restauranteId: "67f07aa3cc3cc5b6e0ebd503"
  },
  // ...mais pedidos se necessário
];

const PedidosEmAndamento = () => {
  const { setSelectedPosition } = useMapContext();

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

      <List>
        {pedidosFake.map((pedido) => (
          <Paper
            onClick={() => setSelectedPosition(pedido.localizacao)}
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
