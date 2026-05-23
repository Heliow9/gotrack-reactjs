# Ajustes Movyo Garçom — Balcão

Incluído nesta versão:

- Balcão por categorias: o garçom escolhe a categoria e vê apenas os itens dela.
- Busca continua funcionando por produto ou categoria.
- Barra fixa inferior com total e botão de confirmação/gerar PIX sempre visível.
- Não precisa mais rolar até o final para escolher/confirmar pagamento.
- Envio de PIX via WhatsApp normaliza telefone brasileiro automaticamente.
  - Exemplo digitado: 81994262615
  - Enviado para API/bot: 5581994262615
- Envio de WhatsApp agora manda também resumo do carrinho, total, nome do cliente e PIX copia e cola.
- Layout do balcão refinado para uso rápido em restaurante com muitos itens.

Observação:
- A confirmação automática do PIX depende do backend/webhook Mercado Pago atualizar o pedido. O app mantém o pedido PIX como aguardando confirmação.
