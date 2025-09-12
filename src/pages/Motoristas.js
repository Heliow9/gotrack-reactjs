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
  Alert,
  Box,
  Backdrop,
  Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";
import axios from "axios";

const Motoristas = () => {
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");

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

    fetch(`http://168.75.78.51/api/api/entregadores/byRestaurante/${restauranteId}`, {
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
      restauranteId,
    };

    try {
      await axios.post("http://168.75.78.51/api/api/entregadores/register", body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      setSnackbar({ open: true, message: "Entregador cadastrado com sucesso!", severity: "success" });
      handleClose();
      setNovoMotorista({ nome: "", email: "", senha: "", cpf: "" });
      fetchMotoristas();
    } catch (err) {
      setSnackbar({ open: true, message: "Erro ao cadastrar entregador. Verifique os dados.", severity: "error" });
      console.error("Erro ao cadastrar entregador:", err.response?.data || err.message);
    }
  };

  const handleExcluir = async (id) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`http://168.75.78.51/api/api/entregadordelete/${id}`, {
        headers: { Authorization: token },
      });

      setSnackbar({ open: true, message: "Entregador excluído com sucesso!", severity: "success" });
      fetchMotoristas();
    } catch (err) {
      setSnackbar({ open: true, message: "Erro ao excluir entregador.", severity: "error" });
      console.error("Erro ao excluir entregador:", err.response?.data || err.message);
    }
  };

  const handleTrocarSenha = async () => {
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `http://168.75.78.51/api/entregadores/${motoristaSelecionado._id}/senha`,
        { novaSenha },
        { headers: { Authorization: token } }
      );

      setSnackbar({ open: true, message: "Senha atualizada com sucesso!", severity: "success" });
      setModalSenhaAberto(false);
      setNovaSenha("");
    } catch (error) {
      console.error("Erro ao trocar senha:", error);
      setSnackbar({ open: true, message: "Erro ao atualizar senha.", severity: "error" });
    }
  };

  const filteredMotoristas = motoristas
    .filter((m) =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((m) => (statusFilter ? m.statusConta === statusFilter : true));

  const abrirModalTrocarSenha = (motorista) => {
    setMotoristaSelecionado(motorista);
    setModalSenhaAberto(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gerenciar Entregadores
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Buscar por nome ou email"
          variant="outlined"
          fullWidth
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

        <FormControl fullWidth>
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ minWidth: 180 }}
        >
          Novo Entregador
        </Button>
      </Stack>

      {loading ? (
        <Backdrop open sx={{ color: "#fff", zIndex: 9999 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
      ) : (
        <Paper elevation={4}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMotoristas.length > 0 ? (
                filteredMotoristas.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>{m.nome}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={m.statusConta === "ativo" ? "Ativo" : "Inativo"}
                        color={m.statusConta === "ativo" ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => handleExcluir(m._id)}>
                          Excluir
                        </Button>
                        <Button size="small" color="primary" variant="outlined" startIcon={<LockResetIcon />} onClick={() => abrirModalTrocarSenha(m)}>
                          Trocar Senha
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Nenhum entregador encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Modal Cadastro */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Cadastrar Novo Entregador</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Nome" value={novoMotorista.nome} onChange={(e) => setNovoMotorista({ ...novoMotorista, nome: e.target.value })} />
          <TextField fullWidth margin="dense" label="Email" value={novoMotorista.email} onChange={(e) => setNovoMotorista({ ...novoMotorista, email: e.target.value })} />
          <TextField fullWidth margin="dense" type="password" label="Senha" value={novoMotorista.senha} onChange={(e) => setNovoMotorista({ ...novoMotorista, senha: e.target.value })} />
          <TextField fullWidth margin="dense" label="CPF" value={novoMotorista.cpf} onChange={(e) => setNovoMotorista({ ...novoMotorista, cpf: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleCadastrar}>Cadastrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Trocar Senha */}
      <Dialog open={modalSenhaAberto} onClose={() => setModalSenhaAberto(false)}>
        <DialogTitle>Trocar Senha de {motoristaSelecionado?.nome}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            type="password"
            label="Nova Senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalSenhaAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleTrocarSenha}>Atualizar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Motoristas;
