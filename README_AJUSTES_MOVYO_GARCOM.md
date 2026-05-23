# Movyo Garçom — ajustes aplicados

## Padronização com front desktop
- Tema padrão alterado para **Movyo Premium** (`#ff3b8a` → `#ff9b2d`).
- Tela de pedidos redesenhada com cartões premium, KPIs, busca, filtros por status e atualização em tempo real via socket.
- Visual mantido responsivo para mobile/tablet, com cards arredondados, sombras leves e fundo claro como o front desktop.

## Funcionalidades revisadas
- API centralizada em `src/api/config.js` usando `EXPO_PUBLIC_API_URL`.
- Socket usa a mesma URL da API, sem hardcode duplicado.
- Fila offline corrigida para usar a rota correta do app do garçom:
  `/api/garcons/app/mesa/:mesaId/itens`.
- Perfil corrigido para buscar `/api/garcons/app/me`.
- Tela **Pedidos** deixou de ser placeholder e agora lista pedidos, busca, filtra, atualiza por pull-to-refresh/socket e permite cancelar pedido/item conforme permissão do backend.

## Configuração
Crie/edite `.env`:

```env
EXPO_PUBLIC_API_URL=https://api.movyo.delivery
```

Em desenvolvimento local no celular, use o IP da máquina na rede, por exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:10000
```

Depois rode:

```bash
npm install
npm start
```
