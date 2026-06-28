# Movyo Vitrine Pública — versão otimizada

## O que foi ajustado

- Removido o fluxo de admin/desktop do projeto da vitrine.
- `src/App.jsx` agora mantém somente rotas públicas:
  - `/p`
  - `/p/:slug`
  - `/p/carrinho`
  - `/p/checkout`
  - `/p/meus-pedidos`
  - `/p/meus-pedidos/:telefone`
  - `/acompanhar/:token`
- Rotas públicas carregam com `React.lazy`, reduzindo o JS inicial.
- `Publico.jsx` agora tenta primeiro a rota rápida da API: `/api/vitrine/cardapio/:slug`.
- Foi mantido fallback para as rotas antigas para não quebrar enquanto a API nova não estiver publicada.
- `Checkout.jsx` agora tenta primeiro `/api/vitrine/checkout-config/:restauranteId`.
- Polling de PIX ganhou backoff para reduzir carga na API.
- Contador do carrinho parou de usar `setInterval` e agora usa evento `movyo:carrinhoAtualizado`.
- `server.cjs` agora usa cache correto para assets do Vite e `no-cache` no HTML.
- Manifest PWA atualizado para Movyo Food.
- Novo build em `dist/` já gerado.

## Build validado

Executado com sucesso:

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run build
```

## Observação

A rota `/acompanhar/:token` mantém o mapa, mas o Mapbox agora é carregado sob demanda. Ele não pesa na abertura da vitrine/cardápio.
