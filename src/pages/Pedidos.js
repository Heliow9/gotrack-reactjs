import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  Card, CardContent, Typography, Button, Chip, Stack, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Select, InputLabel, FormControl, Grid
} from '@mui/material';

const DashboardPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState("");
  const [entregadores, setEntregadores] = useState([])
  const [filtros, setFiltros] = useState({
    status: "todos",
    entregador: "todos",
    periodo: "diario",
  });

  const restauranteId = localStorage.getItem("_id");

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await axios.get(`http://168.75.78.51/api/pedidos/${restauranteId}`);
        setPedidos(res.data);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      }
    };

    const fetchEntregadores = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`https://gotrackapi.onrender.com/byRestaurante/${restauranteId}`, {
          headers: {
            authorization: token
          }
        });
        setEntregadores(res.data);
      } catch (err) {
        console.error("Erro ao buscar entregadores:", err);
      }
    };

    fetchEntregadores();


    fetchPedidos();
  }, [restauranteId]);

  const aplicarFiltro = (pedido) => {
    const hoje = dayjs();
    const criado = dayjs(pedido.criadoEm);

    if (filtros.status !== "todos" && pedido.status !== filtros.status)
      return false;

    if (
      filtros.entregador !== "todos" &&
      String(pedido.entregador?._id) !== String(filtros.entregador)
    )
      return false;

    // ❌ COMENTE ESSA PARTE TEMPORARIAMENTE:
    // if (filtros.periodo === "diario" && !criado.isSame(hoje, 'day'))
    //   return false;

    // if (filtros.periodo === "semanal" && !criado.isAfter(hoje.subtract(7, 'day')))
    //   return false;

    // if (filtros.periodo === "mensal" && !criado.isAfter(hoje.subtract(30, 'day')))
    //   return false;

    return true;
  };


  const renderPedidos = (titulo, statusFiltro) => {
    const filtrados = pedidos.filter(p => p.status === statusFiltro && aplicarFiltro(p));
    if (filtrados.length === 0) return null;

    return (
      <>
        <Typography variant="h5" mt={4} mb={2}>{titulo}</Typography>
        <Stack spacing={2}>
          {filtrados.map((pedido) => (
            <Card key={pedido._id}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6">{pedido.nomeCliente}</Typography>
                  <Chip label={pedido.status} color="info" />
                </Stack>
                <Typography variant="body2">Tel: {pedido.telefoneCliente}</Typography>
                <Typography variant="body2">Endereço: {pedido.enderecoCliente}, {pedido.residenciaNumero} - {pedido.residenciaBairro}</Typography>
                <Typography variant="body2">Referência: {pedido.residenciaReferencia}</Typography>

                {pedido.itens.map((item, idx) => (
                  <Typography key={idx} variant="body2">
                    {item.quantidade}x {item.nome} - R$ {parseFloat(item.precoUnitario || 0).toFixed(2)}
                  </Typography>
                ))}

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle1">
                  <strong>Total:</strong> R$ {(pedido.valorTotal)}
                </Typography>


                {pedido.entregador && (
                  <Typography variant="body2" color="textSecondary">
                    Entregador: {pedido.entregador.nome}
                  </Typography>
                )}

                {
                  console.log(pedido)
                }
              </CardContent>
            </Card>
          ))}
        </Stack>
      </>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4">📦 Painel de Pedidos</Typography>

      {/* Filtros */}
      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filtros.status}
              label="Status"
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
              <MenuItem value="aguardando_resposta">Aguardando Resposta</MenuItem>
              <MenuItem value="aceito">Aceito</MenuItem>
              <MenuItem value="em_entrega">Em Entrega</MenuItem>
              <MenuItem value="concluido">Concluído</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Período</InputLabel>
            <Select
              value={filtros.periodo}
              label="Período"
              onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
            >
              <MenuItem value="diario">Diário</MenuItem>
              <MenuItem value="semanal">Semanal</MenuItem>
              <MenuItem value="mensal">Mensal</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Entregador</InputLabel>
            <Select
              value={filtros.entregador}
              label="Entregador"
              onChange={(e) => setFiltros({ ...filtros, entregador: e.target.value })}
            >
              <MenuItem value="todos">Todos</MenuItem>
              {entregadores.map((ent) => (
                <MenuItem key={ent._id} value={ent._id}>{ent.nome}</MenuItem>
              ))}

            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {renderPedidos("📥 Pendentes", "pendente")}
      {renderPedidos("🕒 Aguardando Resposta", "aguardando_resposta")}
      {renderPedidos("✅ Aceitos", "aceito")}
      {renderPedidos("🛵 Em Entrega", "em_entrega")}
      {renderPedidos("🎉 Concluídos", "concluido")}
    </div>
  );
};

export default DashboardPedidos;
