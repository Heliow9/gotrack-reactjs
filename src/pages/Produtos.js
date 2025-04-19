// src/pages/Produtos.js
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
  MenuItem
} from "@mui/material";
import { styled } from "@mui/system";

const Input = styled("input")({ display: "none" });

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "Pizza",
    precoBase: "",
    tamanhos: [],
    sabores: [],
    adicionais: [],
    disponivel: true,
    imagem: null
  });

  const restauranteId = localStorage.getItem("_id");
  console.log(restauranteId)

  const fetchProdutos = async () => {
    const res = await axios.get(`https://gotrackapi.onrender.com/api/produtos/${restauranteId}`);
    setProdutos(res.data);
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, imagem: e.target.files[0] });
  };

  const handleSubmit = async () => {
    const data = new FormData();
    for (const key in formData) {
      if (Array.isArray(formData[key])) {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    }
    data.append("restaurante", restauranteId);
    await axios.post("/api/produtos", data);
    fetchProdutos();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/produtos/${id}`);
    fetchProdutos();
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Cadastro de Produtos
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nome" name="nome" value={formData.nome} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Descrição" name="descricao" value={formData.descricao} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Preço Base" name="precoBase" value={formData.precoBase} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InputLabel id="categoria-label">Categoria</InputLabel>
              <Select fullWidth labelId="categoria-label" name="categoria" value={formData.categoria} onChange={handleChange}>
                <MenuItem value="Pizza">Pizza</MenuItem>
                <MenuItem value="Bebida">Bebida</MenuItem>
                <MenuItem value="Lanche">Lanche</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tamanhos (nome:preco, separados por vírgula)"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tamanhos: e.target.value
                      .split(",")
                      .map((item) => {
                        const [nome, preco] = item.split(":");
                        return { nome, preco: parseFloat(preco) };
                      })
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sabores (nome:preco, separados por vírgula)"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sabores: e.target.value
                      .split(",")
                      .map((item) => {
                        const [nome, preco] = item.split(":");
                        return { nome, preco: parseFloat(preco) };
                      })
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Adicionais (nome:preco, separados por vírgula)"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adicionais: e.target.value
                      .split(",")
                      .map((item) => {
                        const [nome, preco] = item.split(":");
                        return { nome, preco: parseFloat(preco) };
                      })
                  })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={formData.disponivel} onChange={handleChange} name="disponivel" />}
                label="Disponível"
              />
            </Grid>
            <Grid item xs={12}>
              <label htmlFor="imagem">
                <Input accept="image/*" id="imagem" type="file" onChange={handleFileChange} />
                <Button variant="contained" component="span">
                  Upload Imagem
                </Button>
              </label>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleSubmit}>
                Salvar Produto
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {produtos.map((produto) => (
        <Card key={produto._id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{produto.nome}</Typography>
            <Typography variant="body2">{produto.descricao}</Typography>
            <Typography variant="body2">R$ {produto.precoBase}</Typography>
            {produto.imagem && (
              <img
                src={produto.imagem.startsWith("http") ? produto.imagem : `${window.location.origin}${produto.imagem}`}
                alt="Produto"
                width="120"
              />
            )}
            <Button variant="outlined" color="error" onClick={() => handleDelete(produto._id)}>
              Excluir
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Produtos;