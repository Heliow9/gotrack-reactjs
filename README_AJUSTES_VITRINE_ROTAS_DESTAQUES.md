# Ajustes aplicados na vitrine Movyo

## Fluxo de pagamento

No checkout da vitrine, o payload enviado para a API agora leva campos compatíveis com a API nova de relatórios e com o fluxo anti-pedido-fantasma:

- `formadePagamento`: compatibilidade antiga
- `formaPagamento`: `pix` ou `cartao`
- `metodoPagamento`: `pix` ou `cartao`
- `statusPagamento`: `aguardando_pagamento`
- `statusPedido`: `aguardando_pagamento`
- `status`: `aguardando_pagamento`
- `origem`: `vitrine`

Assim, PIX/cartão da vitrine nascem como pendentes e só devem aparecer no desktop depois da confirmação do Mercado Pago pela API/webhook.

## Rotas conferidas

Rotas principais usadas pela vitrine:

- `GET /api/restaurantes/:slug`
- `GET /api/produtos/:restauranteId`
- `GET /api/restaurantes/horario/:restauranteId`
- `GET /api/mercadopago/status/:restauranteId`
- `POST /api/pedidos/`
- `GET /api/publico/mercadopago/pix/status/:pedidoId`
- `POST /api/publico/pedidos/:id/cancelar-pix`
- `GET /api/publico/pedidos/:telefone`

## UI/UX de destaques

A seção de produtos em destaque foi reposicionada e redesenhada para ficar mais premium:

- card em bloco visual separado;
- fundo com gradiente Movyo;
- cards maiores com imagem destacada;
- botão direto de pedido;
- scroll lateral responsivo;
- destaque ordenado e com ranking visual.

## Observação

Não removi rotas antigas nem campos antigos. As mudanças foram feitas para manter compatibilidade com a API atual e com versões anteriores.
