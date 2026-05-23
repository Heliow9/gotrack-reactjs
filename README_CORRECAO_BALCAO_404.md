# Correção balcão 404 - Movyo Garçom

Corrigido o erro 404 no pagamento do pedido de balcão.

## Causa
O app estava chamando endpoints inexistentes:

- `/api/garcons/app/balcao`
- `/api/garcons/app/balcao/:pedidoId/itens`
- `/api/garcons/app/balcao/:pedidoId/pagamento`
- `/api/garcons/app/balcao/:pedidoId/pix`

Mas a API atual expõe o módulo balcão em:

- `/api/balcao`
- `/api/balcao/:pedidoId/itens`
- `/api/balcao/:pedidoId/pagamento`
- `/api/balcao/:pedidoId/pix`

## Arquivo alterado

- `src/screens/BalcaoScreen.js`

