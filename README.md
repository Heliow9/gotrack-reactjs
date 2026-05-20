# Movyo Vitrine

Vitrine pública enxuta da Movyo, integrada à API oficial.

## Rotas mantidas

- `/` vitrine usando restaurante salvo no navegador
- `/:slug` carrega restaurante pelo slug e abre a vitrine
- `/p` vitrine pública
- `/p/:slug` carrega restaurante pelo slug e abre a vitrine
- `/p/carrinho` carrinho
- `/p/checkout` checkout
- `/p/meus-pedidos/:telefone` pedidos do cliente
- `/acompanhar/:token` acompanhamento da entrega
- `/erro` tela de erro pública

## Variáveis de ambiente

```env
VITE_API_URL=https://api.movyo.delivery
VITE_MP_PUBLIC_KEY=sua_public_key_mercado_pago
VITE_MAPBOX_TOKEN=seu_token_publico_mapbox
```

`VITE_API_URL` pode ser informado com ou sem `/api`. A aplicação normaliza automaticamente.

## Rodar

```bash
npm install --legacy-peer-deps
npm run dev
```

## Build

```bash
npm run build
```
