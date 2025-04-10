import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

const Motoristas = () => {
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const restauranteId = localStorage.getItem('_id');
    const token = localStorage.getItem("token");
    fetch(`https://gotrackapi.onrender.com/byRestaurante/${restauranteId}`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => {
        setMotoristas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar entregadores:", err);
        setLoading(false);
      });
  }, []);

  const filteredMotoristas = motoristas
    .filter((moto) =>
      moto.nome.toLowerCase().includes(search.toLowerCase()) ||
      moto.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((moto) =>
      statusFilter ? moto.statusConta === statusFilter : true
    );

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Motoristas
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Cadastro, rastreamento e controle de entregadores aqui.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        sx={{ mb: 2 }}
        onClick={() => console.log("Abrir modal de cadastro")}
      >
        Novo Motorista
      </Button>

      {/* Filtros */}
      <TextField
        label="Buscar entregador"
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          label="Status"
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ativo">Ativo</MenuItem>
          <MenuItem value="inativo">Inativo</MenuItem>
        </Select>
      </FormControl>

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMotoristas.length > 0 ? (
                filteredMotoristas.map((moto) => (
                  <TableRow key={moto._id}>
                    <TableCell>{moto.nome}</TableCell>
                    <TableCell>{moto.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={moto.statusConta === "ativo" ? "Ativo" : "Inativo"}
                        color={moto.statusConta === "ativo" ? "success" : "default"}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Nenhum entregador encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
};

export default Motoristas;
