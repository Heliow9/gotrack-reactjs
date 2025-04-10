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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import axios from 'axios'; // Certifique-se de importar o axios no topo
import DeleteIcon from '@mui/icons-material/Delete';

const Motoristas = () => {
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal
  const [open, setOpen] = useState(false);
  const [novoMotorista, setNovoMotorista] = useState({
    nome: "",
    email: "",
    senha: "",
    cpf: ""
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const fetchMotoristas = () => {
    const restauranteId = localStorage.getItem("_id");
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
  };

  useEffect(() => {
    fetchMotoristas();
  }, []);

  const handleCadastrar = async () => {
    const restauranteId = localStorage.getItem("_id");
    const token = localStorage.getItem("token");

    const body = {
      ...novoMotorista,
      restauranteId, // aqui deve ser "restaurante", como está no seu schema
    };

    try {
      const response = await axios.post("https://gotrackapi.onrender.com/register", body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      setSnackbar({
        open: true,
        message: "Entregador cadastrado com sucesso!",
        severity: "success",
      });

      handleClose();
      setNovoMotorista({ nome: "", email: "", senha: "", cpf: "" });
      fetchMotoristas();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Erro ao cadastrar entregador. Verifique os dados.",
        severity: "error",
      });

      console.error("Erro ao cadastrar entregador:", err.response?.data || err.message);
    }
  };

  const handleExcluir = async (id) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`https://gotrackapi.onrender.com/entregadordelete/${id}`, {
        headers: { Authorization: token },
      });

      setSnackbar({
        open: true,
        message: "Entregador excluído com sucesso!",
        severity: "success",
      });

      // Atualiza a lista
      fetchMotoristas();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Erro ao excluir entregador.",
        severity: "error",
      });

      console.error("Erro ao excluir entregador:", err.response?.data || err.message);
    }
  };




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
        onClick={handleOpen}
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
                <TableCell>Ações</TableCell>
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
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleExcluir(moto._id)}
                      startIcon={<DeleteIcon />}

                    >
                      Excluir
                    </Button>
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

      {/* Modal de cadastro */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Novo Entregador</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nome"
            fullWidth
            value={novoMotorista.nome}
            onChange={(e) => setNovoMotorista({ ...novoMotorista, nome: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={novoMotorista.email}
            onChange={(e) => setNovoMotorista({ ...novoMotorista, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Senha"
            type="password"
            fullWidth
            value={novoMotorista.senha}
            onChange={(e) => setNovoMotorista({ ...novoMotorista, senha: e.target.value })}
          />
          <TextField
            margin="dense"
            label="CPF"
            fullWidth
            value={novoMotorista.cpf}
            onChange={(e) => setNovoMotorista({ ...novoMotorista, cpf: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleCadastrar} variant="contained" color="primary">Cadastrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Motoristas;
