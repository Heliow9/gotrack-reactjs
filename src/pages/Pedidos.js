import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Button, Chip, Stack, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';

const motoristasDisponiveis = [
  { email: "entregador1@email.com", nome: "Pedro Santos" },
  { email: "entregador2@email.com", nome: "Juliana Lima" },
  { email: "entregador3@email.com", nome: "Carlos Alves" },
];

const pedidosExemplo = [
  {
    _id: "1",
    nomeCliente: "João Silva",
    telefoneCliente: "(81) 91234-5678",
    endereco: "Rua das Flores, 123 - Recife",
    itens: [
      { nome: "Hambúrguer", quantidade: 2, precoUnitario: 18.5 },
      { nome: "Batata Frita", quantidade: 1, precoUnitario: 10 }
    ],
    valorTotal: 47,
    restauranteId: "67f07aa3cc3cc5b6e0ebd503",
    motoristaEmail: null,
    status: "pendente",
    criadoEm: new Date()
  }
];

const novoPedido = {
  _id: "2",
  nomeCliente: "Laura Mendes",
  telefoneCliente: "(81) 99876-4321",
  endereco: "Rua Nova Esperança, 456 - Olinda",
  itens: [
    { nome: "Tapioca com queijo", quantidade: 1, precoUnitario: 12 },
    { nome: "Suco de laranja", quantidade: 1, precoUnitario: 6 }
  ],
  valorTotal: 18,
  restauranteId: "67f07aa3cc3cc5b6e0ebd503",
  motoristaEmail: null,
  status: "pendente",
  criadoEm: new Date()
};

const DashboardPedidos = () => {
  const [pedidos, setPedidos] = useState(pedidosExemplo);
  const [openDialog, setOpenDialog] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState("");

  // Solicita permissão de notificação no carregamento
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Simular novo pedido após 10 segundos
    const timeout = setTimeout(() => {
      setPedidos((prev) => [...prev, novoPedido]);

      if (Notification.permission === "granted") {
        new Notification("📦 Novo pedido recebido!", {
          body: `Pedido de ${novoPedido.nomeCliente} chegou.`,
        });
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const abrirDialogo = (pedido) => {
    setPedidoSelecionado(pedido);
    setOpenDialog(true);
  };

  const fecharDialogo = () => {
    setOpenDialog(false);
    setMotoristaSelecionado("");
  };

  const encaminharPedido = () => {
    if (!pedidoSelecionado || !motoristaSelecionado) return;

    setPedidos((prev) =>
      prev.map((p) =>
        p._id === pedidoSelecionado._id
          ? { ...p, status: "aguardando_resposta", motoristaEmail: motoristaSelecionado }
          : p
      )
    );

    fecharDialogo();
  };

  return (
    <div style={{ padding: 20, backgroundColor: "#f6f6f6", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom>📦 Pedidos Pendentes</Typography>

      <Stack spacing={3}>
        {pedidos
          .filter(p => p.status === "pendente" || p.status === "recusado")
          .map((pedido) => (
            <Card key={pedido._id}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6">{pedido.nomeCliente}</Typography>
                  <Chip label={pedido.status} color="warning" />
                </Stack>
                <Typography variant="body2">Tel: {pedido.telefoneCliente}</Typography>
                <Typography variant="body2">Endereço: {pedido.endereco}</Typography>

                <Divider style={{ margin: '10px 0' }} />

                {pedido.itens.map((item, idx) => (
                  <Typography key={idx} variant="body2">
                    {item.quantidade}x {item.nome} - R$ {item.precoUnitario.toFixed(2)}
                  </Typography>
                ))}

                <Divider style={{ margin: '10px 0' }} />

                <Typography variant="subtitle1">
                  <strong>Total:</strong> R$ {pedido.valorTotal.toFixed(2)}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => abrirDialogo(pedido)}
                  sx={{ mt: 2 }}
                >
                  Encaminhar para entregador
                </Button>
              </CardContent>
            </Card>
          ))}
      </Stack>

      {/* Modal de seleção de entregador */}
      <Dialog open={openDialog} onClose={fecharDialogo}>
        <DialogTitle>Selecionar Entregador</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Entregador</InputLabel>
            <Select
              value={motoristaSelecionado}
              onChange={(e) => setMotoristaSelecionado(e.target.value)}
              label="Entregador"
            >
              {motoristasDisponiveis.map((motorista) => (
                <MenuItem key={motorista.email} value={motorista.email}>
                  {motorista.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialogo}>Cancelar</Button>
          <Button variant="contained" onClick={encaminharPedido} disabled={!motoristaSelecionado}>
            Enviar Pedido
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DashboardPedidos;
