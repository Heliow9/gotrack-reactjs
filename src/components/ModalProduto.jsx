import React, { useState, useEffect, useMemo } from "react";
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
  Box,
  Alert,
  Snackbar,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const DEFAULT_IMAGE_URL =
  "https://cdn-icons-png.flaticon.com/512/1404/1404945.png";

const ModalProduto = ({ open, onClose, produto }) => {
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [bordaSelecionada, setBordaSelecionada] = useState("nenhum");
  const [complementosSelecionados, setComplementosSelecionados] = useState([]);
  const [adicionalSelecionado, setAdicionalSelecionado] = useState("nenhum");
  const [tiposExtrasSelecionados, setTiposExtrasSelecionados] = useState({});
  const [observacao, setObservacao] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [validationError, setValidationError] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Reset de estado sempre que abrir um produto novo
  useEffect(() => {
    if (!open || !produto) return;

    setSaboresSelecionados([]);
    setBordaSelecionada("nenhum");
    setComplementosSelecionados([]);
    setAdicionalSelecionado("nenhum");
    setTiposExtrasSelecionados({});
    setObservacao("");
    setQuantidade(1);
    setValidationError("");

    // Auto selecionar sabor único
    if (produto?.saboresDisponiveis?.length === 1) {
      setSaboresSelecionados([produto.saboresDisponiveis[0].nome]);
    }

    // Auto seleção de extras obrigatórios
    const autoSelectExtras = {};
    produto?.tiposExtras?.forEach((tipo) => {
      if (tipo.tipoSelecion === "unico" && tipo.itens?.length === 1) {
        autoSelectExtras[tipo.nome] = [tipo.itens[0]];
      }
      if (
        tipo.tipoSelecion === "multiplo" &&
        tipo.obrigatorio &&
        tipo.minimoSelecionados > 0
      ) {
        autoSelectExtras[tipo.nome] =
          tipo.itens?.slice(0, tipo.minimoSelecionados) || [];
      }
    });
    setTiposExtrasSelecionados(autoSelectExtras);
  }, [open, produto]);

  // Cálculo do preço total (memoizado)
  const precoTotal = useMemo(() => {
    if (!produto) return 0;

    let total = produto.precoBase || 0;

    // PIZZA: cálculo por sabores
    if (produto.categoriaType === "pizza" && saboresSelecionados.length > 0) {
      const precos = saboresSelecionados.map((nome) => {
        const sabor = produto.saboresDisponiveis?.find((s) => s.nome === nome);
        return parseFloat(sabor?.preco || 0);
      });

      if (precos.length) {
        if (produto.calculoPrecoPor === "media") {
          const soma = precos.reduce((acc, v) => acc + v, 0);
          total = soma / precos.length;
        } else {
          total = Math.max(...precos);
        }
      }
    }

    // Borda
    if (bordaSelecionada !== "nenhum") {
      const borda = produto.bordasDisponiveis?.find(
        (b) => b.nome === bordaSelecionada
      );
      total += parseFloat(borda?.preco || 0);
    }

    // Adicional
    if (adicionalSelecionado !== "nenhum") {
      const adicional = produto.adicionais?.find(
        (a) => a.nome === adicionalSelecionado
      );
      total += parseFloat(adicional?.preco || 0);
    }

    // Complementos
    complementosSelecionados.forEach((nome) => {
      const comp = produto.complementos?.find((c) => c.nome === nome);
      total += parseFloat(comp?.preco || 0);
    });

    // Tipos Extras
    Object.entries(tiposExtrasSelecionados).forEach(([, itens]) => {
      if (Array.isArray(itens)) {
        for (const item of itens) {
          const preco =
            typeof item?.preco === "number"
              ? item.preco
              : parseFloat(item?.preco || 0);
          total += preco;
        }
      }
    });

    total *= quantidade;
    return Number.isFinite(total) ? total : 0;
  }, [
    produto,
    saboresSelecionados,
    bordaSelecionada,
    adicionalSelecionado,
    complementosSelecionados,
    tiposExtrasSelecionados,
    quantidade,
  ]);

  if (!produto) return null;

  // Validação com mensagens mais específicas
  const validate = () => {
    if (produto.categoriaType === "pizza") {
      const requiredCount = produto.maxSabores || 2;

      if (produto.saboresDisponiveis?.length > 1) {
        if (saboresSelecionados.length !== requiredCount) {
          return `Selecione exatamente ${requiredCount} sabor(es).`;
        }
      } else if (
        produto.saboresDisponiveis?.length === 1 &&
        saboresSelecionados.length !== 1
      ) {
        return "Selecione o sabor da pizza.";
      }
    }

    const tipos = produto.tiposExtras || [];
    for (const tipo of tipos) {
      const selecionados = tiposExtrasSelecionados[tipo.nome] || [];
      if (tipo.obrigatorio && selecionados.length === 0) {
        return `Selecione pelo menos uma opção em "${tipo.nome}".`;
      }
      if (
        tipo.minimoSelecionados &&
        selecionados.length < tipo.minimoSelecionados
      ) {
        return `Selecione pelo menos ${tipo.minimoSelecionados} opção(ões) em "${tipo.nome}".`;
      }
      if (
        tipo.maximoSelecionados &&
        selecionados.length > tipo.maximoSelecionados
      ) {
        return `Você pode escolher no máximo ${tipo.maximoSelecionados} opção(ões) em "${tipo.nome}".`;
      }
    }

    return "";
  };

  const handleAddToCart = () => {
    const errorMessage = validate();
    if (errorMessage) {
      setValidationError(errorMessage);
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
      bordaSelecionada:
        bordaSelecionada === "nenhum"
          ? null
          : produto.bordasDisponiveis?.find((b) => b.nome === bordaSelecionada),
      adicionalSelecionado:
        adicionalSelecionado === "nenhum"
          ? null
          : produto.adicionais?.find((a) => a.nome === adicionalSelecionado),
      complementosSelecionados:
        produto.complementos?.filter((c) =>
          complementosSelecionados.includes(c.nome)
        ) || [],
      tiposExtrasSelecionados,
      observacao,
      quantidade,
      precoUnitario: precoUnitarioBase,
      precoTotal: precoFinalItem,
    };

    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho")) || [];
    carrinhoAtual.push(pedido);
    localStorage.setItem("carrinho", JSON.stringify(carrinhoAtual));

    setShowSnackbar(true);
    onClose();
  };

  const maxSabores = produto.maxSabores || 2;
  const isPizzaMultiSabor =
    produto.categoriaType === "pizza" &&
    produto.saboresDisponiveis?.length > 1 &&
    maxSabores > 1;

  const mostrarPrecoBasePizza =
    produto.categoriaType === "pizza" &&
    produto.saboresDisponiveis?.length > 1;

  const precoPizzaAPartir = mostrarPrecoBasePizza
    ? (() => {
        const min = produto.saboresDisponiveis.reduce(
          (menor, s) =>
            Math.min(menor, parseFloat(s.preco || Number.POSITIVE_INFINITY)),
          Number.POSITIVE_INFINITY
        );
        if (!isFinite(min)) return produto.precoBase || 0;
        return min;
      })()
    : produto.precoBase || 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: { xs: "18px 18px 0 0", sm: 3 },
            position: { xs: "fixed", sm: "relative" },
            bottom: { xs: 0, sm: "auto" },
            m: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ pr: 2, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {produto.nome}
          </Typography>
          <IconButton edge="end" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {/* Imagem do produto */}
          <Box
            sx={{
              mb: 2,
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              component="img"
              src={produto.imagem || DEFAULT_IMAGE_URL}
              alt={produto.nome}
              sx={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>

          {/* Preço base / a partir de */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {produto.descricao}
            </Typography>

            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h6" fontWeight={700} color="primary">
                {mostrarPrecoBasePizza ? "a partir de " : ""}
                R$ {precoPizzaAPartir.toFixed(2)}
              </Typography>
            </Stack>
          </Box>

          {/* Alertas de validação */}
          {validationError && (
            <Alert
              severity="warning"
              onClose={() => setValidationError("")}
              sx={{ mb: 2 }}
            >
              {validationError}
            </Alert>
          )}

          {/* Sabores */}
          {produto.categoriaType === "pizza" &&
            produto.saboresDisponiveis?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Sabores{" "}
                  {isPizzaMultiSabor
                    ? `(escolha exatamente ${maxSabores})`
                    : ""}
                </Typography>

                {/* Se for só 1 sabor possível ou maxSabores = 1 → Radio */}
                {produto.saboresDisponiveis.length === 1 ||
                maxSabores === 1 ? (
                  <RadioGroup
                    value={saboresSelecionados[0] || ""}
                    onChange={(e) =>
                      setSaboresSelecionados(
                        e.target.value ? [e.target.value] : []
                      )
                    }
                  >
                    {produto.saboresDisponiveis.map((s, i) => (
                      <FormControlLabel
                        key={i}
                        value={s.nome}
                        control={<Radio />}
                        label={
                          s.preco
                            ? `${s.nome} (+R$ ${parseFloat(
                                s.preco
                              ).toFixed(2)})`
                            : s.nome
                        }
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  // multi-sabor com checkbox
                  <Box display="flex" flexDirection="column">
                    {produto.saboresDisponiveis.map((s, i) => {
                      const checked = saboresSelecionados.includes(s.nome);
                      const desabilitado =
                        !checked &&
                        saboresSelecionados.length >= maxSabores &&
                        maxSabores > 0;
                      return (
                        <FormControlLabel
                          key={i}
                          control={
                            <Checkbox
                              checked={checked}
                              disabled={desabilitado}
                              onChange={() => {
                                if (checked) {
                                  setSaboresSelecionados((prev) =>
                                    prev.filter((n) => n !== s.nome)
                                  );
                                } else if (
                                  saboresSelecionados.length < maxSabores
                                ) {
                                  setSaboresSelecionados((prev) => [
                                    ...prev,
                                    s.nome,
                                  ]);
                                }
                              }}
                            />
                          }
                          label={
                            s.preco
                              ? `${s.nome} (+R$ ${parseFloat(
                                  s.preco
                                ).toFixed(2)})`
                              : s.nome
                          }
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}

          {/* Bordas */}
          {produto.bordasDisponiveis?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography fontWeight="bold" gutterBottom>
                Borda
              </Typography>
              <RadioGroup
                value={bordaSelecionada}
                onChange={(e) => setBordaSelecionada(e.target.value)}
              >
                <FormControlLabel
                  value="nenhum"
                  control={<Radio />}
                  label="Sem borda"
                />
                {produto.bordasDisponiveis.map((b, i) => (
                  <FormControlLabel
                    key={i}
                    value={b.nome}
                    control={<Radio />}
                    label={`${b.nome} (+R$ ${parseFloat(b.preco).toFixed(2)})`}
                  />
                ))}
              </RadioGroup>
            </Box>
          )}

          {/* Adicionais */}
          {produto.adicionais?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography fontWeight="bold" gutterBottom>
                Adicional
              </Typography>
              <RadioGroup
                value={adicionalSelecionado}
                onChange={(e) => setAdicionalSelecionado(e.target.value)}
              >
                <FormControlLabel
                  value="nenhum"
                  control={<Radio />}
                  label="Sem adicional"
                />
                {produto.adicionais.map((a, i) => (
                  <FormControlLabel
                    key={i}
                    value={a.nome}
                    control={<Radio />}
                    label={`${a.nome} (+R$ ${parseFloat(a.preco).toFixed(2)})`}
                  />
                ))}
              </RadioGroup>
            </Box>
          )}

          {/* Tipos de extras dinâmicos */}
          {produto.tiposExtras?.map((tipo, idx) => {
            if (!Array.isArray(tipo.itens) || tipo.itens.length === 0)
              return null;

            const selecionados = tiposExtrasSelecionados[tipo.nome] || [];

            return (
              <Box key={idx} sx={{ mt: 3 }}>
                <Typography fontWeight="bold" gutterBottom>
                  {tipo.nome} {tipo.obrigatorio && "*"}
                  {tipo.tipoSelecion === "multiplo" &&
                    tipo.maximoSelecionados &&
                    ` (até ${tipo.maximoSelecionados})`}
                </Typography>

                {tipo.tipoSelecion === "unico" ? (
                  <RadioGroup
                    value={selecionados[0]?.nome || ""}
                    onChange={(e) => {
                      const item = tipo.itens.find(
                        (i) => i.nome === e.target.value
                      );
                      setTiposExtrasSelecionados((prev) => ({
                        ...prev,
                        [tipo.nome]: item ? [item] : [],
                      }));
                    }}
                  >
                    {!tipo.obrigatorio && (
                      <FormControlLabel
                        value=""
                        control={<Radio />}
                        label="Nenhum"
                      />
                    )}
                    {tipo.itens.map((item, i) => (
                      <FormControlLabel
                        key={i}
                        value={item.nome}
                        control={<Radio />}
                        label={`${item.nome} (+R$ ${parseFloat(
                          item.preco
                        ).toFixed(2)})`}
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {tipo.itens.map((item, i) => {
                      const isChecked = selecionados.some(
                        (s) => s.nome === item.nome
                      );
                      const disabled =
                        !isChecked &&
                        tipo.maximoSelecionados !== undefined &&
                        selecionados.length >= tipo.maximoSelecionados;

                      return (
                        <FormControlLabel
                          key={i}
                          control={
                            <Checkbox
                              checked={isChecked}
                              disabled={disabled}
                              onChange={() => {
                                const novos = isChecked
                                  ? selecionados.filter(
                                      (s) => s.nome !== item.nome
                                    )
                                  : [...selecionados, item];
                                setTiposExtrasSelecionados((prev) => ({
                                  ...prev,
                                  [tipo.nome]: novos,
                                }));
                              }}
                            />
                          }
                          label={`${item.nome} (+R$ ${parseFloat(
                            item.preco
                          ).toFixed(2)})`}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Complementos simples (se existir no schema) */}
          {produto.complementos?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography fontWeight="bold" gutterBottom>
                Complementos
              </Typography>
              <Box display="flex" flexDirection="column">
                {produto.complementos.map((c, i) => {
                  const checked = complementosSelecionados.includes(c.nome);
                  return (
                    <FormControlLabel
                      key={i}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={() => {
                            setComplementosSelecionados((prev) =>
                              checked
                                ? prev.filter((n) => n !== c.nome)
                                : [...prev, c.nome]
                            );
                          }}
                        />
                      }
                      label={`${c.nome} (+R$ ${parseFloat(
                        c.preco
                      ).toFixed(2)})`}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Observações */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Observações"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            sx={{ mt: 3 }}
          />

          {/* Quantidade */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 3 }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Quantidade
            </Typography>
            <Box display="flex" alignItems="center" gap={1.5}>
              <IconButton
                size="small"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              >
                <RemoveIcon />
              </IconButton>
              <Typography>{quantidade}</Typography>
              <IconButton
                size="small"
                onClick={() => setQuantidade((q) => q + 1)}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>

        {/* Ações fixas com total */}
        <DialogActions
          sx={{
            flexDirection: "column",
            alignItems: "stretch",
            px: 2,
            pb: 2,
            pt: 1,
            borderTop: "1px solid #eee",
            position: "sticky",
            bottom: 0,
            backgroundColor: "#fff",
            zIndex: 2,
          }}
        >
          <Box
            mb={1}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              R$ {precoTotal.toFixed(2)}
            </Typography>
          </Box>

          <Box display="flex" gap={1}>
            <Button
              fullWidth
              onClick={onClose}
              variant="outlined"
              color="inherit"
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              onClick={handleAddToCart}
              sx={{
                background: "linear-gradient(90deg,#ff4b8b,#ff7a3d)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "12px",
                "&:hover": {
                  opacity: 0.9,
                  background: "linear-gradient(90deg,#ff4b8b,#ff7a3d)",
                },
              }}
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
};

export default ModalProduto;
