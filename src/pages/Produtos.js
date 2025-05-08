import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Snackbar
} from "@mui/material";
import { styled } from "@mui/system";
import { Delete } from '@mui/icons-material';

const Input = styled("input")({ display: "none" });

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "Pizza",
    precoBase: "",
    tamanho: "Pequeno",
    disponivel: true,
    imagem: null,
    imagemPreview: null
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");


  const restauranteId = localStorage.getItem("_id");

  const fetchProdutos = async () => {
    const res = await axios.get(`https://gotrackapi.onrender.com/api/produtos/${restauranteId}`);
    setProdutos(res.data);
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "precoBase") {
      const rawValue = value.replace(/[^\d]/g, "");
      setFormData({
        ...formData,
        precoBase: rawValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imagem: file,
        imagemPreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      const formCopy = { ...formData, precoBase: (parseInt(formData.precoBase, 10) / 100).toFixed(2) };
      for (const key in formCopy) {
        if (key !== "imagemPreview") {
          data.append(key, formCopy[key]);
        }
      }
      data.append("restaurante", restauranteId);
      await axios.post("https://gotrackapi.onrender.com/api/produtos", data);
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Verifique os dados e tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://gotrackapi.onrender.com/api/produtos/${id}`);
      fetchProdutos();
      setSnackbarMessage("Produto excluído com sucesso!");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      setSnackbarMessage("Erro ao excluir produto.");
      setSnackbarOpen(true);
    }
  };


  const formatCurrency = (value) => {
    if (!value) return "";
    const cents = value.replace(/\D/g, "");
    const number = parseFloat(cents) / 100;
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  return (
    <Box p={4} bgcolor="#f7f9fc" minHeight="100vh">
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
        🧾 Cadastro de Produtos
      </Typography>

      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nome" name="nome" value={formData.nome} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Descrição" name="descricao" value={formData.descricao} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preço Base"
                name="precoBase"
                value={formatCurrency(formData.precoBase)}
                onChange={handleChange}
                inputProps={{ inputMode: 'numeric' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="categoria-label">Categoria</InputLabel>
                <Select
                  labelId="categoria-label"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  label="Categoria"
                >
                  <MenuItem value="Pizza">Pizza</MenuItem>
                  <MenuItem value="Salgado">Salgado</MenuItem>
                  <MenuItem value="Bebida">Bebida</MenuItem>
                  <MenuItem value="Lanche">Lanche</MenuItem>
                  <MenuItem value="Adicional">Adicional</MenuItem>
                  <MenuItem value="Borda">Borda</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.categoria === "Pizza" && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="tamanho-label">Tamanho</InputLabel>
                  <Select
                    labelId="tamanho-label"
                    name="tamanho"
                    value={formData.tamanho}
                    onChange={handleChange}
                    label="Tamanho"
                  >
                    <MenuItem value="Pequeno">Pequeno</MenuItem>
                    <MenuItem value="Médio">Médio</MenuItem>
                    <MenuItem value="Grande">Grande</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={formData.disponivel} onChange={handleChange} name="disponivel" />}
                label="Disponível para venda"
              />
            </Grid>

            <Grid item xs={12}>
              <label htmlFor="imagem">
                <Input accept="image/*" id="imagem" type="file" onChange={handleFileChange} />
                <Button variant="contained" component="span">
                  Upload Imagem
                </Button>
              </label>
              {formData.imagemPreview && (
                <Box mt={2}>
                  <img src={formData.imagemPreview} alt="Prévia da Imagem" width="120" style={{ borderRadius: 8 }} />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Button variant="contained" color="success" size="large" onClick={handleSubmit}>
                Incluir Produto
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>📦 Produtos Cadastrados</Typography>
      {produtos.length === 0 ? (
        <Typography variant="body1" color="textSecondary">Nenhum produto cadastrado ainda.</Typography>
      ) : (
        produtos.map((produto) => (
          <Card key={produto._id} sx={{ mb: 2, p: 2 }}>
            <CardContent>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item xs={12} md={9}>
                  <Typography variant="h6">{produto.nome}</Typography>
                  <Typography variant="body2" color="textSecondary">{produto.descricao}</Typography>
                  <Typography variant="body2">Preço: R$ {produto.precoBase}</Typography>
                </Grid>
                <Grid item>
                  {produto.imagem && (
                    <img
                      src={produto.imagem.startsWith("http") ? produto.imagem : `${window.location.origin}${produto.imagem}`}
                      alt="Produto"
                      width="100"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleDelete(produto._id)}
                >
                  Excluir
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
      {/* SNACKBAR AQUI */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );

};


export default Produtos;
