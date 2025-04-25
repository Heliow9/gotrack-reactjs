import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Box,
  Alert,
  Divider,
  Grid,
  Snackbar
} from "@mui/material";

const ModalProduto = ({ open, onClose, produto }) => {
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [bordaSelecionada, setBordaSelecionada] = useState(null);
  const [complementosSelecionados, setComplementosSelecionados] = useState([]);
  const [observacao, setObservacao] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [precoTotal, setPrecoTotal] = useState(0);
  const [adicionalSelecionado, setAdicionalSelecionado] = useState("nenhum");
  const [showAlert, setShowAlert] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    let total = 0;
    if (produto.categoriaType === "pizza") {
      const maiorPreco = saboresSelecionados.length > 0
        ? Math.max(...saboresSelecionados.map(nome => {
          const sabor = produto.saboresDisponiveis?.find(s => s.nome === nome);
          return parseFloat(sabor?.preco || 0);
        }))
        : 0;
      total += maiorPreco;
    } else {
      total += produto.precoBase;
    }

    if (bordaSelecionada && bordaSelecionada !== "nenhum") {
      const borda = produto.bordasDisponiveis?.find(b => b.nome === bordaSelecionada);
      total += borda?.preco || 0;
    }

    if (adicionalSelecionado && adicionalSelecionado !== "nenhum") {
      const adicional = produto.adicionais?.find(a => a.nome === adicionalSelecionado);
      total += adicional?.preco || 0;
    }

    complementosSelecionados.forEach(nome => {
      const complemento = produto.complementos?.find(c => c.nome === nome);
      total += complemento?.preco || 0;
    });

    total *= quantidade;
    setPrecoTotal(isNaN(total) || !isFinite(total) ? 0 : total);
  }, [saboresSelecionados, bordaSelecionada, complementosSelecionados, adicionalSelecionado, quantidade, produto]);

  const toggleComplemento = (nome) => {
    setComplementosSelecionados(prev =>
      prev.includes(nome) ? prev.filter(c => c !== nome) : [...prev, nome]
    );
  };

  const toggleSabor = (nome) => {
    if (saboresSelecionados.includes(nome)) {
      setSaboresSelecionados(saboresSelecionados.filter(s => s !== nome));
    } else if (saboresSelecionados.length < 2) {
      setSaboresSelecionados([...saboresSelecionados, nome]);
    }
  };

  const isValid = () => {
    if (produto.categoriaType === "pizza") {
      return saboresSelecionados.length > 0 && bordaSelecionada && adicionalSelecionado;
    }
    return true; // produtos simples sempre válidos
  };


  const handleAddToCart = () => {
    if (!isValid()) {
      setShowAlert(true);
      return;
    }

    const pedido = {
      produtoId: produto.id,
      nome: produto.nome,
      imagem: produto.imagem || null,
      categoriaType: produto.categoriaType,
      saboresSelecionados,
      bordaSelecionada,
      complementosSelecionados,
      adicionalSelecionado,
      observacao,
      quantidade,
      precoTotal,
    };

    // Salvar no localStorage
    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho")) || [];
    carrinhoAtual.push(pedido);
    localStorage.setItem("carrinho", JSON.stringify(carrinhoAtual));

    setShowSnackbar(true);
    onClose();
  };


  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle>
          {produto.nome}
        </DialogTitle>

        <DialogContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Total: R$ {precoTotal.toFixed(2)}
          </Typography>

          {showAlert && (
            <Alert severity="warning" onClose={() => setShowAlert(false)} sx={{ mb: 2 }}>
              Por favor, selecione sabor, borda e adicional para continuar.
            </Alert>
          )}

          {produto.categoriaType === "pizza" && (
            <>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                Sabores (máx 2)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={1}>
                {produto.saboresDisponiveis?.map((sabor, idx) => {
                  const preco = parseFloat(sabor.preco || 0);
                  return (
                    <FormControlLabel
                      key={idx}
                      control={
                        <Checkbox
                          checked={saboresSelecionados.includes(sabor.nome)}
                          onChange={() => toggleSabor(sabor.nome)}
                          disabled={
                            !saboresSelecionados.includes(sabor.nome) &&
                            saboresSelecionados.length >= 2
                          }
                        />
                      }
                      label={
                        <Box display="flex" flexDirection="column">
                          <Typography variant="body2" fontWeight="bold">{sabor.nome}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {preco > 0 ? `+ R$ ${preco.toFixed(2)}` : "Grátis"}
                          </Typography>
                        </Box>
                      }
                    />
                  );
                })}
              </Box>


              <FormControl component="fieldset" sx={{ mt: 3 }}>
                <FormLabel component="legend">Escolha a borda</FormLabel>
                <RadioGroup
                  value={bordaSelecionada || ""}
                  onChange={(e) => setBordaSelecionada(e.target.value)}
                >
                  <FormControlLabel
                    value="nenhum"
                    control={<Radio />}
                    label="Sem borda"
                  />
                  {produto.bordasDisponiveis?.map((b, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={b.nome}
                      control={<Radio />}
                      label={`${b.nome} ${b.preco ? `(+R$ ${b.preco})` : ""}`}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </>
          )}

          {produto.adicionais?.length > 0 && (
            <>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                Adicionais
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControl component="fieldset">
                <RadioGroup
                  value={adicionalSelecionado}
                  onChange={(e) => setAdicionalSelecionado(e.target.value)}
                >
                  <FormControlLabel
                    value="nenhum"
                    control={<Radio />}
                    label="Sem adicional"
                  />
                  {produto.adicionais.map((ad, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={ad.nome}
                      control={<Radio />}
                      label={`${ad.nome} (+R$ ${ad.preco})`}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </>
          )}

          {produto.complementos?.length > 0 && (
            <>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                Complementos
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={1}>
                {produto.complementos.map((comp, idx) => (
                  <FormControlLabel
                    key={idx}
                    control={<Checkbox
                      checked={complementosSelecionados.includes(comp.nome)}
                      onChange={() => toggleComplemento(comp.nome)}
                    />}
                    label={`${comp.nome} (+R$ ${comp.preco})`}
                  />
                ))}
              </Box>
            </>
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Observações"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            sx={{ mt: 3 }}
          />

          <Box display="flex" alignItems="center" gap={2} sx={{ mt: 3 }}>
            <Typography variant="subtitle1">Quantidade:</Typography>
            <Button variant="outlined" onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>-</Button>
            <Typography>{quantidade}</Typography>
            <Button variant="outlined" onClick={() => setQuantidade(quantidade + 1)}>+</Button>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            flexDirection: "column",
            alignItems: "stretch",
            px: 3,
            py: 2,
            borderTop: "1px solid #eee",
            backgroundColor: "#fafafa",
            mt: 2,
          }}
        >
          <Box mb={2} textAlign="center">
            <Typography variant="subtitle2" color="text.secondary">
              Total:
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              R$ {precoTotal.toFixed(2)}
            </Typography>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              fullWidth
              onClick={onClose}
              variant="outlined"
              color="inherit"
              size="large"
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleAddToCart}
              disabled={!isValid()}
              size="large"
            >
              Adicionar
            </Button>
          </Box>
        </DialogActions>

      </Dialog>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message="Produto adicionado com sucesso!"
      />
    </>
  );
};

export default ModalProduto;
