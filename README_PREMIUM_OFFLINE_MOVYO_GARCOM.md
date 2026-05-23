# Movyo Garçom — Premium UI + Offline-first

## Melhorias adicionadas

### Dashboard premium
- Tela inicial redesenhada em estilo SaaS moderno.
- KPIs: mesas abertas, pedidos pendentes, vendas do turno e tempo médio.
- Ranking dos garçons com fallback seguro quando a API ainda não retorna ranking.
- Indicador de conexão: online, offline, cache e pendências.
- Botão de sincronização manual.
- Skeleton loading e microinterações com Animated/LayoutAnimation.

### Offline-first
- Cache inteligente com AsyncStorage.
- Dashboard abre com último resumo salvo se estiver sem internet.
- Pedidos carregam do cache quando a API estiver indisponível.
- Catálogo/cardápio da comanda fica salvo localmente.
- Comanda usa cache e mantém itens pendentes em fila local.
- Quando a internet volta, a fila offline é enviada automaticamente para a API.

### Performance/estabilidade
- Centralização de cache em `src/utils/smartCache.js`.
- Correção do `getQueueCountByMesa` usado pela comanda.
- Correção de variável duplicada `rid` na Comanda.
- Menos alertas quando a falha é apenas conexão.
- UI informa claramente quando está usando cache.

## Arquivos principais alterados
- `src/screens/HomeScreen.js`
- `src/screens/PedidosScreen.js`
- `src/screens/ComandaScreen.js`
- `src/utils/offlineQueue.js`
- `src/utils/smartCache.js`

## Observação sobre Framer Motion
No app Expo/React Native, usei `Animated` e `LayoutAnimation`, que são nativos do React Native e não quebram o build mobile. Framer Motion é focado em web/React DOM; para mobile puro o caminho seguro é Animated/Reanimated.

## API
Incluí também um pacote separado com ajuste opcional da API para enriquecer `/api/garcons/app/resumo` com:
- `mesasAbertas`
- `pedidosPendentes`
- `vendasTurno`
- `tempoMedio`
- `rankingGarcons`

Mesmo sem esse patch, o app funciona usando fallback seguro.
