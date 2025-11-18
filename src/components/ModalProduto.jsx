import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, TextField, FormControlLabel, Checkbox, RadioGroup,
  Radio, FormControl, Box, Alert, Snackbar
} from "@mui/material";

const ModalProduto = ({ open, onClose, produto }) => {
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [bordaSelecionada, setBordaSelecionada] = useState("nenhum");
  const [complementosSelecionados, setComplementosSelecionados] = useState([]);
  const [adicionalSelecionado, setAdicionalSelecionado] = useState("nenhum");
  const [tiposExtrasSelecionados, setTiposExtrasSelecionados] = useState({});
  const [observacao, setObservacao] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [precoTotal, setPrecoTotal] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    let total = produto.precoBase || 0;

    if (produto.categoriaType === "pizza" && saboresSelecionados.length > 0) {
      const precos = saboresSelecionados.map(nome => {
        const sabor = produto.saboresDisponiveis?.find(s => s.nome === nome);
        return parseFloat(sabor?.preco || 0);
      });

      if (produto.calculoPrecoPor === "media") {
        const soma = precos.reduce((acc, v) => acc + v, 0);
        total = soma / precos.length;
      } else {
        total = Math.max(...precos);
      }
    }

    if (bordaSelecionada !== "nenhum") {
      const borda = produto.bordasDisponiveis?.find(b => b.nome === bordaSelecionada);
      total += parseFloat(borda?.preco || 0);
    }

    if (adicionalSelecionado !== "nenhum") {
      const adicional = produto.adicionais?.find(a => a.nome === adicionalSelecionado);
      total += parseFloat(adicional?.preco || 0);
    }

    complementosSelecionados.forEach(nome => {
      const comp = produto.complementos?.find(c => c.nome === nome);
      total += parseFloat(comp?.preco || 0);
    });

    Object.entries(tiposExtrasSelecionados).forEach(([_, itens]) => {
      if (Array.isArray(itens)) {
        for (const item of itens) {
          const preco = typeof item?.preco === "number" ? item.preco : parseFloat(item?.preco || 0);
          total += preco;
        }
      }
    });


    total *= quantidade;
    setPrecoTotal(Number.isFinite(total) ? total : 0);
  }, [saboresSelecionados, bordaSelecionada, adicionalSelecionado, complementosSelecionados, tiposExtrasSelecionados, quantidade]);

  useEffect(() => {
    if (produto?.saboresDisponiveis?.length === 1) {
      setSaboresSelecionados([produto.saboresDisponiveis[0].nome]);
    }

    const autoSelectExtras = {};
    produto?.tiposExtras?.forEach(tipo => {
      if (tipo.tipoSelecion === "unico" && tipo.itens?.length === 1) {
        autoSelectExtras[tipo.nome] = [tipo.itens[0]];
      }
      if (tipo.tipoSelecion === "multiplo" && tipo.obrigatorio && tipo.minimoSelecionados > 0) {
        autoSelectExtras[tipo.nome] = tipo.itens?.slice(0, tipo.minimoSelecionados) || [];
      }
    });
    setTiposExtrasSelecionados(autoSelectExtras);
  }, [produto]);

  const isValid = () => {
    if (produto.categoriaType === "pizza") {
      const requiredCount = produto.maxSabores || 2;
      if (produto.saboresDisponiveis?.length > 1 && saboresSelecionados.length !== requiredCount) return false;
      if (produto.saboresDisponiveis?.length === 1 && saboresSelecionados.length !== 1) return false;
    }

    const tipos = produto.tiposExtras || [];
    for (const tipo of tipos) {
      const selecionados = tiposExtrasSelecionados[tipo.nome] || [];
      if (tipo.obrigatorio && selecionados.length === 0) return false;
      if (tipo.minimoSelecionados && selecionados.length < tipo.minimoSelecionados) return false;
      if (tipo.maximoSelecionados && selecionados.length > tipo.maximoSelecionados) return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!isValid()) {
      setShowAlert(true);
      return;
    }

    const valorBase = produto.precoBase || 0;

    const precoFinalItem = precoTotal;
    const precoUnitarioBase = valorBase;

    const pedido = {
      produtoId: produto._id,
      nome: produto.nome,
      imagem: produto.imagem,
      categoriaType: produto.categoriaType,
      saboresSelecionados,
      bordaSelecionada: bordaSelecionada === "nenhum" ? null : produto.bordasDisponiveis?.find(b => b.nome === bordaSelecionada),
      adicionalSelecionado: adicionalSelecionado === "nenhum" ? null : produto.adicionais?.find(a => a.nome === adicionalSelecionado),
      complementosSelecionados: produto.complementos?.filter(c => complementosSelecionados.includes(c.nome)) || [],
      tiposExtrasSelecionados,
      observacao,
      quantidade,
      precoUnitario: precoUnitarioBase,
      precoTotal: precoFinalItem
    };


    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho")) || [];
    carrinhoAtual.push(pedido);
    localStorage.setItem("carrinho", JSON.stringify(carrinhoAtual));
    setShowSnackbar(true);
    onClose();
  };


  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle>{produto.nome}</DialogTitle>

        <DialogContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            {produto.categoriaType === "pizza" && produto.saboresDisponiveis?.length > 1 ? (
              <Typography variant="subtitle2" fontWeight="normal" color="text.secondary">
                a partir de R$ {
                  produto.saboresDisponiveis.reduce(
                    (min, s) => Math.min(min, parseFloat(s.preco || Infinity)),
                    Infinity
                  ) !== Infinity
                    ? produto.saboresDisponiveis.reduce(
                      (min, s) => Math.min(min, parseFloat(s.preco || Infinity)),
                      Infinity
                    ).toFixed(2)
                    : produto.precoBase.toFixed(2)
                }
              </Typography>
            ) : (
              <Typography variant="subtitle2" fontWeight="normal" color="text.secondary">
                R$ {produto.precoBase?.toFixed(2)}
              </Typography>
            )}

          </Typography>

          {showAlert && (
            <Alert severity="warning" onClose={() => setShowAlert(false)} sx={{ mb: 2 }}>
              Por favor, preencha as opções obrigatórias.
            </Alert>
          )}

          {produto.categoriaType === "pizza" && produto.saboresDisponiveis?.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Sabores {produto.saboresDisponiveis.length > 1 ? `(máx ${produto.maxSabores || 2})` : ""}
              </Typography>
              <Box display="flex" flexDirection="column">
                {produto.saboresDisponiveis.map((s, i) => (
                  <FormControlLabel
                    key={i}
                    control={
                      <Checkbox
                        checked={saboresSelecionados.includes(s.nome)}
                        disabled={produto.saboresDisponiveis.length === 1}
                        onChange={() => {
                          if (saboresSelecionados.includes(s.nome)) {
                            setSaboresSelecionados(prev => prev.filter(n => n !== s.nome));
                          } else if (saboresSelecionados.length < (produto.maxSabores || 2)) {
                            setSaboresSelecionados(prev => [...prev, s.nome]);
                          }
                        }}
                      />
                    }
                    label={`${s.nome} ${s.preco ? `(+R$ ${s.preco})` : ""}`}
                  />
                ))}
              </Box>
            </>
          )}

          {produto.bordasDisponiveis?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography fontWeight="bold">Borda</Typography>
              <RadioGroup
                value={bordaSelecionada}
                onChange={(e) => setBordaSelecionada(e.target.value)}
              >
                <FormControlLabel value="nenhum" control={<Radio />} label="Sem borda" />
                {produto.bordasDisponiveis.map((b, i) => (
                  <FormControlLabel
                    key={i}
                    value={b.nome}
                    control={<Radio />}
                    label={`${b.nome} (+R$ ${b.preco})`}
                  />
                ))}
              </RadioGroup>
            </Box>
          )}

          {produto.adicionais?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography fontWeight="bold">Adicional</Typography>
              <RadioGroup
                value={adicionalSelecionado}
                onChange={(e) => setAdicionalSelecionado(e.target.value)}
              >
                <FormControlLabel value="nenhum" control={<Radio />} label="Sem adicional" />
                {produto.adicionais.map((a, i) => (
                  <FormControlLabel
                    key={i}
                    value={a.nome}
                    control={<Radio />}
                    label={`${a.nome} (+R$ ${a.preco})`}
                  />
                ))}
              </RadioGroup>
            </Box>
          )}

          {produto.tiposExtras?.map((tipo, idx) => {
            if (!Array.isArray(tipo.itens) || tipo.itens.length === 0) return null;
            const selecionados = tiposExtrasSelecionados[tipo.nome] || [];
            return (
              <Box key={idx} sx={{ mt: 3 }}>
                <Typography fontWeight="bold">
                  {tipo.nome} {tipo.obrigatorio && "*"}
                  {tipo.tipoSelecion === "multiplo" && tipo.maximoSelecionados && ` (até ${tipo.maximoSelecionados})`}
                </Typography>

                {tipo.tipoSelecion === "unico" ? (
                  <RadioGroup
                    value={selecionados[0]?.nome || ""}
                    onChange={(e) => {
                      const item = tipo.itens.find(i => i.nome === e.target.value);
                      setTiposExtrasSelecionados(prev => ({ ...prev, [tipo.nome]: item ? [item] : [] }));
                    }}
                  >
                    {!tipo.obrigatorio && <FormControlLabel value="" control={<Radio />} label="Nenhum" />}
                    {tipo.itens.map((item, i) => (
                      <FormControlLabel
                        key={i}
                        value={item.nome}
                        control={<Radio />}
                        label={`${item.nome} (+R$ ${item.preco})`}
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {tipo.itens.map((item, i) => {
                      const isChecked = selecionados.some(s => s.nome === item.nome);
                      return (
                        <FormControlLabel
                          key={i}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={() => {
                                const novos = isChecked
                                  ? selecionados.filter(s => s.nome !== item.nome)
                                  : [...selecionados, item];
                                setTiposExtrasSelecionados(prev => ({ ...prev, [tipo.nome]: novos }));
                              }}
                              disabled={!isChecked && tipo.maximoSelecionados !== undefined && selecionados.length >= tipo.maximoSelecionados}
                            />
                          }
                          label={`${item.nome} (+R$ ${item.preco})`}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}

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
            <Button onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>-</Button>
            <Typography>{quantidade}</Typography>
            <Button onClick={() => setQuantidade(quantidade + 1)}>+</Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ flexDirection: "column", alignItems: "stretch", px: 3, py: 2 }}>
          <Box mb={2} textAlign="center">
            <Typography variant="subtitle2">Total:</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              R$ {precoTotal.toFixed(2)}
            </Typography>
          </Box>

          <Box display="flex" gap={2}>
            <Button fullWidth onClick={onClose} variant="outlined" color="inherit">Cancelar</Button>
            <Button fullWidth variant="contained" color="primary" onClick={handleAddToCart}>Adicionar</Button>
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
