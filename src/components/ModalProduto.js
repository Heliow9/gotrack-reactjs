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
  Alert
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

  useEffect(() => {
    let total = 0;
    if (produto.categoriaType === "pizza") {
      const selectedSabores = saboresSelecionados.map(nome => produto.saboresDisponiveis?.find(s => s.nome === nome)).filter(Boolean);
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

    if (bordaSelecionada) {
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

    total = total * quantidade;
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
    return saboresSelecionados.length > 0 && bordaSelecionada && adicionalSelecionado;
  };

  const handleAddToCart = () => {
    if (!isValid()) {
      setShowAlert(true);
      return;
    }
    const pedido = {
      produtoId: produto.id,
      nome: produto.nome,
      categoriaType: produto.categoriaType,
      saboresSelecionados,
      bordaSelecionada,
      complementosSelecionados,
      adicionalSelecionado,
      observacao,
      quantidade,
      precoTotal,
    };
    console.log("Pedido adicionado:", pedido);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{produto.nome}<Typography variant="h6" sx={{ mt: 2 }}>
        Total: R$ {precoTotal.toFixed(2)}
      </Typography></DialogTitle>

      <DialogContent>
        {showAlert && (
          <Alert severity="warning" onClose={() => setShowAlert(false)} sx={{ mb: 2 }}>
            Por favor, selecione sabor, borda e adicional para continuar.
          </Alert>
        )}

        {produto.categoriaType === "pizza" && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
              Sabores (até 2):
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {produto.saboresDisponiveis?.map((sabor, idx) => (
                <FormControlLabel
                  key={idx}
                  control={<Checkbox
                    checked={saboresSelecionados.includes(sabor.nome)}
                    onChange={() => toggleSabor(sabor.nome)}
                    disabled={!saboresSelecionados.includes(sabor.nome) && saboresSelecionados.length >= 2}
                  />}
                  label={sabor.nome}
                />
              ))}
            </Box>

            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">Escolha a borda</FormLabel>
              <RadioGroup
                value={bordaSelecionada || ""}
                onChange={(e) => setBordaSelecionada(e.target.value)}
              >
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
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">Adicionais</FormLabel>
              <RadioGroup
                value={adicionalSelecionado}
                onChange={(e) => setAdicionalSelecionado(e.target.value)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
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
          </Box>
        )}

        {produto.complementos?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Complementos:
            </Typography>
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
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={2}
          label="Observações"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          sx={{ mt: 2 }}
        />

        <TextField
          type="number"
          label="Quantidade"
          value={quantidade}
          onChange={(e) => {
            const valor = parseInt(e.target.value);
            setQuantidade(isNaN(valor) || valor < 1 ? 1 : valor);
          }}
          inputProps={{ min: 1 }}
          sx={{ mt: 2 }}
          fullWidth
        />

        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
          Total: R$ {precoTotal.toFixed(2)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleAddToCart} disabled={!isValid()}>
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalProduto;
